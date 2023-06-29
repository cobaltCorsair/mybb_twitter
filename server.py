from flask_mongoengine import MongoEngine
from flask import Flask, request
from mongoengine import DoesNotExist
from models import User

app = Flask(__name__)
app.config['MONGODB_SETTINGS'] = {
    'db': 'mybb_twitter',
    'host': 'localhost',
    'port': 27017
}

db = MongoEngine(app)


@app.route('/check_user', methods=['POST'])
def check_user():
    data = request.get_json()
    if data is None:
        return {"message": "No data provided"}, 400
    user_id = data.get('id')
    username = data.get('username')

    try:
        user = User.objects.get(forum_id=user_id)
        return {"message": f"User {username} already exists in the database."}, 200
    except DoesNotExist:
        new_user = User(username=username, forum_id=user_id)
        new_user.save()
        return {"message": f"User {username} has been added to the database."}, 201


if __name__ == "__main__":
    app.run()