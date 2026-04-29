import pytest

from models.project import Project
from models.task import Task


@pytest.mark.asyncio
async def test_create_project_sets_owner_from_auth(client, create_user):
    create_user("project-owner@example.com")
    login = await client.post(
        "/auth/login",
        data={"username": "project-owner@example.com", "password": "password123"},
    )
    response = await client.post(
        "/projects",
        json={"title": "Roadmap", "description": "Q2 work", "status": "active", "owner_id": 999},
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    data = response.json()
    assert response.status_code == 201
    assert data["owner_id"] != 999


@pytest.mark.asyncio
async def test_put_project_replaces_all_fields(client, create_user):
    create_user("put-project@example.com")
    login = await client.post(
        "/auth/login",
        data={"username": "put-project@example.com", "password": "password123"},
    )
    create_response = await client.post(
        "/projects",
        json={"title": "Initial", "description": "Old", "status": "active"},
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    project_id = create_response.json()["id"]

    response = await client.put(
        f"/projects/{project_id}",
        json={"title": "Updated", "description": "New", "status": "completed"},
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated"
    assert response.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_patch_project_only_updates_provided_fields(client, create_user):
    create_user("patch-project@example.com")
    login = await client.post(
        "/auth/login",
        data={"username": "patch-project@example.com", "password": "password123"},
    )
    create_response = await client.post(
        "/projects",
        json={"title": "Initial", "description": "Old", "status": "active"},
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    project_id = create_response.json()["id"]

    response = await client.patch(
        f"/projects/{project_id}",
        json={"status": "on_hold"},
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "on_hold"
    assert response.json()["title"] == "Initial"


@pytest.mark.asyncio
async def test_owner_can_delete_project_and_tasks_cascade(client, create_user, db_session):
    create_user("delete-owner@example.com")
    login = await client.post(
        "/auth/login",
        data={"username": "delete-owner@example.com", "password": "password123"},
    )
    project = await client.post(
        "/projects",
        json={"title": "Cascade", "description": None, "status": "active"},
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    project_id = project.json()["id"]
    await client.post(
        f"/projects/{project_id}/tasks",
        json={"title": "Task A", "description": None, "status": "todo", "priority": "medium"},
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )

    response = await client.delete(
        f"/projects/{project_id}",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert response.status_code == 204
    assert db_session.query(Project).filter(Project.id == project_id).first() is None
    assert db_session.query(Task).count() == 0


@pytest.mark.asyncio
async def test_non_owner_cannot_delete_project(client, create_user):
    create_user("owner@example.com")
    create_user("other@example.com")
    owner_login = await client.post(
        "/auth/login",
        data={"username": "owner@example.com", "password": "password123"},
    )
    other_login = await client.post(
        "/auth/login",
        data={"username": "other@example.com", "password": "password123"},
    )
    project = await client.post(
        "/projects",
        json={"title": "Secret", "description": None, "status": "active"},
        headers={"Authorization": f"Bearer {owner_login.json()['access_token']}"},
    )

    response = await client.delete(
        f"/projects/{project.json()['id']}",
        headers={"Authorization": f"Bearer {other_login.json()['access_token']}"},
    )
    assert response.status_code == 403
