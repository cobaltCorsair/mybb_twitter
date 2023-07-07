from typing import Optional, Any
from flask import request, jsonify
from flask.views import MethodView
from flask_cors import cross_origin

from models import User
from user_functions import UserService

user_service = UserService()


class UserView(MethodView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        """
        Create a new user or return an existing one.

        :param self: An instance of UserView.
        :return: A tuple containing a message and an HTTP status code.
        """
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        username: str = data.get('username')
        avatar_url: str = data.get('avatar_url')  # Get avatar URL from request data

        if user_service.user_exists(user_id):
            user_service.update_username_and_avatar(user_id, username, avatar_url)
            return jsonify({"message": f"User {username} already exists in the database."}), 200
        user_service.create_user(user_id, username, avatar_url)
        return jsonify({"message": f"User {username} has been added to the database."}), 201

class CreateMessageView(MethodView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        """
        Create a new message for a user.

        :param self: An instance of MessageView.
        :return: A tuple containing a message and an HTTP status code.
        """
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        username: str = data.get('username')
        avatar_url: str = data.get('avatar_url')  # Get avatar URL from request data
        content: str = data.get('content')

        if not user_service.user_exists(user_id):
            user_service.create_user(user_id, username, avatar_url)
        else:
            user_service.update_username_and_avatar(user_id, username, avatar_url)

        user = User.objects.get(forum_id=user_id)
        if user.banned:
            return jsonify({"message": f"User {username} is banned and cannot create messages."}), 403

        user_service.create_message(user_id, content)

        return jsonify({"message": f"Message has been created for user {username}."}), 201


class DeleteMessageView(MethodView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        message_id: str = data.get('message_id')
        user_id: int = data.get('user_id')

        user_service.delete_message(message_id, user_id)

        return jsonify({"message": f"Message with id {message_id} has been deleted."}), 200


class UpdateMessageView(MethodView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        message_id: str = data.get('message_id')
        user_id: int = data.get('user_id')
        new_content: str = data.get('new_content')

        user_service.edit_message(message_id, user_id, new_content)

        return jsonify({"message": f"Message with id {message_id} has been edited."}), 200


class CreateCommentView(MethodView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        """
        Create a new comment for a message.

        :param self: An instance of CommentView.
        :return: A tuple containing a message and an HTTP status code.
        """
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        message_id: str = data.get('message_id')
        content: str = data.get('content')

        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404

        user_service.create_comment(user_id, message_id, content)

        return jsonify({"message": f"Comment has been created for message {message_id}."}), 201


class DeleteCommentView(MethodView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        """
        Delete a comment.

        :param self: An instance of DeleteCommentView.
        :return: A tuple containing a message and an HTTP status code.
        """
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        comment_id: str = data.get('comment_id')

        if not user_service.user_exists(user_id):
            return jsonify({"message": "User does not exist"}), 404

        user_service.delete_comment(comment_id, user_id)

        return jsonify({"message": f"Comment {comment_id} has been deleted."}), 200


class LikeMessageView(MethodView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        """
        Like a message.

        :param self: An instance of LikeMessageView.
        :return: A tuple containing a message and an HTTP status code.
        """
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        message_id: str = data.get('message_id')

        user_service.like(user_id, message_id, 1)

        return jsonify({"message": f"Message with id {message_id} has been liked."}), 200


class RemoveLikeMessageView(MethodView):
    @cross_origin()
    def post(self) -> tuple[Any, int]:
        """
        Remove like from a message.

        :param self: An instance of RemoveLikeMessageView.
        :return: A tuple containing a message and an HTTP status code.
        """
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('user_id')
        message_id: str = data.get('message_id')

        try:
            user_service.remove_like(user_id, message_id)
            return jsonify({"message": f"Like has been removed from message with id {message_id}."}), 200
        except ValueError:
            return jsonify({"message": "User has not liked this message"}), 400


class GetMessageLikesView(MethodView):
    @cross_origin()
    def get(self, message_id: str) -> tuple[Any, int]:
        """
        Get the number of likes for a message.

        :param self: An instance of GetMessageLikesView.
        :param message_id: The ID of the message.
        :return: A tuple containing a message and an HTTP status code.
        """
        likes = user_service.get_likes(message_id)
        return jsonify({"likes": likes}), 200


class BanUserView(MethodView):
    @cross_origin()
    def post(self, user_id: int) -> tuple[Any, int]:
        """
        Ban a user.

        :param self: An instance of BanUserView.
        :param user_id: The ID of the user to be banned.
        :return: A tuple containing a message and an HTTP status code.
        """
        user_service.ban_user(user_id)
        return jsonify({"message": f"User with id {user_id} has been banned."}), 200


class UnbanUserView(MethodView):
    @cross_origin()
    def post(self, user_id: int) -> tuple[Any, int]:
        """
        Unban a user.

        :param self: An instance of UnbanUserView.
        :param user_id: The ID of the user to be unbanned.
        :return: A tuple containing a message and an HTTP status code.
        """
        user_service.unban_user(user_id)
        return jsonify({"message": f"User with id {user_id} has been unbanned."}), 200
