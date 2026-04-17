import hashlib
import secrets

from sqlalchemy.orm import Session

from models.api_key import APIKey


def generate_api_key() -> str:
    return secrets.token_hex(32)


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def verify_api_key(raw_key: str, db: Session) -> APIKey | None:
    hashed_key = hash_api_key(raw_key)
    return db.query(APIKey).filter(
        APIKey.key_hash == hashed_key,
        APIKey.is_active == True,
    ).first()