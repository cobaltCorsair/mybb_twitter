from typing import Optional

from mongoengine import DoesNotExist
from mongoengine.queryset.visitor import Q
from admins import ADMIN_IDS
from models import User, Message, Comment, Like, Report, Notification, SubComment
from message_manager import MessageManager


class UserService:
    def user_exists(self, user_id: int) -> bool:
        try:
            User.objects.get(forum_id=user_id)
            return True
        except DoesNotExist:
            return False

    def create_user(self, user_id: int, username: str, avatar_url: str) -> None:
        new_user = User(username=username, forum_id=user_id, avatar_url=avatar_url)
        new_user.save()

    def update_username_and_avatar(self, user_id: int, username: str, avatar_url: str) -> None:
        user = User.objects.get(forum_id=user_id)
        if user.username != username or user.avatar_url != avatar_url:
            user.username = username
            user.avatar_url = avatar_url
            user.save()

    def create_message(self, user_id: int, content: str) -> str:
        user = User.objects.get(forum_id=user_id)
        new_message = Message(user=user, content=content)
        new_message.save()
        return str(new_message.id)

    def delete_message(self, message_id: str, user_id: int) -> None:
        try:
            message = Message.objects.get(id=message_id)
        except DoesNotExist:
            raise ValueError("Message does not exist")

        if message.user.forum_id == user_id or user_id in ADMIN_IDS:
            message.delete()
        else:
            raise PermissionError("User does not have permission to delete this message")

    def edit_message(self, message_id: str, user_id: int, new_content: str) -> None:
        user = User.objects.get(forum_id=user_id)
        if not user:
            raise DoesNotExist("User does not exist")
        message = Message.objects.get(id=message_id)
        if message.user.forum_id != user_id:
            raise PermissionError("User does not have permission to edit this message")
        message.content = new_content
        message.save()

    def create_comment(self, user_id: int, message_id: str, content: str) -> str:
        user = User.objects.get(forum_id=user_id)
        message = Message.objects.get(id=message_id)
        new_comment = Comment(user=user, message=message, content=content)
        new_comment.save()
        return str(new_comment.id)

    def delete_comment(self, comment_id: str, user_id: int) -> None:
        try:
            comment = Comment.objects.get(id=comment_id)
        except DoesNotExist:
            raise ValueError("Comment does not exist")

        if comment.user.forum_id == user_id or user_id in ADMIN_IDS:
            comment.delete()
        else:
            raise PermissionError("User does not have permission to delete this comment")

    def update_comment(self, comment_id: str, user_id: int, new_content: str) -> None:
        comment = Comment.objects.get(id=comment_id)
        if comment.user.forum_id == user_id or user_id in ADMIN_IDS:
            comment.content = new_content
            comment.save()

    def create_subcomment(self, user_id: int, comment_id: str, content: str) -> str:
        user = User.objects.get(forum_id=user_id)
        comment = Comment.objects.get(id=comment_id)
        new_subcomment = SubComment(user=user, parent_comment=comment, content=content)
        new_subcomment.save()
        return str(new_subcomment.id)

    def delete_subcomment(self, subcomment_id: str, user_id: int) -> None:
        try:
            subcomment = SubComment.objects.get(id=subcomment_id)
        except DoesNotExist:
            raise ValueError("Subcomment does not exist")

        if subcomment.user.forum_id == user_id or user_id in ADMIN_IDS:
            subcomment.delete()
        else:
            raise PermissionError("User does not have permission to delete this subcomment")

    def edit_subcomment(self, subcomment_id: str, user_id: int, new_content: str) -> None:
        user = User.objects.get(forum_id=user_id)
        if not user:
            raise DoesNotExist("User does not exist")
        subcomment = SubComment.objects.get(id=subcomment_id)
        if subcomment.user.forum_id != user_id:
            raise PermissionError("User does not have permission to edit this subcomment")
        subcomment.content = new_content
        subcomment.save()

    def get_model_by_type(self, message_type: str):
        MODEL_MAPPING = {
            'tweet': Message,
            'comment': Comment,
            'subcomment': SubComment
        }
        model = MODEL_MAPPING.get(message_type)
        if not model:
            raise ValueError(f"Invalid message type: {message_type}")
        return model

    def like(self, user_id: int, message_id: str, message_type: str, value: int) -> None:
        model = self.get_model_by_type(message_type)
        try:
            user = User.objects.get(forum_id=user_id)
            message = model.objects.get(id=message_id)
            # Check if the user has already liked the message
            if any(like for like in message.likes if like.user.forum_id == user_id):
                raise ValueError("User has already liked this message")
            like = Like(user=user, value=value)
            message.likes.append(like)
            message.save()
        except DoesNotExist:
            raise ValueError("User or message does not exist")

    def get_likes(self, user_id: int, message_id: str, message_type: str) -> dict:
        model = self.get_model_by_type(message_type)
        if not model:
            raise ValueError("Invalid message type")

        try:
            message = model.objects.get(id=message_id)
        except model.DoesNotExist:
            raise ValueError(f"{message_type.capitalize()} with ID {message_id} does not exist")

        total_likes = sum(like.value for like in message.likes)
        user_liked = any(like for like in message.likes if like.user.forum_id == user_id)
        return {"total": total_likes, "user_liked": user_liked}

    def remove_like(self, user_id: int, message_id: str, message_type: str) -> None:
        model = self.get_model_by_type(message_type)
        user = User.objects.get(forum_id=user_id)
        message = model.objects.get(id=message_id)
        # Check if the user has liked the message
        if any(like for like in message.likes if like.user.forum_id == user_id):
            message.likes = [like for like in message.likes if like.user.forum_id != user_id]
            message.save()
        else:
            raise ValueError("User has not liked this message")

    def get_user_posts(self, user_id: int) -> list:
        user_posts = Message.objects.filter(user_id=user_id).order_by('-date').limit(10)
        posts_data = []
        for post in user_posts:
            post_data = {
                "post_id": str(post.id),
                "post_content": post.content,
                "post_date": post.date.isoformat(),
                "comments": [{"comment_id": str(comment.id), "comment_content": comment.content} for comment in
                             post.comments],
                "likes": len(post.likes)
            }
            posts_data.append(post_data)
        return posts_data

    def ban_user(self, user_id: int) -> None:
        try:
            user = User.objects.get(forum_id=user_id)
            user.banned = True
            user.save()
        except DoesNotExist as e:
            raise ValueError("User does not exist") from e

    def check_ban_status(self, user_id: int) -> Optional[User]:
        user = User.objects.get(forum_id=user_id)
        if user.banned:
            raise PermissionError("User is banned")
        return user

    def unban_user(self, user_id: int) -> None:
        try:
            user = User.objects.get(forum_id=user_id)
            user.banned = False
            user.save()
        except DoesNotExist as e:
            raise ValueError("User does not exist") from e

    def ignore_user(self, user_id: int, ignored_user_id: int) -> None:
        try:
            user = User.objects.get(forum_id=user_id)
            ignored_user = User.objects.get(forum_id=ignored_user_id)
            if ignored_user not in user.ignored_users:
                user.ignored_users.append(ignored_user)
                user.save()
        except DoesNotExist as e:
            raise ValueError("User or ignored user does not exist") from e

        user = User.objects.get(forum_id=user_id)
        ignored_user = User.objects.get(forum_id=ignored_user_id)
        if ignored_user not in user.ignored_users:
            user.ignored_users.append(ignored_user)
            user.save()

    def unignore_user(self, user_id: int, ignored_user_id: int) -> None:
        if User.objects(forum_id=user_id).count() == 0:
            raise ValueError(f"User with id {user_id} does not exist")

        if User.objects(forum_id=ignored_user_id).count() == 0:
            raise ValueError(f"User to unignore with id {ignored_user_id} does not exist")

        user = User.objects.get(forum_id=user_id)
        ignored_user = User.objects.get(forum_id=ignored_user_id)
        if ignored_user in user.ignored_users:
            user.ignored_users.remove(ignored_user)
            user.save()

    def get_ignored_users(self, user_id: int) -> list:
        if User.objects(forum_id=user_id).count() == 0:
            raise ValueError(f"User with id {user_id} does not exist")

        user = User.objects.get(forum_id=user_id)
        return [MessageManager.user_to_dict(ignored_user) for ignored_user in user.ignored_users]

    def report_message(self, user_id: int, message_id: str, reason: str) -> None:
        try:
            user = User.objects.get(forum_id=user_id)
            message = Message.objects.get(id=message_id)
            new_report = Report(user=user, message=message, reason=reason)
            new_report.save()
        except DoesNotExist:
            raise ValueError("User or message does not exist")

    def report_comment(self, user_id: int, comment_id: str, reason: str) -> None:
        user = User.objects.get(forum_id=user_id)
        comment = Comment.objects.get(id=comment_id)
        new_report = Report(user=user, comment=comment, reason=reason)
        new_report.save()

    def get_top_users(self) -> list:
        return list(User.objects.order_by('-message', '-comment', '-likes'))

    def get_recent_messages(self, offset=0, limit=10, user_id=None) -> dict:
        if user_id:
            # Получаем пользователя по user_id
            user = User.objects.get(forum_id=user_id)

            # Исключаем сообщения от игнорируемых пользователей
            recent_messages_objects = list(
                Message.objects(user__nin=user.ignored_users).order_by('-created_at').skip(offset).limit(limit + 1))
        else:
            recent_messages_objects = list(Message.objects.order_by('-created_at').skip(offset).limit(limit + 1))

        has_more_messages = len(recent_messages_objects) > limit
        if has_more_messages:
            recent_messages_objects = recent_messages_objects[:-1]

        messages_dicts = []
        for message in recent_messages_objects:
            message_dict = MessageManager.message_to_dict(message)

            # Fetch comments for the message
            comments = Comment.objects(message=message.id)
            message_dict['comments'] = [MessageManager.comment_to_dict(comment) for comment in comments]

            # For each comment, fetch subcomments
            for comment_dict in message_dict['comments']:
                subcomments = SubComment.objects(parent_comment=comment_dict['comment_id'])
                comment_dict['subcomments'] = [MessageManager.subcomment_to_dict(subcomment) for subcomment in
                                               subcomments]

            messages_dicts.append(message_dict)

        return {
            "messages": messages_dicts,
            "has_more_messages": has_more_messages
        }

    def send_notification(self, user_id: int, text: str) -> None:
        try:
            user = User.objects.get(forum_id=user_id)
            new_notification = Notification(user=user, text=text)
            new_notification.save()
        except DoesNotExist:
            raise ValueError("User does not exist")

    def get_message_comments(self, message_id: str) -> list:
        message = Message.objects.get(id=message_id)
        return list(Comment.objects(message=message))

    def check_required_fields(self, data, required_fields):
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

    def check_message_length(self, message, max_length):
        if len(message) > max_length:
            raise ValueError(f"Message is too long. Maximum length is {max_length} characters.")
