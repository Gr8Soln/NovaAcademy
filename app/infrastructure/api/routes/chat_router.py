from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import (APIRouter, Depends, File, Form, HTTPException, Query,
                     UploadFile)

from app.adapters.schemas import (AddMemberRequest, ChangeMemberRoleRequest,
                                  ClassMemberResponse, ClassResponse,
                                  EditMessageRequest, HandleJoinRequestRequest,
                                  JoinRequestResponse, MessageResponse,
                                  SendMessageRequest, UpdateClassRequest,
                                  success_response)
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
from app.domain.entities import User
from app.infrastructure.api.dependencies import (
    get_add_class_member_usecase, get_change_class_role_usecase,
    get_chat_messages_use_case, get_chat_presence_service,
    get_chat_send_message_use_case, get_connection_manager,
    get_create_class_usecase, get_current_user,
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


def _message_response(message, mentions=None) -> MessageResponse:
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
            for m in (mentions or [])
        ],
        created_at=message.created_at,
        edited_at=message.edited_at,
        is_deleted=message.is_deleted,
        reply_to_id=message.reply_to_id,
    )


# ---------------------------------------------------------------------------
# Class CRUD
# ---------------------------------------------------------------------------

@router.post("", status_code=201)
async def create_class(
    name: str = Form(...),
    description: str = Form(""),
    is_private: bool = Form(False),
    initial_member_usernames: str = Form(""),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
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
        creator_id=current_user.id,
        name=name,
        description=description,
        avatar_file=image,
        is_private=is_private,
        initial_member_usernames=usernames,
    )
    return success_response(
        message="Class created successfully",
        data=_class_response(group).model_dump(mode="json"),
    )


@router.get("")
async def get_my_classes(
    current_user: User = Depends(get_current_user),
    use_case: GetUserClassesUseCase = Depends(get_get_user_classes_usecase),
):
    """Return all classes the current user belongs to."""
    classes = await use_case.execute(user_id=current_user.id)
    return success_response(
        message="Classes retrieved",
        data=[_class_response(c).model_dump(mode="json") for c in classes],
    )


@router.get("/search")
async def search_classes(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=50),
    _current_user: User = Depends(get_current_user),
    use_case: SearchClassesUseCase = Depends(get_search_classes_usecase),
):
    """Search public (non-private) classes."""
    classes = await use_case.execute(query=q, limit=limit)
    return success_response(
        message="Search results",
        data=[_class_response(c).model_dump(mode="json") for c in classes],
    )


@router.get("/{class_code}")
async def get_class(
    class_code: str,
    current_user: User = Depends(get_current_user),
    use_case: GetClassUseCase = Depends(get_get_class_usecase),
):
    """Return a single class by code (caller must be a member)."""
    try:
        group = await use_case.execute(class_code=class_code, user_id=current_user.id)
        return success_response(
            message="Class retrieved",
            data=_class_response(group).model_dump(mode="json"),
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{class_code}")
async def update_class(
    class_code: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    is_private: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    use_case: UpdateClassUseCase = Depends(get_update_class_usecase),
):
    """Update class metadata (admin/owner only). Multipart form."""
    try:
        group = await use_case.execute(
            class_code=class_code,
            editor_id=current_user.id,
            name=name,
            description=description,
            avatar_file=image,
            is_private=is_private,
        )
        return success_response(
            message="Class updated successfully",
            data=_class_response(group).model_dump(mode="json"),
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{class_code}")
async def delete_class(
    class_code: str,
    current_user: User = Depends(get_current_user),
    use_case: DeleteClassUseCase = Depends(get_delete_class_usecase),
):
    """Delete a class (owner only)."""
    try:
        await use_case.execute(class_code=class_code, user_id=current_user.id)
        return success_response(message="Class deleted successfully")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ---------------------------------------------------------------------------
# Join / Join requests
# ---------------------------------------------------------------------------

@router.post("/{class_code}/join")
async def join_class(
    class_code: str,
    current_user: User = Depends(get_current_user),
    use_case: JoinClassUseCase = Depends(get_join_class_usecase),
):
    """
    Join a class by code.
    - Public → joined immediately
    - Private → creates a join request (pending admin approval)
    """
    try:
        result = await use_case.execute(class_code=class_code, user_id=current_user.id)
        if result["joined"]:
            return success_response(
                message="Joined class successfully",
                data={"joined": True},
            )
        else:
            jr = result["join_request"]
            return success_response(
                message="Join request submitted. Waiting for admin approval.",
                data={
                    "joined": False,
                    "join_request": _join_request_response(jr).model_dump(mode="json"),
                },
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{class_code}/join-requests")
async def get_join_requests(
    class_code: str,
    current_user: User = Depends(get_current_user),
    use_case: GetJoinRequestsUseCase = Depends(get_join_requests_usecase),
):
    """Get pending join requests for a class (admin/owner only)."""
    try:
        requests = await use_case.execute(class_code=class_code, user_id=current_user.id)
        return success_response(
            message="Join requests retrieved",
            data=[_join_request_response(r).model_dump(mode="json") for r in requests],
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{class_code}/join-requests/{request_id}")
async def handle_join_request(
    class_code: str,
    request_id: UUID,
    body: HandleJoinRequestRequest,
    current_user: User = Depends(get_current_user),
    use_case: HandleJoinRequestUseCase = Depends(get_handle_join_request_usecase),
):
    """Accept or reject a join request (admin/owner only)."""
    try:
        result = await use_case.execute(
            class_code=class_code,
            request_id=request_id,
            handler_id=current_user.id,
            action=body.action,
        )
        return success_response(
            message=f"Join request {body.action}ed successfully",
            data=_join_request_response(result).model_dump(mode="json"),
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Participants (members) management
# ---------------------------------------------------------------------------

@router.post("/{class_code}/participants", status_code=201)
async def add_member(
    class_code: str,
    request: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    use_case: AddClassMemberUseCase = Depends(get_add_class_member_usecase),
):
    """Add a user (by username) to a class (admin/owner only)."""
    try:
        group = await use_case.execute(
            class_code=class_code,
            adder_id=current_user.id,
            username=request.username,
        )
        return success_response(
            message="Member added successfully",
            data=_class_response(group).model_dump(mode="json"),
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{class_code}/participants/{target_user_id}")
async def remove_member(
    class_code: str,
    target_user_id: UUID,
    current_user: User = Depends(get_current_user),
    use_case: RemoveClassMemberUseCase = Depends(get_remove_class_member_usecase),
):
    """Remove a member from a class (admin/owner, or self-leave)."""
    try:
        await use_case.execute(
            class_code=class_code,
            remover_id=current_user.id,
            target_user_id=target_user_id,
        )
        return success_response(message="Member removed successfully")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{class_code}/participants/{target_user_id}/role")
async def change_member_role(
    class_code: str,
    target_user_id: UUID,
    request: ChangeMemberRoleRequest,
    current_user: User = Depends(get_current_user),
    use_case: ChangeClassMemberRoleUseCase = Depends(get_change_class_role_usecase),
):
    """Promote or demote a member (owner only)."""
    try:
        group = await use_case.execute(
            class_code=class_code,
            owner_id=current_user.id,
            target_user_id=target_user_id,
            new_role=request.role,
        )
        return success_response(
            message="Member role updated successfully",
            data=_class_response(group).model_dump(mode="json"),
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ---------------------------------------------------------------------------
# Chat messages  (nested under class code)
# ---------------------------------------------------------------------------

@router.post("/{class_code}/chat/messages", status_code=201)
async def send_message(
    class_code: str,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
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
                sender_id=current_user.id,
                content=request.content,
                message_type=msg_type,
                reply_to_id=request.reply_to_id,
            )
        )
        return success_response(
            message="Message sent",
            data=_message_response(result.message, result.message.mentions).model_dump(mode="json"),
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{class_code}/chat/messages")
async def get_messages(
    class_code: str,
    limit: int = Query(50, le=100),
    before: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    use_case: GetChatMessagesUseCase = Depends(get_chat_messages_use_case),
    class_uc: GetClassUseCase = Depends(get_get_class_usecase),
):
    """Get messages for a class with pagination."""
    try:
        group = await class_uc.execute(class_code=class_code, user_id=current_user.id)
        messages = await use_case.execute(
            group_id=group.id,
            user_id=current_user.id,
            limit=limit,
            before=before,
        )
        return success_response(
            message="Messages retrieved",
            data=[_message_response(msg, msg.mentions).model_dump(mode="json") for msg in messages],
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{class_code}/chat/messages/{message_id}")
async def edit_message(
    class_code: str,
    message_id: UUID,
    request: EditMessageRequest,
    current_user: User = Depends(get_current_user),
    use_case: EditChatMessageUseCase = Depends(get_edit_chat_message_use_case),
):
    """Edit a message."""
    try:
        message = await use_case.execute(
            message_id=message_id,
            editor_id=current_user.id,
            new_content=request.content,
        )
        return success_response(
            message="Message updated",
            data=_message_response(message).model_dump(mode="json"),
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{class_code}/chat/messages/{message_id}")
async def delete_message(
    class_code: str,
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    use_case: DeleteChatMessageUseCase = Depends(get_delete_chat_message_use_case),
):
    """Delete a message."""
    try:
        await use_case.execute(message_id, current_user.id)
        return success_response(message="Message deleted successfully")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{class_code}/chat/search")
async def search_messages(
    class_code: str,
    q: str = Query(..., min_length=2),
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_user),
    use_case: SearchchatMessagesUseCase = Depends(get_search_chat_messages_use_case),
    class_uc: GetClassUseCase = Depends(get_get_class_usecase),
):
    """Search messages in a class chat."""
    try:
        group = await class_uc.execute(class_code=class_code, user_id=current_user.id)
        messages = await use_case.execute(
            group_id=group.id,
            user_id=current_user.id,
            query=q,
            limit=limit,
        )
        return success_response(
            message="Search results",
            data=[_message_response(msg).model_dump(mode="json") for msg in messages],
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

