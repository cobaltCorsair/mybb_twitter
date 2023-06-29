from flask_mongoengine import MongoEngine
from mongoengine import StringField, IntField, DateTimeField, ListField, ReferenceField, CASCADE

db = MongoEngine()


class User(db.Document):
    """
    User db class
    """
    username = StringField(max_length=255)
    forum_id = IntField()
    message = StringField()
    comment = StringField()
    ignored_users = ListField(ReferenceField('self'))


class Message(db.Document):
    """
    Message db class
    """
    user = ReferenceField(User, reverse_delete_rule=CASCADE)
    content = StringField()
    created_at = DateTimeField()
    likes = ListField(ReferenceField(User))


class Comment(db.Document):
    """
    Comment db class
    """
    user = ReferenceField(User, reverse_delete_rule=CASCADE)
    message = ReferenceField(Message, reverse_delete_rule=CASCADE)
    content = StringField()
    created_at = DateTimeField()
    likes = ListField(ReferenceField(User))
