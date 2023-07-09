from flask_mongoengine import MongoEngine
from mongoengine import StringField, IntField, DateTimeField, ListField, ReferenceField, CASCADE, BooleanField, \
    EmbeddedDocument, EmbeddedDocumentField

db = MongoEngine()


class User(db.Document):
    """
    User db class
    """
    username = StringField(max_length=255, unique=True)
    avatar_url = StringField()  # New field for avatar URL
    forum_id = IntField(unique=True)
    message = StringField()
    comment = StringField()
    ignored_users = ListField(ReferenceField('self'))
    banned = BooleanField(default=False)


class Like(EmbeddedDocument):
    """
    Like db class
    """
    user = ReferenceField(User)
    value = IntField()  # 1 for like


class Message(db.Document):
    """
    Message db class
    """
    user = ReferenceField(User, reverse_delete_rule=CASCADE)
    content = StringField()
    created_at = DateTimeField()
    likes = ListField(EmbeddedDocumentField(Like))


class Comment(db.Document):
    """
    Comment db class
    """
    user = ReferenceField(User, reverse_delete_rule=CASCADE)
    message = ReferenceField(Message, reverse_delete_rule=CASCADE)
    content = StringField()
    created_at = DateTimeField()
    likes = ListField(EmbeddedDocumentField(Like))

class Report(db.Document):
    """
    Report db class
    """
    user = ReferenceField(User, reverse_delete_rule=CASCADE)
    message = ReferenceField(Message, reverse_delete_rule=CASCADE)
    comment = ReferenceField(Comment, reverse_delete_rule=CASCADE)
    reason = StringField()
    created_at = DateTimeField()


class Notification(db.Document):
    """
    Notification db class
    """
    user = ReferenceField(User, reverse_delete_rule=CASCADE)
    text = StringField()
    read = BooleanField(default=False)
    created_at = DateTimeField()