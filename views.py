from typing import Any, Optional
from flask import request, jsonify
from flask.views import MethodView
from flask_cors import cross_origin
from socketio_singleton import socketio
from models import User, Comment
from user_functions import UserService

user_service = UserService()


class BaseView(MethodView):
    def __init__(self, socketio):
        self.socketio = socketio


class UserView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_user(data)

    @socketio.on('new user')
    def handle_new_user(self, data: dict):
        self.handle_user(data)

    def handle_user(self, data: dict):
        try:
            user_service.check_required_fields(data, ['user_id', 'username', 'avatar_url'])
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        user_id: int = data.get('user_id')
        username: str = data.get('username')
        avatar_url: str = data.get('avatar_url')  # Get avatar URL from request data

        if user_service.user_exists(user_id):
            user_service.update_username_and_avatar(user_id, username, avatar_url)
            return jsonify({"message": f"User {username} already exists in the database."}), 200
        user_service.create_user(user_id, username, avatar_url)

        self.socketio.emit('new user', data, room='room')
        return jsonify({"message": f"User {username} has been added to the database."}), 201


class CreateMessageView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_create_message(data)

    @socketio.on('create message')
    def handle_create_message_socket(self, data: dict):
        content: str = data.get('content')
        try:
            user_service.check_message_length(content, 500)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        return self.handle_create_message(data)

    @socketio.on('new tweet')
    def handle_new_tweet_socket(self, data: dict):
        # Этот метод может оставаться пустым, так как он используется только для регистрации события
        pass

    def handle_create_message(self, data: dict):
        user_id: int = data.get('user_id')
        username: str = data.get('username')
        avatar_url: str = data.get('avatar_url')
        content: str = data.get('content')

        if not user_service.user_exists(user_id):
            user_service.create_user(user_id, username, avatar_url)
        else:
            user_service.update_username_and_avatar(user_id, username, avatar_url)

        user = User.objects.get(forum_id=user_id)
        if user.banned:
            return jsonify({"message": f"User {username} is banned and cannot create messages."}), 403

        message_id = user_service.create_message(user_id, content)

        data['message_id'] = message_id
        self.socketio.emit('new tweet', data, room='room')
        return jsonify({"message": f"Message has been created for user {username}.", "message_id": message_id}), 201


class DeleteMessageView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_delete_message(data)

    @socketio.on('delete message')
    def handle_delete_message_socket(self, data: dict):
        return self.handle_delete_message(data)

    def handle_delete_message(self, data: dict):
        message_id: str = data.get('message_id')
        user_id: int = data.get('user_id')

        user_service.delete_message(message_id, user_id)

        self.socketio.emit('delete message', data, room='room')
        return jsonify({"message": f"Message with id {message_id} has been deleted."}), 200


class UpdateMessageView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_update_message(data)

    @socketio.on('update message')
    def handle_update_message_socket(self, data: dict):
        return self.handle_update_message(data)

    def handle_update_message(self, data: dict):
        message_id: str = data.get('message_id')
        user_id: int = data.get('user_id')
        new_content: str = data.get('new_content')
        try:
            user_service.check_message_length(new_content, 500)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        user_service.edit_message(message_id, user_id, new_content)
        self.socketio.emit('update message', data, room='room')
        return jsonify({"message": f"Message with id {message_id} has been edited."}), 200


class CreateCommentView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_create_comment(data)

    @socketio.on('create comment')
    def handle_create_comment_socket(self, data: dict):
        content: str = data.get('content')
        try:
            user_service.check_message_length(content, 500)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        return self.handle_create_comment(data)

    @socketio.on('new comment')
    def handle_new_comment_socket(self, data: dict):
        # Этот метод может оставаться пустым, так как он используется только для регистрации события
        pass

    def handle_create_comment(self, data: dict):
        user_id: int = data.get('user_id')
        message_id: str = data.get('message_id')
        content: str = data.get('content')

        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404

        comment_id = user_service.create_comment(user_id, message_id, content)
        data['comment_id'] = comment_id  # Add the comment id to the data
        self.socketio.emit('new comment', data, room='room')
        return jsonify(
            {"message": f"Comment has been created for message {message_id}.", "comment_id": comment_id}), 201


class DeleteCommentView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_delete_comment(data)

    @socketio.on('delete comment')
    def handle_delete_comment_socket(self, data: dict):
        return self.handle_delete_comment(data)

    def handle_delete_comment(self, data: dict):
        comment_id: str = data.get('comment_id')
        user_id: int = data.get('user_id')

        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404

        user_service.delete_comment(comment_id, user_id)
        self.socketio.emit('delete comment', data, room='room')
        return jsonify({"message": f"Comment {comment_id} has been deleted."}), 200


class UpdateCommentView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_update_comment(data)

    @socketio.on('update comment')
    def handle_update_comment_socket(self, data: dict):
        return self.handle_update_comment(data)

    def handle_update_comment(self, data: dict):
        comment_id: str = data.get('comment_id')
        user_id: int = data.get('user_id')
        new_content: str = data.get('new_content')

        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404

        user_service.update_comment(comment_id, user_id, new_content)
        self.socketio.emit('update comment', data, room='room')
        return jsonify({"message": f"Comment {comment_id} has been updated."}), 200


class CreateSubCommentView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_create_subcomment(data)

    @socketio.on('create subcomment')
    def handle_create_subcomment_socket(self, data: dict):
        content: str = data.get('content')
        try:
            user_service.check_message_length(content, 500)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        return self.handle_create_subcomment(data)

    @socketio.on('new subcomment')
    def handle_new_subcomment_socket(self, data: dict):
        # Этот метод может оставаться пустым, так как он используется только для регистрации события
        pass

    def handle_create_subcomment(self, data: dict):
        user_id: int = data.get('user_id')
        message_id: str = data.get('message_id')
        content: str = data.get('content')

        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404

        try:
            subcomment_id = user_service.create_subcomment(user_id, message_id, content)

        except Comment.DoesNotExist:
            # Здесь вы можете решить, что делать, если комментарий не найден.
            # Например, вернуть сообщение об ошибке.
            return jsonify({"message": f"Comment with ID {message_id} does not exist."}), 404

        data['subcomment_id'] = subcomment_id  # Add the subcomment id to the data
        self.socketio.emit('new subcomment', data, room='room')
        return jsonify(
            {"message": f"SubComment has been created for comment {message_id}.", "subcomment_id": subcomment_id}), 201


class DeleteSubCommentView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_delete_subcomment(data)

    @socketio.on('delete subcomment')
    def handle_delete_subcomment_socket(self, data: dict):
        return self.handle_delete_subcomment(data)

    def handle_delete_subcomment(self, data: dict):
        subcomment_id: str = data.get('subcomment_id')
        user_id: int = data.get('user_id')

        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404

        user_service.delete_subcomment(subcomment_id, user_id)
        self.socketio.emit('delete subcomment', data, room='room')
        return jsonify({"message": f"Subcomment {subcomment_id} has been deleted."}), 200


class UpdateSubCommentView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        return self.handle_update_subcomment(data)

    @socketio.on('update subcomment')
    def handle_update_subcomment_socket(self, data: dict):
        return self.handle_update_subcomment(data)

    def handle_update_subcomment(self, data: dict):
        subcomment_id: str = data.get('subcomment_id')
        user_id: int = data.get('user_id')
        new_content: str = data.get('new_content')
        try:
            user_service.check_message_length(new_content, 500)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        user_service.edit_subcomment(subcomment_id, user_id, new_content)
        self.socketio.emit('update subcomment', data, room='room')
        return jsonify({"message": f"Subcomment with id {subcomment_id} has been edited."}), 200


class LikeMessageView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400

        user_id: int = data.get('user_id')
        message_id: str = data.get('message_id')
        message_type: str = data.get('message_type')
        return self.handle_like_message(user_id, message_id, message_type)

    @socketio.on('like message')
    def handle_like_message_socket(self, user_id: int, message_id: str, message_type: str):
        return self.handle_like_message(user_id, message_id, message_type)

    def handle_like_message(self, user_id: int, message_id: str, message_type: str):
        try:
            user_service.like(user_id, message_id, message_type, 1)  # Передаем message_type в функцию
            likes_data = user_service.get_likes(user_id, message_id, message_type)  # Передаем message_type в функцию
            self.socketio.emit('like message', {"message_id": message_id, "likes": likes_data}, room='room')
            self.socketio.emit('message likes', {"message_id": message_id, "likes": likes_data}, room='room')
            return jsonify({"message": f"Message with id {message_id} has been liked."}), 200
        except ValueError as e:
            return jsonify({"message": str(e)}), 400


class RemoveLikeMessageView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400

        user_id: int = data.get('user_id')
        message_id: str = data.get('message_id')
        message_type: str = data.get('message_type')
        return self.handle_remove_like(user_id, message_id, message_type)

    @socketio.on('remove like message')
    def handle_remove_like_socket(self, user_id: int, message_id: str, message_type: str):
        return self.handle_remove_like(user_id, message_id, message_type)

    def handle_remove_like(self, user_id: int, message_id: str, message_type: str):
        try:
            user_service.remove_like(user_id, message_id, message_type)  # Передаем message_type в функцию
            likes_data = user_service.get_likes(user_id, message_id, message_type)  # Передаем message_type в функцию
            self.socketio.emit('message likes', {"message_id": message_id, "likes": likes_data}, room='room')
            return jsonify({"message": f"Like has been removed from message with id {message_id}."}), 200
        except ValueError:
            return jsonify({"message": "User has not liked this message"}), 400


class GetMessageLikesView(BaseView):
    @cross_origin()
    def get(self, user_id: int, message_id: str, message_type: str) -> tuple[Any, int]:
        return self.handle_get_likes(user_id, message_id, message_type)

    @socketio.on('get message likes')
    def handle_get_likes_socket(self, user_id: int, message_id: str, message_type: str):
        return self.handle_get_likes(user_id, message_id, message_type)

    def handle_get_likes(self, user_id: int, message_id: str, message_type: str):
        likes = user_service.get_likes(user_id, message_id, message_type)  # Передаем message_type в функцию
        self.socketio.emit('message likes', {"message_id": message_id, "likes": likes}, room='room')
        return jsonify({"likes": likes}), 200


class BanUserView(BaseView):
    @cross_origin()
    def post(self, user_id: int) -> tuple[Any, int]:
        return self.handle_ban_user(user_id)

    @socketio.on('ban user')
    def handle_ban_user_socket(self, user_id: int):
        return self.handle_ban_user(user_id)

    def handle_ban_user(self, user_id: int):
        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404
        if user_service.check_ban_status(user_id):
            return jsonify({"message": "User is already banned"}), 400
        user_service.ban_user(user_id)
        self.socketio.emit('ban user', {'user_id': user_id}, room='room')
        return jsonify({"message": f"User with id {user_id} has been banned."}), 200


class UnbanUserView(BaseView):
    @cross_origin()
    def post(self, user_id: int) -> tuple[Any, int]:
        return self.handle_unban_user(user_id)

    @socketio.on('unban user')
    def handle_unban_user_socket(self, user_id: int):
        return self.handle_unban_user(user_id)

    def handle_unban_user(self, user_id: int):
        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404
        if not user_service.check_ban_status(user_id):
            return jsonify({"message": "User is not banned"}), 400
        user_service.unban_user(user_id)
        self.socketio.emit('unban user', {'user_id': user_id}, room='room')
        return jsonify({"message": f"User with id {user_id} has been unbanned."}), 200


class IgnoreUserView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        return self.handle_ignore_user(data)

    @socketio.on('ignore user')
    def handle_ignore_user_socket(self, data: dict):
        return self.handle_ignore_user(data)

    def handle_ignore_user(self, data: dict):
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        ignored_user_id: int = data.get('ignored_user_id')

        try:
            user_service.ignore_user(user_id, ignored_user_id)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400

        # Отправляем обновленный список игнорируемых пользователей
        ignored_users = user_service.get_ignored_users(user_id)
        self.socketio.emit('update ignored users', ignored_users, room='room')
        self.socketio.emit('ignore user', data, room='room')
        return jsonify(
            {"message": f"User with id {ignored_user_id} has been added to ignore list of user {user_id}."}), 200


class UnignoreUserView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        return self.handle_unignore_user(data)

    @socketio.on('unignore user')
    def handle_unignore_user_socket(self, data: dict):
        return self.handle_unignore_user(data)

    def handle_unignore_user(self, data: dict):
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        ignored_user_id: int = data.get('ignored_user_id')

        try:
            user_service.unignore_user(user_id, ignored_user_id)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400

        self.socketio.emit('unignore user', data, room='room')
        return jsonify(
            {"message": f"User with id {ignored_user_id} has been removed from ignore list of user {user_id}."}), 200


class GetIgnoredUsersView(BaseView):
    @cross_origin()
    def get(self, user_id: int) -> tuple[Any, int]:
        return self.handle_get_ignored_users(user_id)

    @socketio.on('get ignored users')
    def handle_get_ignored_users_socket(self, data: dict):
        user_id = data.get('user_id')
        return self.handle_get_ignored_users(user_id)

    def handle_get_ignored_users(self, user_id: int):
        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404
        try:
            ignored_users = user_service.get_ignored_users(user_id)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        self.socketio.emit('update ignored users', ignored_users, room='room')
        return jsonify({"ignored_users": ignored_users}), 200


class ReportMessageView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        return self.handle_report_message(data)

    @socketio.on('report message')
    def handle_report_message_socket(self, data: dict):
        return self.handle_report_message(data)

    def handle_report_message(self, data: dict):
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        message_id: str = data.get('message_id')
        reason: str = data.get('reason')

        user_service.report_message(user_id, message_id, reason)

        self.socketio.emit('report message', data, room='room')
        return jsonify({"message": f"Message with id {message_id} has been reported."}), 200


class ReportCommentView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        return self.handle_report_comment(data)

    @socketio.on('report comment')
    def handle_report_comment_socket(self, data: dict):
        return self.handle_report_comment(data)

    def handle_report_comment(self, data: dict):
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        comment_id: str = data.get('comment_id')
        reason: str = data.get('reason')

        user_service.report_comment(user_id, comment_id, reason)

        self.socketio.emit('report comment', data, room='room')
        return jsonify({"message": f"Comment with id {comment_id} has been reported."}), 200


class GetTopUsersView(BaseView):
    @cross_origin()
    def get(self) -> tuple[Any, int]:
        return self.handle_get_top_users()

    @socketio.on('get top users')
    def handle_get_top_users_socket(self):
        return self.handle_get_top_users()

    def handle_get_top_users(self):
        top_users = user_service.get_top_users()
        return jsonify({"top_users": [user.forum_id for user in top_users]}), 200


class GetRecentMessagesView(BaseView):
    @cross_origin()
    def get(self) -> tuple[Any, int]:
        return self.handle_get_recent_messages()

    @socketio.on('get recent messages')
    def handle_get_recent_messages_socket(self, data: dict):
        offset = data.get('offset', 0)
        user_id = data.get('user_id')
        return self.handle_get_recent_messages(user_id, offset)

    def handle_get_recent_messages(self, user_id, offset=0):
        response_data = user_service.get_recent_messages(offset=offset, user_id=user_id)
        recent_messages_dicts = response_data['messages']
        self.socketio.emit('recent messages', response_data, room='room')
        return jsonify({"recent_messages": [message['message_id'] for message in recent_messages_dicts]}), 200


class SendNotificationView(BaseView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        return self.handle_send_notification(data)

    @socketio.on('send notification')
    def handle_send_notification_socket(self, data: dict):
        return self.handle_send_notification(data)

    def handle_send_notification(self, data: dict):
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        text: str = data.get('text')

        user_service.send_notification(user_id, text)

        self.socketio.emit('send notification', data, room='room')
        return jsonify({"message": f"Notification has been sent to user with id {user_id}."}), 200


class GetMessageCommentsView(BaseView):
    @cross_origin()
    def get(self, message_id: str) -> tuple[Any, int]:
        return self.handle_get_message_comments(message_id)

    @socketio.on('get message comments')
    def handle_get_message_comments_socket(self, data: dict):
        return self.handle_get_message_comments(data.get('message_id'))

    def handle_get_message_comments(self, message_id: str):
        comments = user_service.get_message_comments(message_id)
        self.socketio.emit('get message comments',
                      {"message_id": message_id, "comments": [str(comment.id) for comment in comments]}, room='room')
        return jsonify({"comments": [str(comment.id) for comment in comments]}), 200


class GetUserPostsView(BaseView):
    @cross_origin()
    def get(self, user_id: int) -> tuple[Any, int]:
        return self.handle_get_user_posts(user_id)

    @socketio.on('get user posts')
    def handle_get_user_posts_socket(self, data: dict):
        return self.handle_get_user_posts(data.get('user_id'))

    def handle_get_user_posts(self, user_id: int):
        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404
        posts_data = user_service.get_user_posts(user_id)
        self.socketio.emit('get user posts', {"user_id": user_id, "posts_data": posts_data}, room='room')
        return jsonify({"user_posts": posts_data}), 200
