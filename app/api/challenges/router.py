"""Challenge API router — PvP quiz challenges with wagers."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import (get_challenge_repository, get_current_user,
                                   get_leaderboard_service,
                                   get_notification_push_service,
                                   get_notification_repository,
                                   get_point_transaction_repository,
                                   get_post_repository)
from app.domain.entities.challenge import ChallengeStatus
from app.domain.entities.user import User
from app.domain.exceptions import (ChallengeNotFoundError,
                                   ChallengeValidationError,
                                   InsufficientPointsError)
from app.interfaces.repositories.challenge_repository import \
    IChallengeRepository
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.post_repository import IPostRepository
from app.interfaces.services.leaderboard_service import ILeaderboardService
from app.interfaces.services.notification_push_service import \
    INotificationPushService
from app.schemas.social import (ChallengeResponse, CreateChallengeRequest,
                                SubmitScoreRequest)
from app.use_cases.challenges import (AcceptChallengeUseCase,
                                      CancelChallengeUseCase,
                                      CreateChallengeUseCase,
                                      DeclineChallengeUseCase,
                                      ResolveChallengeUseCase,
                                      SubmitChallengeScoreUseCase)

router = APIRouter(prefix="/challenges", tags=["challenges"])


def _to_response(c) -> ChallengeResponse:
    return ChallengeResponse(
        id=c.id, challenger_id=c.challenger_id, opponent_id=c.opponent_id,
        document_id=c.document_id, quiz_id=c.quiz_id, question_count=c.question_count,
        wager_amount=c.wager_amount, status=c.status.value,
        challenger_score=c.challenger_score, opponent_score=c.opponent_score,
        winner_id=c.winner_id, expires_at=c.expires_at,
        completed_at=c.completed_at, created_at=c.created_at,
    )


@router.post("/", response_model=ChallengeResponse, status_code=201)
async def create_challenge(
    body: CreateChallengeRequest,
    current_user: User = Depends(get_current_user),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    use_case = CreateChallengeUseCase(challenge_repo, point_repo, notification_repo, push)
    try:
        challenge = await use_case.execute(
            challenger_id=current_user.id,
            opponent_id=body.opponent_id,
            document_id=body.document_id,
            question_count=body.question_count,
            wager_amount=body.wager_amount,
        )
    except (ChallengeValidationError, InsufficientPointsError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_response(challenge)


@router.get("/", response_model=list[ChallengeResponse])
async def list_challenges(
    status: str | None = None,
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
):
    s = ChallengeStatus(status) if status else None
    challenges = await challenge_repo.get_user_challenges(
        current_user.id, status=s, offset=offset, limit=limit
    )
    return [_to_response(c) for c in challenges]


@router.post("/{challenge_id}/accept", response_model=ChallengeResponse)
async def accept_challenge(
    challenge_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    use_case = AcceptChallengeUseCase(challenge_repo, point_repo, notification_repo, push)
    try:
        challenge = await use_case.execute(challenge_id=challenge_id, opponent_id=current_user.id)
    except ChallengeNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (InsufficientPointsError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_response(challenge)


@router.post("/{challenge_id}/decline", response_model=ChallengeResponse)
async def decline_challenge(
    challenge_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
):
    use_case = DeclineChallengeUseCase(challenge_repo, point_repo)
    try:
        challenge = await use_case.execute(challenge_id=challenge_id, opponent_id=current_user.id)
    except ChallengeNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_response(challenge)


@router.post("/{challenge_id}/cancel", response_model=ChallengeResponse)
async def cancel_challenge(
    challenge_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
):
    use_case = CancelChallengeUseCase(challenge_repo, point_repo)
    try:
        challenge = await use_case.execute(challenge_id=challenge_id, challenger_id=current_user.id)
    except ChallengeNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_response(challenge)


@router.post("/{challenge_id}/submit-score", response_model=ChallengeResponse)
async def submit_score(
    challenge_id: uuid.UUID,
    body: SubmitScoreRequest,
    current_user: User = Depends(get_current_user),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
):
    use_case = SubmitChallengeScoreUseCase(challenge_repo)
    try:
        challenge = await use_case.execute(
            challenge_id=challenge_id, user_id=current_user.id, score=body.score
        )
    except ChallengeNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_response(challenge)


@router.post("/{challenge_id}/resolve", response_model=ChallengeResponse)
async def resolve_challenge(
    challenge_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
    post_repo: IPostRepository = Depends(get_post_repository),
    notification_repo: INotificationRepository = Depends(get_notification_repository),
    leaderboard: ILeaderboardService = Depends(get_leaderboard_service),
    push: INotificationPushService = Depends(get_notification_push_service),
):
    use_case = ResolveChallengeUseCase(
        challenge_repo, point_repo, post_repo, notification_repo, leaderboard, push
    )
    try:
        challenge = await use_case.execute(challenge_id=challenge_id)
    except ChallengeNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_response(challenge)
