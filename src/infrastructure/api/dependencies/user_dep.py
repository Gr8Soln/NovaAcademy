from fastapi import Depends

from app.application.interfaces import (IJwtService, IStorageService,
                                        IUserInterface)
from app.application.use_cases import (ChangePasswordUseCase,
                                       DeactivateAccountUseCase,
                                       GetCurrentUserUseCase,
                                       RemoveAvatarUseCase, SetPasswordUseCase,
                                       UpdateProfileUseCase,
                                       UpdateUsernameUseCase,
                                       UploadAvatarUseCase)

from .core_dep import get_jwt_service, get_storage_service, get_user_repository


def get_current_user_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
) -> GetCurrentUserUseCase:
    return GetCurrentUserUseCase(user_repo)


def get_update_profile_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
) -> UpdateProfileUseCase:
    return UpdateProfileUseCase(user_repo)


def get_upload_avatar_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    storage: IStorageService = Depends(get_storage_service),
) -> UploadAvatarUseCase:
    return UploadAvatarUseCase(user_repo, storage)


def get_remove_avatar_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
) -> RemoveAvatarUseCase:
    return RemoveAvatarUseCase(user_repo)


def get_set_password_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_svc: IJwtService = Depends(get_jwt_service),
) -> SetPasswordUseCase:
    return SetPasswordUseCase(user_repo, jwt_svc)


def get_change_password_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
    jwt_svc: IJwtService = Depends(get_jwt_service),
) -> ChangePasswordUseCase:
    return ChangePasswordUseCase(user_repo, jwt_svc)


def get_deactivate_account_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
) -> DeactivateAccountUseCase:
    return DeactivateAccountUseCase(user_repo)


def get_update_username_usecase(
    user_repo: IUserInterface = Depends(get_user_repository),
) -> UpdateUsernameUseCase:
    return UpdateUsernameUseCase(user_repo)
