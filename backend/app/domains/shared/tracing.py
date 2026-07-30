import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource
from app.domains.shared.logging import current_trace_id, current_span_id

_service_name = os.environ.get("SERVICE_NAME", "insightflow-backend")

resource = Resource.create(attributes={"service.name": _service_name})
provider = TracerProvider(resource=resource)

# ConsoleExporter or No-Op setup for in-process trace availability
if os.environ.get("OTEL_EXPORTER_CONSOLE", "false").lower() == "true":
    processor = SimpleSpanProcessor(ConsoleSpanExporter())
    provider.add_span_processor(processor)

trace.set_tracer_provider(provider)
tracer = trace.get_tracer("insightflow.tracer")

def sync_log_context_with_span(span):
    """Utility to set contextvars trace_id and span_id for structured logging matching OpenTelemetry."""
    if span and span.get_span_context().is_valid:
        ctx = span.get_span_context()
        trace_id_str = f"{ctx.trace_id:032x}"
        span_id_str = f"{ctx.span_id:016x}"
        current_trace_id.set(trace_id_str)
        current_span_id.set(span_id_str)
        return trace_id_str, span_id_str
    return "", ""
