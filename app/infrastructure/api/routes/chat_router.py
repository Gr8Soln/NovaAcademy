from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import (APIRouter, Depends, File, Form, HTTPException, Query,
                     UploadFile)
from fastapi.responses import JSONResponse

from app.adapters.schemas import (AddMemberRequest, ChangeMemberRoleRequest,
                                  ClassMemberResponse, ClassResponse,
                                  EditMessageRequest, HandleJoinRequestRequest,
                                  JoinRequestResponse, MessageResponse,
                                  SendMessageRequest, UpdateClassRequest)
from app.application.dtos.enum_dto import MessageType
from app.application.use_cases import (AddClassMemberUseCase,
                                       ChangeClassMemberRoleUseCase,
                                       CreateClassUseCase,
                                       DeleteChatMessageUseCase,
                                       DeleteClassUseCase,
                                       EditChatMessageUseCase,
                                       GetChatMessagesUseCase, GetClassUseCase,
                                       GetJoinRequestsUseCase,
                                       GetUserClassesUseCase,
                                       HandleJoinRequestUseCase,
                                       JoinClassUseCase,
                                       RemoveClassMemberUseCase,
                                       SearchchatMessagesUseCase,
                                       SearchClassesUseCase,
                                       SendChatMessageInput,
                                       SendChatMessageUseCase,
                                       UpdateClassUseCase)
from app.infrastructure.api.dependencies import (
    get_add_class_member_usecase, get_change_class_role_usecase,
    get_chat_messages_use_case, get_chat_presence_service,
    get_chat_send_message_use_case, get_connection_manager,
    get_create_class_usecase, get_current_user_id,
    get_delete_chat_message_use_case, get_delete_class_usecase,
    get_edit_chat_message_use_case, get_get_class_usecase,
    get_get_user_classes_usecase, get_handle_join_request_usecase,
    get_join_class_usecase, get_join_requests_usecase,
    get_remove_class_member_usecase, get_search_chat_messages_use_case,
    get_search_classes_usecase, get_update_class_usecase)

router = APIRouter(prefix="/class", tags=["Class"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _class_response(group) -> ClassResponse:
    members = [
        ClassMemberResponse(
            user_id=m.user_id,
            username=m.username or "",
            role=m.role.value if hasattr(m.role, "value") else m.role,
            joined_at=m.joined_at,
        )
        for m in (group.members or [])
    ]
    return ClassResponse(
        id=group.id,
        code=group.code,
        name=group.name,
        description=group.description,
        avatar_url=group.avatar_url,
        is_private=group.is_private,
        created_by=group.created_by,
        member_count=len(members),
        members=members,
        created_at=group.created_at,
    )


def _join_request_response(jr) -> JoinRequestResponse:
    return JoinRequestResponse(
        id=jr.id,
        class_id=jr.class_id,
        user_id=jr.user_id,
        username=jr.username,
        status=jr.status.value if hasattr(jr.status, "value") else jr.status,
        created_at=jr.created_at,
    )


# ---------------------------------------------------------------------------
# Class CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=ClassResponse, status_code=201)
async def create_class(
    name: str = Form(...),
    description: str = Form(""),
    is_private: bool = Form(False),
    initial_member_usernames: str = Form(""),
    image: Optional[UploadFile] = File(None),
    user_id: UUID = Depends(get_current_user_id),
    use_case: CreateClassUseCase = Depends(get_create_class_usecase),
):
    """
    Create a new class (multipart form).

    Fields:
    - name (required)
    - description (optional)
    - is_private (optional, default false)
    - initial_member_usernames (optional, comma-separated)
    - image (optional file upload)
    """
    usernames = [
        u.strip() for u in initial_member_usernames.split(",") if u.strip()
    ]
    group = await use_case.execute(
        creator_id=user_id,
        name=name,
        description=description,
        avatar_file=image,
        is_private=is_private,
        initial_member_usernames=usernames,
    )
    return _class_response(group)


@router.get("", response_model=list[ClassResponse])
async def get_my_classes(
    user_id: UUID = Depends(get_current_user_id),
    use_case: GetUserClassesUseCase = Depends(get_get_user_classes_usecase),
):
    """Return all classes the current user belongs to."""
    classes = await use_case.execute(user_id=user_id)
    return [_class_response(c) for c in classes]


@router.get("/search", response_model=list[ClassResponse])
async def search_classes(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=50),
    _user_id: UUID = Depends(get_current_user_id),
    use_case: SearchClassesUseCase = Depends(get_search_classes_usecase),
):
    """Search public (non-private) classes."""
    classes = await use_case.execute(query=q, limit=limit)
    return [_class_response(c) for c in classes]


@router.get("/{class_code}", response_model=ClassResponse)
async def get_class(
    class_code: str,
    user_id: UUID = Depends(get_current_user_id),
    use_case: GetClassUseCase = Depends(get_get_class_usecase),
):
    """Return a single class by code (caller must be a member)."""
    try:
        group = await use_case.execute(class_code=class_code, user_id=user_id)
        return _class_response(group)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{class_code}", response_model=ClassResponse)
async def update_class(
    class_code: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    is_private: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None),
    user_id: UUID = Depends(get_current_user_id),
    use_case: UpdateClassUseCase = Depends(get_update_class_usecase),
):
    """Update class metadata (admin/owner only). Multipart form."""
    try:
        group = await use_case.execute(
            class_code=class_code,
            editor_id=user_id,
            name=name,
            description=description,
            avatar_file=image,
            is_private=is_private,
        )
        return _class_response(group)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{class_code}", status_code=204)
async def delete_class(
    class_code: str,
    user_id: UUID = Depends(get_current_user_id),
    use_case: DeleteClassUseCase = Depends(get_delete_class_usecase),
):
    """Delete a class (owner only)."""
    try:
        await use_case.execute(class_code=class_code, user_id=user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ---------------------------------------------------------------------------
# Join / Join requests
# ---------------------------------------------------------------------------

@router.post("/{class_code}/join", status_code=200)
async def join_class(
    class_code: str,
    user_id: UUID = Depends(get_current_user_id),
    use_case: JoinClassUseCase = Depends(get_join_class_usecase),
):
    """
    Join a class by code.
    - Public → joined immediately
    - Private → creates a join request (pending admin approval)
    """
    try:
        result = await use_case.execute(class_code=class_code, user_id=user_id)
        if result["joined"]:
            return {"message": "Joined class successfully", "joined": True}
        else:
            jr = result["join_request"]
            return {
                "message": "Join request submitted. Waiting for admin approval.",
                "joined": False,
                "join_request": _join_request_response(jr),
            }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{class_code}/join-requests", response_model=list[JoinRequestResponse])
async def get_join_requests(
    class_code: str,
    user_id: UUID = Depends(get_current_user_id),
    use_case: GetJoinRequestsUseCase = Depends(get_join_requests_usecase),
):
    """Get pending join requests for a class (admin/owner only)."""
    try:
        requests = await use_case.execute(class_code=class_code, user_id=user_id)
        return [_join_request_response(r) for r in requests]
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{class_code}/join-requests/{request_id}", response_model=JoinRequestResponse)
async def handle_join_request(
    class_code: str,
    request_id: UUID,
    body: HandleJoinRequestRequest,
    user_id: UUID = Depends(get_current_user_id),
    use_case: HandleJoinRequestUseCase = Depends(get_handle_join_request_usecase),
):
    """Accept or reject a join request (admin/owner only)."""
    try:
        result = await use_case.execute(
            class_code=class_code,
            request_id=request_id,
            handler_id=user_id,
            action=body.action,
        )
        return _join_request_response(result)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Participants (members) management
# ---------------------------------------------------------------------------

@router.post("/{class_code}/participants", response_model=ClassResponse, status_code=201)
async def add_member(
    class_code: str,
    request: AddMemberRequest,
    user_id: UUID = Depends(get_current_user_id),
    use_case: AddClassMemberUseCase = Depends(get_add_class_member_usecase),
):
    """Add a user (by username) to a class (admin/owner only)."""
    try:
        group = await use_case.execute(
            class_code=class_code,
            adder_id=user_id,
            username=request.username,
        )
        return _class_response(group)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{class_code}/participants/{target_user_id}", status_code=204)
async def remove_member(
    class_code: str,
    target_user_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    use_case: RemoveClassMemberUseCase = Depends(get_remove_class_member_usecase),
):
    """Remove a member from a class (admin/owner, or self-leave)."""
    try:
        await use_case.execute(
            class_code=class_code,
            remover_id=user_id,
            target_user_id=target_user_id,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{class_code}/participants/{target_user_id}/role", response_model=ClassResponse)
async def change_member_role(
    class_code: str,
    target_user_id: UUID,
    request: ChangeMemberRoleRequest,
    user_id: UUID = Depends(get_current_user_id),
    use_case: ChangeClassMemberRoleUseCase = Depends(get_change_class_role_usecase),
):
    """Promote or demote a member (owner only)."""
    try:
        group = await use_case.execute(
            class_code=class_code,
            owner_id=user_id,
            target_user_id=target_user_id,
            new_role=request.role,
        )
        return _class_response(group)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ---------------------------------------------------------------------------
# Chat messages  (nested under class code)
# ---------------------------------------------------------------------------

@router.post("/{class_code}/chat/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    class_code: str,
    request: SendMessageRequest,
    user_id: UUID = Depends(get_current_user_id),
    use_case: SendChatMessageUseCase = Depends(get_chat_send_message_use_case),
):
    """Send a message to a class chat."""
    try:
        msg_type = MessageType.TEXT
        if request.message_type == "image":
            msg_type = MessageType.IMAGE
        elif request.message_type == "file":
            msg_type = MessageType.FILE

        result = await use_case.execute(
            SendChatMessageInput(
                group_id=request.group_id,
                sender_id=user_id,
                content=request.content,
                message_type=msg_type,
                reply_to_id=request.reply_to_id,
            )
        )

        message = result.message
        return MessageResponse(
            id=message.id,
            group_id=message.group_id,
            sender_id=message.sender_id,
            content=message.content,
            message_type=message.message_type.value,
            mentions=[
                {
                    "user_id": str(m.user_id),
                    "username": m.username,
                    "start_index": m.start_index,
                    "end_index": m.end_index,
                }
                for m in message.mentions
            ],
            created_at=message.created_at,
            edited_at=message.edited_at,
            is_deleted=message.is_deleted,
            reply_to_id=message.reply_to_id,
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{class_code}/chat/messages", response_model=list[MessageResponse])
async def get_messages(
    class_code: str,
    limit: int = Query(50, le=100),
    before: Optional[datetime] = None,
    user_id: UUID = Depends(get_current_user_id),
    use_case: GetChatMessagesUseCase = Depends(get_chat_messages_use_case),
    class_uc: GetClassUseCase = Depends(get_get_class_usecase),
):
    """Get messages for a class with pagination."""
    try:
        # Resolve class code → group id
        group = await class_uc.execute(class_code=class_code, user_id=user_id)
        messages = await use_case.execute(
            group_id=group.id,
            user_id=user_id,
            limit=limit,
            before=before,
        )

        return [
            MessageResponse(
                id=msg.id,
                group_id=msg.group_id,
                sender_id=msg.sender_id,
                content=msg.content,
                message_type=msg.message_type.value,
                mentions=[
                    {
                        "user_id": str(m.user_id),
                        "username": m.username,
                        "start_index": m.start_index,
                        "end_index": m.end_index,
                    }
                    for m in msg.mentions
                ],
                created_at=msg.created_at,
                edited_at=msg.edited_at,
                is_deleted=msg.is_deleted,
                reply_to_id=msg.reply_to_id,
            )
            for msg in messages
        ]

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{class_code}/chat/messages/{message_id}", response_model=MessageResponse)
async def edit_message(
    class_code: str,
    message_id: UUID,
    request: EditMessageRequest,
    user_id: UUID = Depends(get_current_user_id),
    use_case: EditChatMessageUseCase = Depends(get_edit_chat_message_use_case),
):
    """Edit a message."""
    try:
        message = await use_case.execute(
            message_id=message_id,
            editor_id=user_id,
            new_content=request.content,
        )

        return MessageResponse(
            id=message.id,
            group_id=message.group_id,
            sender_id=message.sender_id,
            content=message.content,
            message_type=message.message_type.value,
            mentions=[],
            created_at=message.created_at,
            edited_at=message.edited_at,
            is_deleted=message.is_deleted,
            reply_to_id=message.reply_to_id,
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{class_code}/chat/messages/{message_id}", status_code=204)
async def delete_message(
    class_code: str,
    message_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    use_case: DeleteChatMessageUseCase = Depends(get_delete_chat_message_use_case),
):
    """Delete a message."""
    try:
        await use_case.execute(message_id, user_id)
        return JSONResponse(status_code=204, content={})

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{class_code}/chat/search", response_model=list[MessageResponse])
async def search_messages(
    class_code: str,
    q: str = Query(..., min_length=2),
    limit: int = Query(20, le=50),
    user_id: UUID = Depends(get_current_user_id),
    use_case: SearchchatMessagesUseCase = Depends(get_search_chat_messages_use_case),
    class_uc: GetClassUseCase = Depends(get_get_class_usecase),
):
    """Search messages in a class chat."""
    try:
        group = await class_uc.execute(class_code=class_code, user_id=user_id)
        messages = await use_case.execute(
            group_id=group.id,
            user_id=user_id,
            query=q,
            limit=limit,
        )

        return [
            MessageResponse(
                id=msg.id,
                group_id=msg.group_id,
                sender_id=msg.sender_id,
                content=msg.content,
                message_type=msg.message_type.value,
                mentions=[],
                created_at=msg.created_at,
                edited_at=msg.edited_at,
                is_deleted=msg.is_deleted,
                reply_to_id=msg.reply_to_id,
            )
            for msg in messages
        ]

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

