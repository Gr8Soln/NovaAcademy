"""Points API router — balance and transaction history."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import (get_current_user,
                                   get_point_transaction_repository)
from app.domain.entities.user import User
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.schemas.social import PointBalanceResponse, PointTransactionResponse
from app.use_cases.social import (GetPointsBalanceUseCase,
                                  GetPointsHistoryUseCase)

router = APIRouter(prefix="/points", tags=["points"])


@router.get("/balance", response_model=PointBalanceResponse)
async def get_balance(
    current_user: User = Depends(get_current_user),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
):
    use_case = GetPointsBalanceUseCase(point_repo)
    balance = await use_case.execute(current_user.id)
    return PointBalanceResponse(balance=balance)


@router.get("/history", response_model=list[PointTransactionResponse])
async def get_history(
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
):
    use_case = GetPointsHistoryUseCase(point_repo)
    transactions = await use_case.execute(current_user.id, offset=offset, limit=limit)
    return [
        PointTransactionResponse(
            id=t.id, user_id=t.user_id, action=t.action.value,
            points=t.points, description=t.description,
            reference_id=t.reference_id, created_at=t.created_at,
        )
        for t in transactions
    ]
