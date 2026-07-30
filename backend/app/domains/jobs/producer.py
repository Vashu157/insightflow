import json
import logging
from aiokafka import AIOKafkaProducer
from app.core.config import settings, get_kafka_config
from app.domains.jobs.events import EventSchema

logger = logging.getLogger(__name__)

class KafkaProducerClient:
    def __init__(self):
        self.producer = None

    async def start(self):
        try:
            kafka_config = get_kafka_config()
            self.producer = AIOKafkaProducer(
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                **kafka_config
            )
            await self.producer.start()
            logger.info("Kafka Producer started successfully.")
        except Exception as e:

            logger.error(f"Failed to start Kafka Producer: {e}")
            self.producer = None

    async def stop(self):
        if self.producer:
            await self.producer.stop()
            logger.info("Kafka Producer stopped.")

    async def publish(self, topic: str, event: EventSchema):
        if not self.producer:
            logger.warning("Kafka Producer is not initialized. Event not sent.")
            return
            
        try:
            await self.producer.send_and_wait(topic, value=event.model_dump(mode='json'))
            logger.info(f"Published event {event.event_type} to topic {topic} (Job ID: {event.job_id})")
        except Exception as e:
            logger.error(f"Failed to publish event to {topic}: {e}")

producer_client = KafkaProducerClient()
