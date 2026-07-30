from slowapi import Limiter
from slowapi.util import get_remote_address

# Default limit across the API (200 requests per minute)
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
