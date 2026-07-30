import time
import threading
import logging
from typing import Callable, Any, Optional
from app.domains.shared.metrics import CIRCUIT_BREAKER_STATE

logger = logging.getLogger("insightflow.circuit_breaker")

class CircuitBreakerOpenException(Exception):
    """Raised when call is attempted while Circuit Breaker is OPEN."""
    pass

class CircuitBreaker:
    STATE_CLOSED = "CLOSED"      # 0
    STATE_HALF_OPEN = "HALF_OPEN"# 1
    STATE_OPEN = "OPEN"          # 2

    def __init__(self, name: str, failure_threshold: int = 3, recovery_timeout: float = 30.0):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = self.STATE_CLOSED
        self.failure_count = 0
        self.last_state_change = time.time()
        self._lock = threading.Lock()
        self._update_metric()

    def _update_metric(self):
        state_code = 0 if self.state == self.STATE_CLOSED else (1 if self.state == self.STATE_HALF_OPEN else 2)
        try:
            CIRCUIT_BREAKER_STATE.labels(service_name=self.name).set(state_code)
        except Exception:
            pass

    def call(self, func: Callable, *args, fallback: Optional[Callable] = None, **kwargs) -> Any:
        with self._lock:
            now = time.time()
            if self.state == self.STATE_OPEN:
                if now - self.last_state_change > self.recovery_timeout:
                    self.state = self.STATE_HALF_OPEN
                    self.last_state_change = now
                    self._update_metric()
                    logger.info(f"CircuitBreaker '{self.name}' transition -> HALF_OPEN")
                else:
                    logger.warning(f"CircuitBreaker '{self.name}' is OPEN. Rejecting call.")
                    if fallback:
                        return fallback(*args, **kwargs)
                    raise CircuitBreakerOpenException(f"Circuit Breaker '{self.name}' is OPEN. Service degraded.")

        try:
            result = func(*args, **kwargs)
            with self._lock:
                if self.state in (self.STATE_HALF_OPEN, self.STATE_OPEN):
                    self.state = self.STATE_CLOSED
                    self.failure_count = 0
                    self.last_state_change = time.time()
                    self._update_metric()
                    logger.info(f"CircuitBreaker '{self.name}' restored -> CLOSED")
            return result
        except Exception as e:
            with self._lock:
                self.failure_count += 1
                logger.error(f"CircuitBreaker '{self.name}' call failed ({self.failure_count}/{self.failure_threshold}): {e}")
                if self.failure_count >= self.failure_threshold or self.state == self.STATE_HALF_OPEN:
                    self.state = self.STATE_OPEN
                    self.last_state_change = time.time()
                    self._update_metric()
                    logger.critical(f"CircuitBreaker '{self.name}' tripped -> OPEN")
            if fallback:
                return fallback(*args, **kwargs)
            raise e

gemini_circuit_breaker = CircuitBreaker("gemini_api", failure_threshold=3, recovery_timeout=30.0)
