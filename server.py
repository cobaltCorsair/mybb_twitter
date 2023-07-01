from typing import Optional, Any
from flask import request, jsonify
from flask.views import MethodView

from models import User
from user_functions import UserService
from server_settings import app, db

user_service = UserService()


class UserView(MethodView):
    def post(self) -> tuple[Any, int]:
        """
        Create a new user or return an existing one.

        :param self: An instance of UserView.
        :return: A tuple containing a message and an HTTP status code.
        """
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('id')
        username: str = data.get('username')

        if user_service.user_exists(user_id):
            return jsonify({"message": f"User {username} already exists in the database."}), 200
        user_service.create_user(user_id, username)
        return jsonify({"message": f"User {username} has been added to the database."}), 201


class MessageView(MethodView):
    def post(self) -> tuple[Any, int]:
        """
        Create a new message for a user.

        :param self: An instance of MessageView.
        :return: A tuple containing a message and an HTTP status code.
        """
        data: Optional[dict] = request.get_json()
        if data is None:
            return jsonify({"message": "No data provided"}), 400
        user_id: int = data.get('id')
        username: str = data.get('username')
        content: str = data.get('content')

        if not user_service.user_exists(user_id):
            user_service.create_user(user_id, username)
        else:
            user_service.update_username(user_id, username)

        user = User.objects.get(forum_id=user_id)
        if user.banned:
            return jsonify({"message": f"User {username} is banned and cannot create messages."}), 403

        user_service.create_message(user_id, content)

        return jsonify({"message": f"Message has been created for user {username}."}), 201


class BanUserView(MethodView):
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
    def post(self, user_id: int) -> tuple[Any, int]:
        """
        Unban a user.

        :param self: An instance of UnbanUserView.
        :param user_id: The ID of the user to be unbanned.
        :return: A tuple containing a message and an HTTP status code.
        """
        user_service.unban_user(user_id)
        return jsonify({"message": f"User with id {user_id} has been unbanned."}), 200


app.add_url_rule('/check_user', view_func=UserView.as_view('check_user'))
app.add_url_rule('/create_message', view_func=MessageView.as_view('create_message'))
app.add_url_rule('/ban_user/<int:user_id>', view_func=BanUserView.as_view('ban_user'))
app.add_url_rule('/unban_user/<int:user_id>', view_func=UnbanUserView.as_view('unban_user'))

if __name__ == "__main__":
    app.run()
