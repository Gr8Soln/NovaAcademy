from fastapi import APIRouter, Depends, HTTPException, status

from app.adapters.schemas import (AuthResponse, ConfirmEmailRequest,
                                  ForgotPasswordRequest, GoogleAuthRequest,
                                  LoginRequest, RefreshTokenRequest,
                                  RegisterRequest, ResendConfirmEmailRequest,
                                  ResetPasswordRequest, TokenResponse,
                                  UserResponse, success_response)
from app.application.use_cases import (ConfirmEmailUseCase,
                                       ForgotPasswordUseCase,
                                       GoogleAuthUseCase, LoginUseCase,
                                       RefreshTokenUseCase, RegisterUseCase,
                                       ResendConfirmEmailUseCase,
                                       ResetPasswordUseCase)
from app.core.logging import get_logger
from app.domain.exceptions import (AccountInactiveError, EmailNotVerifiedError,
                                   InvalidAuthMethodError,
                                   InvalidCredentialError, InvalidTokenError,
                                   UserAlreadyExistsError, UserNotFoundError)
from app.infrastructure.api.dependencies import (
    get_confirm_email_usecase, get_forgot_password_usecase,
    get_google_auth_usecase, get_login_usecase, get_refresh_token_usecase,
    get_register_usecase, get_resend_confirm_email_usecase,
    get_reset_password_usecase)

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = get_logger(__name__)


# ── Helpers ──────────────────────────────────────────────────────

def _user_response(user) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        username_changed_at=user.username_changed_at,
        auth_provider=user.auth_provider.value if hasattr(user.auth_provider, "value") else user.auth_provider,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        has_password=user.has_password,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def _auth_response(user, tokens, message: str):
    return success_response(
        data=AuthResponse(
            user=_user_response(user),
            tokens=TokenResponse(
                access_token=tokens.access_token,
                refresh_token=tokens.refresh_token,
            ),
        ).model_dump(mode="json"),
        message=message,
    )


# ── Register ──────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    use_case: RegisterUseCase = Depends(get_register_usecase),
):
    try:
        user, tokens = await use_case.execute(
            body.email, body.first_name, body.last_name, body.password
        )
        return _auth_response(user, tokens, "Registration successful. Please verify your email.")
    except UserAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


# ── Login ─────────────────────────────────────────────────────────

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(
    body: LoginRequest,
    use_case: LoginUseCase = Depends(get_login_usecase),
):
    try:
        user, tokens = await use_case.execute(body.email, body.password)
        return _auth_response(user, tokens, "Login successful")
    except (InvalidCredentialError, InvalidAuthMethodError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    except EmailNotVerifiedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except AccountInactiveError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


# ── Google Auth ───────────────────────────────────────────────────

@router.post("/google", status_code=status.HTTP_200_OK)
async def google_auth(
    body: GoogleAuthRequest,
    use_case: GoogleAuthUseCase = Depends(get_google_auth_usecase),
):
    try:
        user, tokens, is_new_user = await use_case.execute(body.code, body.is_access_token)
        msg = "Registration successful" if is_new_user else "Login successful"
        return _auth_response(user, tokens, msg)
    except UserAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


# ── Refresh Token ─────────────────────────────────────────────────

@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(
    body: RefreshTokenRequest,
    use_case: RefreshTokenUseCase = Depends(get_refresh_token_usecase),
):
    try:
        tokens = await use_case.execute(body.refresh_token)
        return success_response(
            data=TokenResponse(
                access_token=tokens.access_token,
                refresh_token=tokens.refresh_token,
            ).model_dump(mode="json"),
            message="Token refreshed",
        )
    except (InvalidCredentialError, UserNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    except AccountInactiveError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


# ── Forgot Password ───────────────────────────────────────────────

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    body: ForgotPasswordRequest,
    use_case: ForgotPasswordUseCase = Depends(get_forgot_password_usecase),
):
    # deliberately no error leakage
    await use_case.execute(body.email)
    return success_response(message="If the email exists, a reset link has been sent.")


# ── Reset Password ────────────────────────────────────────────────

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    body: ResetPasswordRequest,
    use_case: ResetPasswordUseCase = Depends(get_reset_password_usecase),
):
    try:
        await use_case.execute(body.token, body.new_password)
        return success_response(message="Password reset successfully.")
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ── Confirm Email ─────────────────────────────────────────────────

@router.post("/confirm-email", status_code=status.HTTP_200_OK)
async def confirm_email(
    body: ConfirmEmailRequest,
    use_case: ConfirmEmailUseCase = Depends(get_confirm_email_usecase),
):
    try:
        user = await use_case.execute(body.token)
        return success_response(
            data=_user_response(user).model_dump(mode="json"),
            message="Email confirmed successfully.",
        )
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ── Resend Confirm Email ──────────────────────────────────────────

@router.post("/resend-confirm-email", status_code=status.HTTP_200_OK)
async def resend_confirm_email(
    body: ResendConfirmEmailRequest,
    use_case: ResendConfirmEmailUseCase = Depends(get_resend_confirm_email_usecase),
):
    await use_case.execute(body.email)
    return success_response(message="If the address is registered, a new verification email has been sent.")

