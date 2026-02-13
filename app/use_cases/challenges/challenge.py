"""Challenge use cases — create, accept, decline, cancel, submit, resolve."""

from __future__ import annotations

import uuid

from app.domain.entities.challenge import Challenge, ChallengeStatus
from app.domain.entities.notification import Notification, NotificationType
from app.domain.entities.point_transaction import PointAction, PointTransaction
from app.domain.entities.post import Post
from app.domain.exceptions import (AuthorizationError, ChallengeNotFoundError,
                                   ChallengeValidationError,
                                   InsufficientPointsError, UserNotFoundError)
from app.interfaces.repositories.challenge_repository import \
    IChallengeRepository
from app.interfaces.repositories.notification_repository import \
    INotificationRepository
from app.interfaces.repositories.point_transaction_repository import \
    IPointTransactionRepository
from app.interfaces.repositories.post_repository import IPostRepository
from app.interfaces.repositories.user_repository import IUserRepository
from app.interfaces.services.leaderboard_service import (ILeaderboardService,
                                                         LeaderboardType)
from app.interfaces.services.notification_push_service import \
    INotificationPushService


class CreateChallengeUseCase:
    def __init__(
        self,
        challenge_repo: IChallengeRepository,
        point_repo: IPointTransactionRepository,
        user_repo: IUserRepository,
        notification_repo: INotificationRepository,
        leaderboard_service: ILeaderboardService,
        notification_push: INotificationPushService,
    ) -> None:
        self._challenge_repo = challenge_repo
        self._point_repo = point_repo
        self._user_repo = user_repo
        self._notification_repo = notification_repo
        self._leaderboard = leaderboard_service
        self._notification_push = notification_push

    async def execute(
        self,
        challenger_id: uuid.UUID,
        opponent_id: uuid.UUID,
        document_id: uuid.UUID,
        question_count: int,
        wager_amount: int,
    ) -> Challenge:
        # Validate opponent exists
        opponent = await self._user_repo.get_by_id(opponent_id)
        if not opponent:
            raise UserNotFoundError("Opponent not found")

        # Check daily cooldown
        daily_count = await self._challenge_repo.count_daily_challenges(challenger_id, opponent_id)
        if daily_count >= Challenge.MAX_DAILY_CHALLENGES_PER_OPPONENT:
            raise ChallengeValidationError(
                f"Max {Challenge.MAX_DAILY_CHALLENGES_PER_OPPONENT} challenges per opponent per day"
            )

        # Check balance
        balance = await self._point_repo.get_balance(challenger_id)
        challenge = Challenge(
            challenger_id=challenger_id,
            opponent_id=opponent_id,
            document_id=document_id,
            question_count=question_count,
            wager_amount=wager_amount,
        )
        challenge.validate_creation(balance)

        # Escrow challenger's wager
        await self._point_repo.create(PointTransaction(
            user_id=challenger_id,
            action=PointAction.CHALLENGE_ESCROW,
            points=-wager_amount,
            description=f"Challenge wager escrow",
            reference_id=challenge.id,
        ))
        await self._leaderboard.increment_score(challenger_id, LeaderboardType.POINTS, -wager_amount)

        result = await self._challenge_repo.create(challenge)

        # Notify opponent
        challenger = await self._user_repo.get_by_id(challenger_id)
        notification = Notification(
            user_id=opponent_id,
            type=NotificationType.CHALLENGE_RECEIVED,
            title="New challenge!",
            message=f"{challenger.full_name if challenger else 'Someone'} challenged you for {wager_amount} points!",
            data={
                "challenge_id": str(result.id),
                "challenger_id": str(challenger_id),
                "wager": wager_amount,
                "question_count": question_count,
            },
        )
        await self._notification_repo.create(notification)
        await self._notification_push.push(notification)

        return result


class AcceptChallengeUseCase:
    """Accept and immediately start the challenge (escrow opponent's wager)."""

    def __init__(
        self,
        challenge_repo: IChallengeRepository,
        point_repo: IPointTransactionRepository,
        leaderboard_service: ILeaderboardService,
    ) -> None:
        self._challenge_repo = challenge_repo
        self._point_repo = point_repo
        self._leaderboard = leaderboard_service

    async def execute(self, challenge_id: uuid.UUID, user_id: uuid.UUID) -> Challenge:
        challenge = await self._challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ChallengeNotFoundError("Challenge not found")
        if challenge.opponent_id != user_id:
            raise AuthorizationError("Only the opponent can accept")
        if challenge.is_expired():
            challenge.expire()
            await self._challenge_repo.update(challenge)
            raise ChallengeValidationError("Challenge has expired")

        # Check opponent balance
        balance = await self._point_repo.get_balance(user_id)
        if balance < challenge.wager_amount:
            raise InsufficientPointsError(
                f"Need {challenge.wager_amount} points, have {balance}"
            )

        # Escrow opponent's wager
        await self._point_repo.create(PointTransaction(
            user_id=user_id,
            action=PointAction.CHALLENGE_ESCROW,
            points=-challenge.wager_amount,
            description="Challenge wager escrow",
            reference_id=challenge_id,
        ))
        await self._leaderboard.increment_score(user_id, LeaderboardType.POINTS, -challenge.wager_amount)

        challenge.accept()
        return await self._challenge_repo.update(challenge)


class DeclineChallengeUseCase:
    def __init__(
        self,
        challenge_repo: IChallengeRepository,
        point_repo: IPointTransactionRepository,
        leaderboard_service: ILeaderboardService,
    ) -> None:
        self._challenge_repo = challenge_repo
        self._point_repo = point_repo
        self._leaderboard = leaderboard_service

    async def execute(self, challenge_id: uuid.UUID, user_id: uuid.UUID) -> Challenge:
        challenge = await self._challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ChallengeNotFoundError("Challenge not found")
        if challenge.opponent_id != user_id:
            raise AuthorizationError("Only the opponent can decline")

        challenge.decline()

        # Return challenger's escrowed wager
        await self._point_repo.create(PointTransaction(
            user_id=challenge.challenger_id,
            action=PointAction.CHALLENGE_ESCROW_RETURN,
            points=challenge.wager_amount,
            description="Challenge wager returned (declined)",
            reference_id=challenge_id,
        ))
        await self._leaderboard.increment_score(
            challenge.challenger_id, LeaderboardType.POINTS, challenge.wager_amount
        )

        return await self._challenge_repo.update(challenge)


class CancelChallengeUseCase:
    def __init__(
        self,
        challenge_repo: IChallengeRepository,
        point_repo: IPointTransactionRepository,
        leaderboard_service: ILeaderboardService,
    ) -> None:
        self._challenge_repo = challenge_repo
        self._point_repo = point_repo
        self._leaderboard = leaderboard_service

    async def execute(self, challenge_id: uuid.UUID, user_id: uuid.UUID) -> Challenge:
        challenge = await self._challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ChallengeNotFoundError("Challenge not found")
        if challenge.challenger_id != user_id:
            raise AuthorizationError("Only the challenger can cancel")

        challenge.cancel()

        # Return challenger's escrowed wager
        await self._point_repo.create(PointTransaction(
            user_id=user_id,
            action=PointAction.CHALLENGE_ESCROW_RETURN,
            points=challenge.wager_amount,
            description="Challenge wager returned (cancelled)",
            reference_id=challenge_id,
        ))
        await self._leaderboard.increment_score(user_id, LeaderboardType.POINTS, challenge.wager_amount)

        return await self._challenge_repo.update(challenge)


class SubmitChallengeScoreUseCase:
    def __init__(self, challenge_repo: IChallengeRepository) -> None:
        self._challenge_repo = challenge_repo

    async def execute(self, challenge_id: uuid.UUID, user_id: uuid.UUID, score: float) -> Challenge:
        challenge = await self._challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ChallengeNotFoundError("Challenge not found")
        challenge.submit_score(user_id, score)
        return await self._challenge_repo.update(challenge)


class ResolveChallengeUseCase:
    """Resolve a challenge after both scores are in — distribute wagers."""

    def __init__(
        self,
        challenge_repo: IChallengeRepository,
        point_repo: IPointTransactionRepository,
        post_repo: IPostRepository,
        user_repo: IUserRepository,
        notification_repo: INotificationRepository,
        leaderboard_service: ILeaderboardService,
        notification_push: INotificationPushService,
    ) -> None:
        self._challenge_repo = challenge_repo
        self._point_repo = point_repo
        self._post_repo = post_repo
        self._user_repo = user_repo
        self._notification_repo = notification_repo
        self._leaderboard = leaderboard_service
        self._notification_push = notification_push

    async def execute(self, challenge_id: uuid.UUID) -> Challenge:
        challenge = await self._challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ChallengeNotFoundError("Challenge not found")

        if challenge.challenger_score is None or challenge.opponent_score is None:
            raise ChallengeValidationError("Both players must submit scores first")

        challenge.resolve()

        if challenge.is_tie:
            # Return both wagers
            for uid in [challenge.challenger_id, challenge.opponent_id]:
                await self._point_repo.create(PointTransaction(
                    user_id=uid,
                    action=PointAction.CHALLENGE_TIE_RETURN,
                    points=challenge.wager_amount,
                    description="Challenge tied — wager returned",
                    reference_id=challenge_id,
                ))
                await self._leaderboard.increment_score(uid, LeaderboardType.POINTS, challenge.wager_amount)
        else:
            winner_id = challenge.winner_id
            loser_id = challenge.loser_id()

            # Winner gets both wagers back
            winnings = challenge.wager_amount * 2
            await self._point_repo.create(PointTransaction(
                user_id=winner_id,
                action=PointAction.CHALLENGE_WIN,
                points=winnings,
                description=f"Won challenge — {winnings} points",
                reference_id=challenge_id,
            ))
            await self._leaderboard.increment_score(winner_id, LeaderboardType.POINTS, winnings)

            # Perfect score bonus
            if challenge.is_perfect_win:
                bonus = Challenge.PERFECT_SCORE_BONUS
                await self._point_repo.create(PointTransaction(
                    user_id=winner_id,
                    action=PointAction.CHALLENGE_PERFECT_WIN,
                    points=bonus,
                    description="Perfect score challenge bonus!",
                    reference_id=challenge_id,
                ))
                await self._leaderboard.increment_score(winner_id, LeaderboardType.POINTS, bonus)

            # Auto-post result
            winner = await self._user_repo.get_by_id(winner_id)
            loser = await self._user_repo.get_by_id(loser_id)
            auto_content = (
                f"🏆 {winner.full_name if winner else 'Winner'} beat "
                f"{loser.full_name if loser else 'Opponent'} in a challenge for "
                f"{challenge.wager_amount} points!"
            )
            auto_post = Post.create_auto(winner_id, auto_content)
            await self._post_repo.create(auto_post)

            # Notify both
            for uid, msg in [
                (winner_id, f"You won the challenge! +{winnings} points"),
                (loser_id, f"You lost the challenge. -{challenge.wager_amount} points"),
            ]:
                notification = Notification(
                    user_id=uid,
                    type=NotificationType.CHALLENGE_COMPLETED,
                    title="Challenge completed",
                    message=msg,
                    data={"challenge_id": str(challenge_id)},
                )
                await self._notification_repo.create(notification)
                await self._notification_push.push(notification)

        return await self._challenge_repo.update(challenge)
