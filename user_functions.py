from typing import Optional
from mongoengine import DoesNotExist

from models import User, Message


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

    def ban_user(self, user_id: int) -> None:
        user = User.objects.get(forum_id=user_id)
        user.banned = True
        user.save()

    def unban_user(self, user_id: int) -> None:
        user = User.objects.get(forum_id=user_id)
        user.banned = False
        user.save()
