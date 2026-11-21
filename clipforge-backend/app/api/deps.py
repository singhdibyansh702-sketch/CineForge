from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.security import decode_access_token, get_password_hash

security = HTTPBearer(auto_error=False)

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    # If no bearer token is passed, provide or auto-create the default demo editor user
    if not auth:
        default_user = db.query(User).filter(User.email == "editor@clipforge.io").first()
        if not default_user:
            default_user = User(
                email="editor@clipforge.io",
                hashed_password=get_password_hash("clipforge123"),
                full_name="Senior Video Editor",
                theme_preference="dark"
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
        return default_user

    token = auth.credentials
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
