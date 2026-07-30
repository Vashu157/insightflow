import asyncio
from typing import Callable, Any

class JobExecutor:
    """
    Abstracts synchronous business logic execution into a threadpool.
    This prevents blocking the asyncio event loop and Kafka heartbeats.
    """
    
    @staticmethod
    async def execute(func: Callable, *args: Any, **kwargs: Any) -> Any:
        """
        Executes a synchronous function in a separate thread.
        If kwargs are provided, we wrap the function call since asyncio.to_thread 
        does not support kwargs directly in standard Python 3.9 without functools.partial.
        """
        import functools
        if kwargs:
            func = functools.partial(func, **kwargs)
        return await asyncio.to_thread(func, *args)
