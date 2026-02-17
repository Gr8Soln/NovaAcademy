"""Notifications API router — list, mark read, SSE stream."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.dependencies import (get_auth_service, get_current_user,
                                   get_notification_push_service,
                                   get_notification_repository,
                                   get_user_repository)
from app.domain.entities.user import User
from app.domain.exceptions import (AuthenticationError,
                                   NotificationNotFoundError)
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.auth_service import IAuthService
from app.interfaces.services.notification_push_service import \
    INotificationPushService
from app.schemas.response import paginated_response, success_response
from app.schemas.social import NotificationResponse, UnreadCountResponse
from app.use_cases.notifications import (GetNotificationsUseCase,
                                         GetUnreadCountUseCase,
                                         MarkAllNotificationsReadUseCase,
                                         MarkNotificationReadUseCase)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/")
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
    total = await notification_repo.count_user_notifications(current_user.id, unread_only=unread_only)
    return paginated_response(
        data=[
            NotificationResponse(
                id=n.id, user_id=n.user_id, type=n.type.value,
                title=n.title, message=n.message, data=n.data,
                is_read=n.is_read, created_at=n.created_at,
            ).model_dump(mode="json")
            for n in notifications
        ],
        message="Notifications retrieved",
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
):
    use_case = GetUnreadCountUseCase(notification_repo)
    count = await use_case.execute(current_user.id)
    return success_response(
        data=UnreadCountResponse(count=count).model_dump(mode="json"),
        message="Unread count retrieved",
    )


@router.put("/{notification_id}/read")
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
    return success_response(message="Notification marked as read")


@router.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
):
    use_case = MarkAllNotificationsReadUseCase(notification_repo)
    await use_case.execute(current_user.id)
    return success_response(message="All notifications marked as read")


@router.get("/stream")
async def notification_stream(
    token: str = Query(..., description="JWT access token for auth"),
    auth_service: IAuthService = Depends(get_auth_service),
    user_repo: IUserRepository = Depends(get_user_repository),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    """Server-Sent Events stream for realtime notifications.

    Uses query param `token` because EventSource doesn't support Authorization headers.
    """
    try:
        user_id = auth_service.decode_access_token(token)
        user = await user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid token")
    except AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    async def event_generator():
        async for notification in push.subscribe(user_id):
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
