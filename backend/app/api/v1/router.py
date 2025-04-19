from fastapi import APIRouter
from .endpoints import auth, github,ai, match

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(match.router, prefix="/match", tags=["match"])
