from collections.abc import Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
from auth.password import hash_password
from database import Base, get_db
from main import app
from models.user import User


SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db() -> Generator:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as async_client:
        yield async_client


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def create_user(db_session):
    def _create_user(
        email: str,
        password: str = "password123",
        full_name: str = "Test User",
        role: str = "user",
        is_active: bool = True,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            is_active=is_active,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _create_user


@pytest.fixture
def create_admin(create_user):
    def _create_admin(email: str = "admin@example.com", password: str = "password123") -> User:
        return create_user(email=email, password=password, full_name="Admin User", role="admin")

    return _create_admin


@pytest_asyncio.fixture
async def registered_user_token(client):
    await client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password123", "full_name": "User One"},
    )
    response = await client.post(
        "/auth/login",
        data={"username": "user@example.com", "password": "password123"},
    )
    return response.json()
