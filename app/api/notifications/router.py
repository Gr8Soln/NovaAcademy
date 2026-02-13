"""Notifications API router — list, mark read, SSE stream."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.dependencies import (get_current_user,
                                   get_notification_push_service,
                                   get_notification_repository)
from app.domain.entities.user import User
from app.domain.exceptions import NotificationNotFoundError
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.services.notification_push_service import \
    INotificationPushService
from app.schemas.social import NotificationResponse, UnreadCountResponse
from app.use_cases.notifications import (GetNotificationsUseCase,
                                         GetUnreadCountUseCase,
                                         MarkAllNotificationsReadUseCase,
                                         MarkNotificationReadUseCase)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
):
    use_case = GetNotificationsUseCase(notification_repo)
    notifications = await use_case.execute(
        user_id=current_user.id, unread_only=unread_only, offset=offset, limit=limit
    )
    return [
        NotificationResponse(
            id=n.id, user_id=n.user_id, type=n.type.value,
            title=n.title, message=n.message, data=n.data,
            is_read=n.is_read, created_at=n.created_at,
        )
        for n in notifications
    ]


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
):
    use_case = GetUnreadCountUseCase(notification_repo)
    count = await use_case.execute(current_user.id)
    return UnreadCountResponse(count=count)


@router.put("/{notification_id}/read", status_code=204)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
):
    use_case = MarkNotificationReadUseCase(notification_repo)
    try:
        await use_case.execute(notification_id, current_user.id)
    except NotificationNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/read-all", status_code=204)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
):
    use_case = MarkAllNotificationsReadUseCase(notification_repo)
    await use_case.execute(current_user.id)


@router.get("/stream")
async def notification_stream(
    current_user: User = Depends(get_current_user),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    """Server-Sent Events stream for realtime notifications."""

    async def event_generator():
        async for notification in push.subscribe(current_user.id):
            import json
            data = json.dumps({
                "id": str(notification.id),
                "type": notification.type.value,
                "title": notification.title,
                "message": notification.message,
                "data": notification.data,
                "created_at": notification.created_at.isoformat(),
            })
            yield f"data: {data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
