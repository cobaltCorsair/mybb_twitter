from flask import Flask
from flask_mongoengine import MongoEngine
from flask_cors import CORS

from server import *

app = Flask(__name__)
app.config['MONGODB_SETTINGS'] = {
    'db': 'mybb_twitter',
    'host': 'localhost',
    'port': 27017
}
cors = CORS(app, resources={r"/*": {"origins": "*", "allow_headers": ["Content-Type"],
                                    "methods": ["GET", "POST"]}})
db = MongoEngine(app)

app.add_url_rule('/check_user', view_func=UserView.as_view('check_user'), methods=['POST'])
app.add_url_rule('/create_message', view_func=CreateMessageView.as_view('create_message'), methods=['POST'])
app.add_url_rule('/delete_message', view_func=DeleteMessageView.as_view('delete_message'), methods=['POST'])
app.add_url_rule('/update_message', view_func=UpdateMessageView.as_view('update_message'), methods=['POST'])
app.add_url_rule('/ban_user/<int:user_id>', view_func=BanUserView.as_view('ban_user'), methods=['POST'])
app.add_url_rule('/unban_user/<int:user_id>', view_func=UnbanUserView.as_view('unban_user'), methods=['POST'])
app.add_url_rule('/create_comment', view_func=CreateCommentView.as_view('create_comment'), methods=['POST'])
app.add_url_rule('/delete_comment', view_func=DeleteCommentView.as_view('delete_comment'), methods=['POST'])
app.add_url_rule('/like_message', view_func=LikeMessageView.as_view('like_message'), methods=['POST'])
app.add_url_rule('/remove_like_message',
                 view_func=RemoveLikeMessageView.as_view('remove_like_message'), methods=['POST'])
app.add_url_rule('/get_message_likes/<string:message_id>',
                 view_func=GetMessageLikesView.as_view('get_message_likes'), methods=['GET'])

if __name__ == "__main__":
    app.run()
