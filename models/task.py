from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.project import Project
    from models.user import User
    from models.comment import Comment
    from models.tag import Tag


from database import Base
class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] =mapped_column(String(255), nullable=False)
    description: Mapped[str | None] =mapped_column(String(255), nullable=True)
    status: Mapped[str] =mapped_column(String(50), nullable=False, default="todo")
    priority: Mapped[str] = mapped_column(String(50), nullable= False, default="medium")
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    assignee_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow) 
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    project: Mapped["Project"] = relationship(back_populates="tasks")
    assignee: Mapped["User"] = relationship(back_populates="tasks")
    comments: Mapped[list["Comment"]] = relationship(back_populates="task",cascade="all, delete-orphan",)
    tags: Mapped[list["Tag"]] = relationship(secondary="task_tags", back_populates="tasks",)