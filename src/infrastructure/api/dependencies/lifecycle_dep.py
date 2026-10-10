from app.core.config import get_settings

from .chat_dep import (get_chat_cache_service, get_chat_presence_service,
                       get_chat_pubsub_service)


async def startup_event() -> None:
    s = get_settings()

    await get_chat_pubsub_service(s)
    await get_chat_presence_service(s)
    await get_chat_cache_service(s)

    print("✅ Chat services initialized")


async def shutdown_event() -> None:
    from . import chat_dep

    if chat_dep._pubsub_instance:
        await chat_dep._pubsub_instance.disconnect()

    if chat_dep._presence_instance:
        await chat_dep._presence_instance.disconnect()

    if chat_dep._cache_instance:
        await chat_dep._cache_instance.disconnect()

    if chat_dep._connection_manager:
        await chat_dep._connection_manager.shutdown()

    print("✅ Chat services shut down gracefully")
