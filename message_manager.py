from datetime import datetime, timezone
from models import Comment, SubComment


class MessageManager:

    @staticmethod
    def human_readable_time_difference(dt):
        now = datetime.now(timezone.utc)
        if dt.tzinfo is None:  # if dt is naive
            dt = dt.replace(tzinfo=timezone.utc)
        diff = now - dt

        seconds_in_day = 86400
        seconds_in_hour = 3600
        seconds_in_minute = 60

        if diff.days > 1:
            return f"{diff.days} дн. назад"
        elif diff.days == 1:
            return "1 день назад"
        elif diff.seconds >= seconds_in_hour:
            hours = diff.seconds // seconds_in_hour
            return f"{hours} ч. назад" if hours > 1 else "1 час назад"
        elif diff.seconds >= seconds_in_minute:
            minutes = diff.seconds // seconds_in_minute
            return f"{minutes} мин. назад"
        else:
            return "только что"

    @staticmethod
    def message_to_dict(message):
        comments_pipeline = [
            {"$match": {"message": message.id}},
            {"$group": {"_id": "$message", "count": {"$sum": 1}}}
        ]
        comments_data = list(Comment.objects.aggregate(*comments_pipeline))
        comments_count = comments_data[0]['count'] if comments_data else 0

        subcomments_pipeline = [
            {"$match": {
                "parent_comment": {"$in": [comment.id for comment in Comment.objects(message=message.id)]}}},
            {"$group": {"_id": None, "count": {"$sum": 1}}}
        ]
        subcomments_data = list(SubComment.objects.aggregate(*subcomments_pipeline))
        subcomments_count = subcomments_data[0]['count'] if subcomments_data else 0

        return {
            'user_id': str(message.user.id) if message.user else None,
            'message_id': str(message.id),
            'content': message.content,
            'created_at': MessageManager.human_readable_time_difference(
                message.created_at) if message.created_at else None,
            'username': message.user.username if message.user else None,
            'avatar_url': message.user.avatar_url if message.user else None,  # Add avatar_url here
            'likes': len(message.likes),
            'comments': comments_count,
            'subcomments': subcomments_count
        }

    @staticmethod
    def comment_to_dict(comment):
        return {
            'user_id': str(comment.user.id) if comment.user else None,
            'comment_id': str(comment.id),
            'content': comment.content,
            'created_at': MessageManager.human_readable_time_difference(
                comment.created_at) if comment.created_at else None,
            'username': comment.user.username if comment.user else None,
            'avatar_url': comment.user.avatar_url if comment.user else None,
            'likes': len(comment.likes),
        }

    @staticmethod
    def subcomment_to_dict(subcomment):
        return {
            'user_id': str(subcomment.user.id) if subcomment.user else None,
            'subcomment_id': str(subcomment.id),
            'content': subcomment.content,
            'created_at': MessageManager.human_readable_time_difference(
                subcomment.created_at) if subcomment.created_at else None,
            'username': subcomment.user.username if subcomment.user else None,
            'avatar_url': subcomment.user.avatar_url if subcomment.user else None,
            'likes': len(subcomment.likes),
        }
