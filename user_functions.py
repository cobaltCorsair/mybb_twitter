from typing import Optional
from mongoengine import DoesNotExist

from admins import ADMIN_IDS
from models import User, Message, Comment


class UserService:
    def user_exists(self, user_id: int) -> bool:
        try:
            User.objects.get(forum_id=user_id)
            return True
        except DoesNotExist:
            return False

    def create_user(self, user_id: int, username: str) -> None:
        new_user = User(username=username, forum_id=user_id)
        new_user.save()

    def update_username(self, user_id: int, username: str) -> None:
        user = User.objects.get(forum_id=user_id)
        if user.username != username:
            user.username = username
            user.save()

    def create_message(self, user_id: int, content: str) -> None:
        user = User.objects.get(forum_id=user_id)
        new_message = Message(user=user, content=content)
        new_message.save()

    def delete_message(self, message_id: str, user_id: int) -> None:
        message = Message.objects.get(id=message_id)
        if message.user.forum_id == user_id or user_id in ADMIN_IDS:
            message.delete()

    def edit_message(self, message_id: str, user_id: int, new_content: str) -> None:
        user = User.objects.get(forum_id=user_id)
        if not user:
            raise DoesNotExist("User does not exist")
        message = Message.objects.get(id=message_id)
        if message.user.forum_id != user_id:
            raise PermissionError("User does not have permission to edit this message")
        message.content = new_content
        message.save()

    def create_comment(self, user_id: int, message_id: str, content: str) -> None:
        user = User.objects.get(forum_id=user_id)
        message = Message.objects.get(id=message_id)
        new_comment = Comment(user=user, message=message, content=content)
        new_comment.save()

    def ban_user(self, user_id: int) -> None:
        user = User.objects.get(forum_id=user_id)
        user.banned = True
        user.save()

    def unban_user(self, user_id: int) -> None:
        user = User.objects.get(forum_id=user_id)
        user.banned = False
        user.save()
