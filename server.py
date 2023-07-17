from flask import Flask
from flask_mongoengine import MongoEngine
from flask_cors import CORS
from views import UserView, CreateMessageView, DeleteMessageView, UpdateMessageView, CreateCommentView, \
    DeleteCommentView, LikeMessageView, RemoveLikeMessageView, GetMessageLikesView, BanUserView, UnbanUserView, \
    IgnoreUserView, UnignoreUserView, GetIgnoredUsersView, ReportMessageView, ReportCommentView, GetTopUsersView, \
    GetRecentMessagesView, SendNotificationView, GetMessageCommentsView, GetUserPostsView
from socketio_singleton import socketio

app = Flask(__name__)
app.config['MONGODB_SETTINGS'] = {
    'db': 'mybb_twitter',
    'host': 'localhost',
    'port': 27017
}
cors = CORS(app, resources={r"/*": {"origins": "*", "allow_headers": ["Content-Type"],
                                    "methods": ["GET", "POST"]}})
db = MongoEngine(app)
socketio.init_app(app)

view_classes = [
    UserView, CreateMessageView, DeleteMessageView, UpdateMessageView, CreateCommentView,
    DeleteCommentView, LikeMessageView, RemoveLikeMessageView, GetMessageLikesView, BanUserView,
    UnbanUserView, IgnoreUserView, UnignoreUserView, GetIgnoredUsersView, ReportMessageView,
    ReportCommentView, GetTopUsersView, GetRecentMessagesView, SendNotificationView,
    GetMessageCommentsView, GetUserPostsView
]

event_handlers = {
    'new user': 'handle_new_user',
    'create message': 'handle_create_message_socket',
    'delete message': 'handle_delete_message_socket',
    'update message': 'handle_update_message_socket',
    'create comment': 'handle_create_comment_socket',
    'delete comment': 'handle_delete_comment_socket',
    'like message': 'handle_like_message_socket',
    'remove like message': 'handle_remove_like_socket',
    'get message likes': 'handle_get_likes_socket',
    'ban user': 'handle_ban_user_socket',
    'unban user': 'handle_unban_user_socket',
    'ignore user': 'handle_ignore_user_socket',
    'unignore user': 'handle_unignore_user_socket',
    'get ignored users': 'handle_get_ignored_users_socket',
    'report message': 'handle_report_message_socket',
    'report comment': 'handle_report_comment_socket',
    'get top users': 'handle_get_top_users_socket',
    'get recent messages': 'handle_get_recent_messages_socket',
    'send notification': 'handle_send_notification_socket',
    'get message comments': 'handle_get_message_comments_socket',
    'get user posts': 'handle_get_user_posts_socket',
}

view_instances = {view_class: view_class(socketio) for view_class in view_classes}

for event_name, handler_name in event_handlers.items():
    for view_instance in view_instances.values():
        if hasattr(view_instance, handler_name):
            socketio.on(event_name)(getattr(view_instance, handler_name))
            break

url_rules = [
    ("/check_user", UserView.as_view('check_user', socketio=socketio), ['POST']),
    ("/create_message", CreateMessageView.as_view('create_message', socketio=socketio), ['POST']),
    ("/delete_message", DeleteMessageView.as_view('delete_message', socketio=socketio), ['POST']),
    ("/update_message", UpdateMessageView.as_view('update_message', socketio=socketio), ['POST']),
    ("/ban_user/<int:user_id>", BanUserView.as_view('ban_user', socketio=socketio), ['POST']),
    ("/unban_user/<int:user_id>", UnbanUserView.as_view('unban_user', socketio=socketio), ['POST']),
    ("/create_comment", CreateCommentView.as_view('create_comment', socketio=socketio), ['POST']),
    ("/delete_comment", DeleteCommentView.as_view('delete_comment', socketio=socketio), ['POST']),
    ("/like_message", LikeMessageView.as_view('like_message', socketio=socketio), ['POST']),
    ("/remove_like_message", RemoveLikeMessageView.as_view('remove_like_message', socketio=socketio), ['POST']),
    ("/get_message_likes/<string:message_id>", GetMessageLikesView.as_view('get_message_likes'), ['GET']),
    ("/ignore_user", IgnoreUserView.as_view('ignore_user', socketio=socketio), ['POST']),
    ("/unignore_user", UnignoreUserView.as_view('unignore_user', socketio=socketio), ['POST']),
    ("/get_ignored_users/<int:user_id>", GetIgnoredUsersView.as_view('get_ignored_users'), ['GET']),
    ("/report_message", ReportMessageView.as_view('report_message', socketio=socketio), ['POST']),
    ("/report_comment", ReportCommentView.as_view('report_comment', socketio=socketio), ['POST']),
    ("/get_top_users", GetTopUsersView.as_view('get_top_users'), ['GET']),
    ("/get_recent_messages", GetRecentMessagesView.as_view('get_recent_messages'), ['GET']),
    ("/send_notification", SendNotificationView.as_view('send_notification', socketio=socketio), ['POST']),
    ("/get_message_comments/<string:message_id>", GetMessageCommentsView.as_view('get_message_comments'), ['GET']),
    ("/get_user_posts/<int:user_id>", GetUserPostsView.as_view('get_user_posts'), ['GET'])
]

for url_rule, view, methods in url_rules:
    app.add_url_rule(url_rule, view_func=view, methods=methods)

if __name__ == "__main__":
    socketio.run(app, debug=True)
