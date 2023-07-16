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

# Create instances of all classes
user_view = UserView(socketio)
create_message_view = CreateMessageView(socketio)
delete_message_view = DeleteMessageView(socketio)
update_message_view = UpdateMessageView(socketio)
create_comment_view = CreateCommentView(socketio)
delete_comment_view = DeleteCommentView(socketio)
like_message_view = LikeMessageView(socketio)
remove_like_message_view = RemoveLikeMessageView(socketio)
get_message_likes_view = GetMessageLikesView(socketio)
ban_user_view = BanUserView(socketio)
unban_user_view = UnbanUserView(socketio)
ignore_user_view = IgnoreUserView(socketio)
unignore_user_view = UnignoreUserView(socketio)
get_ignored_users_view = GetIgnoredUsersView(socketio)
report_message_view = ReportMessageView(socketio)
report_comment_view = ReportCommentView(socketio)
get_top_users_view = GetTopUsersView(socketio)
get_recent_messages_view = GetRecentMessagesView(socketio)
send_notification_view = SendNotificationView(socketio)
get_message_comments_view = GetMessageCommentsView(socketio)
get_user_posts_view = GetUserPostsView(socketio)

# Register the methods of the instances as event handlers
socketio.on('new user')(user_view.handle_new_user)
socketio.on('create message')(create_message_view.handle_create_message_socket)
socketio.on('delete message')(delete_message_view.handle_delete_message_socket)
socketio.on('update message')(update_message_view.handle_update_message_socket)
socketio.on('create comment')(create_comment_view.handle_create_comment_socket)
socketio.on('delete comment')(delete_comment_view.handle_delete_comment_socket)
socketio.on('like message')(like_message_view.handle_like_message_socket)
socketio.on('remove like message')(remove_like_message_view.handle_remove_like_socket)
socketio.on('get message likes')(get_message_likes_view.handle_get_likes_socket)
socketio.on('ban user')(ban_user_view.handle_ban_user_socket)
socketio.on('unban user')(unban_user_view.handle_unban_user_socket)
socketio.on('ignore user')(ignore_user_view.handle_ignore_user_socket)
socketio.on('unignore user')(unignore_user_view.handle_unignore_user_socket)
socketio.on('get ignored users')(get_ignored_users_view.handle_get_ignored_users_socket)
socketio.on('report message')(report_message_view.handle_report_message_socket)
socketio.on('report comment')(report_comment_view.handle_report_comment_socket)
socketio.on('get top users')(get_top_users_view.handle_get_top_users_socket)
socketio.on('get recent messages')(get_recent_messages_view.handle_get_recent_messages_socket)
socketio.on('send notification')(send_notification_view.handle_send_notification_socket)
socketio.on('get message comments')(get_message_comments_view.handle_get_message_comments_socket)
socketio.on('get user posts')(get_user_posts_view.handle_get_user_posts_socket)

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
