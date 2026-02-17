"""Points API router — balance and transaction history."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import (get_current_user,
                                   get_point_transaction_repository)
from app.domain.entities.user import User
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.schemas.response import paginated_response, success_response
from app.schemas.social import PointBalanceResponse, PointTransactionResponse
from app.use_cases.points import (GetPointsBalanceUseCase,
                                  GetPointsHistoryUseCase)

router = APIRouter(prefix="/points", tags=["points"])


@router.get("/balance")
async def get_balance(
    current_user: User = Depends(get_current_user),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
):
    use_case = GetPointsBalanceUseCase(point_repo)
    balance = await use_case.execute(current_user.id)
    return success_response(
        data=PointBalanceResponse(balance=balance).model_dump(mode="json"),
        message="Balance retrieved",
    )


@router.get("/history")
async def get_history(
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    point_repo: IPointTransactionRepository = Depends(get_point_transaction_repository),
):
    use_case = GetPointsHistoryUseCase(point_repo)
    transactions = await use_case.execute(current_user.id, offset=offset, limit=limit)
    total = await point_repo.count_history(current_user.id)
    return paginated_response(
        data=[
            PointTransactionResponse(
                id=t.id, user_id=t.user_id, action=t.action.value,
                points=t.points, description=t.description,
                reference_id=t.reference_id, created_at=t.created_at,
            ).model_dump(mode="json")
            for t in transactions
        ],
        message="Transaction history retrieved",
        total=total,
        offset=offset,
        limit=limit,
    )
