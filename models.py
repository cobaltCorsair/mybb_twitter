from flask_mongoengine import MongoEngine
from mongoengine import StringField, IntField, DateTimeField, ListField, ReferenceField, CASCADE, BooleanField, \
    EmbeddedDocument, EmbeddedDocumentField

db = MongoEngine()


class User(db.Document):
    """
    User db class
    """
    username = StringField(max_length=255, unique=True)
    forum_id = IntField(unique=True)
    message = StringField()
    comment = StringField()
    ignored_users = ListField(ReferenceField('self'))
    banned = BooleanField(default=False)


class Like(EmbeddedDocument):
    """
    Like db class
    """
    user = ReferenceField(User, reverse_delete_rule=CASCADE)
    value = IntField()  # 1 for like, -1 for dislike


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
