import asyncio
import json
import logging
import signal
import sys
import os
import time
from typing import Callable, Any

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from sqlalchemy.orm import Session
from sqlalchemy import update

from app.core.config import settings, get_kafka_config
from app.domains.shared.database import SessionLocal
from app.domains.shared.models import Job, ProcessedEvent
from app.domains.jobs.events import EventSchema
from app.domains.jobs.executor import JobExecutor
from app.domains.profiling.dependencies import get_profiling_service
from app.domains.reports.dependencies import get_report_service
from app.domains.shared.logging import (
    logger, current_job_id, current_session_id, current_event_id, current_service_name
)
from app.domains.shared.metrics import (
    KAFKA_MESSAGES_PROCESSED_TOTAL, KAFKA_PROCESSING_DURATION_SECONDS,
    JOB_DURATION_SECONDS, FAILED_JOBS_TOTAL
)
from app.domains.shared.tracing import tracer, sync_log_context_with_span

current_service_name.set("insightflow-worker")

class KafkaWorker:
    def __init__(self):
        self.consumer = None
        self.producer = None
        self.shutdown_event = asyncio.Event()

    async def setup(self):
        logger.info(f"Connecting to Kafka at {settings.KAFKA_BOOTSTRAP_SERVERS}")
        kafka_config = get_kafka_config()
        self.consumer = AIOKafkaConsumer(
            "dataset.uploaded",
            "report.requested",
            group_id="insightflow-workers",
            auto_offset_reset="earliest",
            enable_auto_commit=False,
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            **kafka_config
        )
        self.producer = AIOKafkaProducer(
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            **kafka_config
        )
        await self.consumer.start()
        await self.producer.start()
        logger.info("Kafka Consumer & Producer started.")

    async def teardown(self):
        logger.info("Shutting down worker...")
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()
        logger.info("Worker shutdown complete.")

    def handle_signal(self):
        logger.info("Shutdown signal received. Finishing in-flight jobs...")
        self.shutdown_event.set()

    async def run(self, install_signal_handlers: bool = True):
        await self.setup()

        if install_signal_handlers:
            loop = asyncio.get_running_loop()
            for sig in (signal.SIGINT, signal.SIGTERM):
                try:
                    loop.add_signal_handler(sig, self.handle_signal)
                except (NotImplementedError, RuntimeError):
                    # Signal handlers unsupported on this platform / non-main thread.
                    pass

        try:
            while not self.shutdown_event.is_set():
                msg_pack = await self.consumer.getmany(timeout_ms=1000, max_records=1)
                for tp, messages in msg_pack.items():
                    for msg in messages:
                        await self.process_message(msg)
                        if self.shutdown_event.is_set():
                            break
        except asyncio.CancelledError:
            logger.info("Worker task cancelled.")
        except Exception as e:
            logger.error(f"Worker encountered a fatal error: {e}", exc_info=True)
        finally:
            await self.teardown()

    async def run_embedded(self):
        """Run without installing OS signal handlers; use when embedded in another asyncio app."""
        await self.run(install_signal_handlers=False)

    async def publish_event(self, topic: str, original_event: EventSchema, **kwargs):
        new_event = EventSchema(
            job_id=original_event.job_id,
            session_id=original_event.session_id,
            event_type=topic,
            payload=kwargs
        )
        await self.producer.send_and_wait(topic, value=new_event.model_dump(mode='json'))

    async def process_message(self, msg):
        start_time = time.time()
        event_data = msg.value
        topic = msg.topic

        try:
            event = EventSchema(**event_data)
        except Exception as e:
            logger.error(f"Failed to parse event from topic {topic}: {e}")
            KAFKA_MESSAGES_PROCESSED_TOTAL.labels(topic=topic, status="parse_error").inc()
            await self.consumer.commit()
            return

        current_job_id.set(event.job_id)
        current_session_id.set(event.session_id)
        current_event_id.set(event.event_id)

        with tracer.start_as_current_span(f"worker_process_{topic}") as span:
            sync_log_context_with_span(span)
            logger.info(f"Received event {event.event_type} (Event ID: {event.event_id})")

            db = SessionLocal()
            job_type = "profiling" if topic == "dataset.uploaded" else "report"
            try:
                # 1. Event Deduplication
                existing_event = db.query(ProcessedEvent).filter(ProcessedEvent.event_id == event.event_id).first()
                if existing_event:
                    logger.info(f"Event {event.event_id} already processed. Skipping.")
                    KAFKA_MESSAGES_PROCESSED_TOTAL.labels(topic=topic, status="duplicate").inc()
                    await self.consumer.commit()
                    return

                # Mark event as seen
                processed_event = ProcessedEvent(event_id=event.event_id)
                db.add(processed_event)
                db.commit()

                # 2. Atomic Job Locking
                stmt = (
                    update(Job)
                    .where(Job.id == event.job_id, Job.status == "QUEUED")
                    .values(status="RUNNING")
                )
                result = db.execute(stmt)
                db.commit()

                if result.rowcount == 0:
                    logger.info(f"Job {event.job_id} is not QUEUED. Skipping.")
                    KAFKA_MESSAGES_PROCESSED_TOTAL.labels(topic=topic, status="skipped").inc()
                    await self.consumer.commit()
                    return

                # 3. Execution
                loop = asyncio.get_running_loop()

                def update_progress(pct: int, current_stage: str = "Processing"):
                    db_progress = SessionLocal()
                    try:
                        job = db_progress.query(Job).filter(Job.id == event.job_id).first()
                        if job:
                            job.progress = pct
                            db_progress.commit()
                            logger.info(f"Job {event.job_id} progress -> {pct}%")
                            asyncio.run_coroutine_threadsafe(
                                self.publish_event("job.updates", event, status="RUNNING", current_stage=current_stage, progress=pct),
                                loop
                            )
                    finally:
                        db_progress.close()

                logger.info(f"Starting business logic for Job {event.job_id}")
                await self.publish_event("job.updates", event, status="RUNNING", current_stage="Started", progress=0)

                job_start_time = time.time()
                if topic == "dataset.uploaded":
                    profiling_service = get_profiling_service()
                    await JobExecutor.execute(profiling_service.generate_profile, db, event.session_id, progress_callback=update_progress)
                    # Removed publish to "dataset.profiled" to save Aiven topic limits

                elif topic == "report.requested":
                    report_service = get_report_service()
                    await JobExecutor.execute(report_service.generate_report, db, event.session_id, force_refresh=True, progress_callback=update_progress)
                    # Removed publish to "report.completed" to save Aiven topic limits

                duration = time.time() - job_start_time
                JOB_DURATION_SECONDS.labels(job_type=job_type, status="success").observe(duration)

                # Mark completed
                db.execute(update(Job).where(Job.id == event.job_id).values(status="COMPLETED", progress=100))
                db.commit()

                logger.info(f"Job {event.job_id} completed successfully in {duration:.2f}s.")
                await self.publish_event("job.updates", event, status="COMPLETED", current_stage="Completed", progress=100)
                KAFKA_MESSAGES_PROCESSED_TOTAL.labels(topic=topic, status="success").inc()

            except Exception as e:
                duration = time.time() - start_time
                JOB_DURATION_SECONDS.labels(job_type=job_type, status="failed").observe(duration)
                FAILED_JOBS_TOTAL.labels(job_type=job_type).inc()
                KAFKA_MESSAGES_PROCESSED_TOTAL.labels(topic=topic, status="error").inc()

                logger.error(f"Job {event.job_id} failed: {e}", exc_info=True)
                db.rollback()
                try:
                    db.execute(update(Job).where(Job.id == event.job_id).values(status="FAILED", error_message=str(e)))
                    db.commit()
                except Exception as rollback_err:
                    logger.error(f"Failed to save FAILED state: {rollback_err}")

                dlq_topic = f"{topic}.dlq" if topic == "dataset.uploaded" else "report.failed"
                await self.publish_event(dlq_topic, event, error=str(e))
                await self.publish_event("job.updates", event, status="FAILED", current_stage="Failed", progress=0, error_message=str(e))

            finally:
                db.close()
                KAFKA_PROCESSING_DURATION_SECONDS.labels(topic=topic).observe(time.time() - start_time)
                current_job_id.set("")
                current_session_id.set("")
                current_event_id.set("")

                await self.consumer.commit()

if __name__ == "__main__":
    worker = KafkaWorker()
    try:
        asyncio.run(worker.run())
    except KeyboardInterrupt:
        pass
