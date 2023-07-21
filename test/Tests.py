import unittest
from unittest.mock import Mock, patch, call, MagicMock
from user_functions import UserService


class TestUserService(unittest.TestCase):

    @patch("user_functions.User")
    def test_user_exists(self, mock_user):
        mock_user.objects.get.return_value = Mock()
        service = UserService()
        self.assertTrue(service.user_exists(1))
        mock_user.objects.get.assert_called_once_with(forum_id=1)

    @patch("user_functions.User")
    def test_create_user(self, mock_user):
        mock_user.return_value = Mock()
        service = UserService()
        service.create_user(1, "username", "avatar_url")
        mock_user.assert_called_once_with(username="username", forum_id=1, avatar_url="avatar_url")
        mock_user.return_value.save.assert_called_once()

    @patch("user_functions.User")
    def test_update_username_and_avatar(self, mock_user):
        mock_user.objects.get.return_value = Mock(username="old_username", avatar_url="old_avatar_url")
        service = UserService()
        service.update_username_and_avatar(1, "new_username", "new_avatar_url")
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        self.assertEqual(mock_user.objects.get.return_value.username, "new_username")
        self.assertEqual(mock_user.objects.get.return_value.avatar_url, "new_avatar_url")
        mock_user.objects.get.return_value.save.assert_called_once()

    @patch("user_functions.Message")
    @patch("user_functions.User")
    def test_create_message(self, mock_user, mock_message):
        mock_user.objects.get.return_value = Mock()
        mock_message.return_value = Mock()
        service = UserService()
        service.create_message(1, "content")
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        mock_message.assert_called_once_with(user=mock_user.objects.get.return_value, content="content")
        mock_message.return_value.save.assert_called_once()

    @patch("user_functions.Message")
    @patch("user_functions.User")
    def test_delete_message(self, mock_user, mock_message):
        mock_message.objects.get.return_value = Mock(user=mock_user)
        service = UserService()
        service.delete_message("message_id", 1)
        mock_message.objects.get.assert_called_once_with(id="message_id")
        mock_message.objects.get.return_value.delete.assert_called_once()

    @patch("user_functions.Message")
    @patch("user_functions.User")
    def test_edit_message(self, mock_user, mock_message):
        mock_user.objects.get.return_value = Mock()
        mock_message.objects.get.return_value = Mock(user=mock_user)
        mock_message.objects.get.return_value.user.forum_id = 1
        service = UserService()
        service.edit_message("message_id", 1, "new_content")
        mock_message.objects.get.assert_called_once_with(id="message_id")
        self.assertEqual(mock_message.objects.get.return_value.content, "new_content")
        mock_message.objects.get.return_value.save.assert_called_once()

    @patch("user_functions.Comment")
    @patch("user_functions.Message")
    @patch("user_functions.User")
    def test_create_comment(self, mock_user, mock_message, mock_comment):
        mock_user.objects.get.return_value = Mock()
        mock_message.objects.get.return_value = Mock()
        mock_comment.return_value = Mock()
        service = UserService()
        service.create_comment(1, "message_id", "content")
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        mock_message.objects.get.assert_called_once_with(id="message_id")
        mock_comment.assert_called_once_with(user=mock_user.objects.get.return_value,
                                             message=mock_message.objects.get.return_value, content="content")
        mock_comment.return_value.save.assert_called_once()

    @patch("user_functions.Comment")
    @patch("user_functions.User")
    def test_delete_comment(self, mock_user, mock_comment):
        mock_comment.objects.get.return_value = Mock(user=mock_user)
        service = UserService()
        service.delete_comment("comment_id", 1)
        mock_comment.objects.get.assert_called_once_with(id="comment_id")
        mock_comment.objects.get.return_value.delete.assert_called_once()

    @patch("user_functions.Like")
    @patch("user_functions.Message")
    @patch("user_functions.User")
    def test_like(self, mock_user, mock_message, mock_like):
        mock_user.objects.get.return_value = Mock()
        mock_message.objects.get.return_value = Mock()
        mock_message.objects.get.return_value.likes = [Mock()]
        mock_like.return_value = Mock()
        service = UserService()
        service.like(1, "message_id", 1)
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        mock_message.objects.get.assert_called_once_with(id="message_id")
        mock_like.assert_called_once_with(user=mock_user.objects.get.return_value, value=1)
        self.assertIn(mock_like.return_value, mock_message.objects.get.return_value.likes)
        mock_message.objects.get.return_value.save.assert_called_once()

    @patch("user_functions.Message")
    @patch("user_functions.User")
    def test_get_user_posts(self, mock_user, mock_message):
        from datetime import datetime
        mock_message.objects.filter.return_value.order_by.return_value.limit.return_value = [
            Mock(id="post_id", content="content", date=datetime.now(), comments=[], likes=[])]
        service = UserService()
        posts = service.get_user_posts(1)
        expected = [
            {"post_id": "post_id", "post_content": "content", "post_date": datetime.now().isoformat(), "comments": [],
             "likes": 0}]
        for post, exp in zip(posts, expected):
            self.assertEqual(post["post_id"], exp["post_id"])
            self.assertEqual(post["post_content"], exp["post_content"])
            self.assertEqual(post["comments"], exp["comments"])
            self.assertEqual(post["likes"], exp["likes"])

    @patch("user_functions.Like")
    @patch("user_functions.Message")
    def test_get_likes(self, mock_message, mock_like):
        mock_likes = [Mock(value=i) for i in range(10)]
        mock_message.objects.get.return_value.likes = mock_likes
        service = UserService()
        likes = service.get_likes("message_id")
        mock_message.objects.get.assert_called_once_with(id="message_id")
        self.assertEqual(likes, sum(like.value for like in mock_likes))

    @patch("user_functions.Message")
    @patch("user_functions.User")
    def test_remove_like(self, mock_user, mock_message):
        mock_like = Mock(user=mock_user)
        mock_message.objects.get.return_value.likes = [mock_like]
        service = UserService()
        like = Mock()
        like.user.forum_id = 1
        mock_message.objects.get.return_value.likes = [like]
        service.remove_like(1, "message_id")
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        mock_message.objects.get.assert_called_once_with(id="message_id")
        self.assertNotIn(mock_like, mock_message.objects.get.return_value.likes)
        mock_message.objects.get.return_value.save.assert_called_once()

    @patch("user_functions.User")
    def test_ban_user(self, mock_user):
        mock_user.objects.get.return_value = Mock(banned=False)
        service = UserService()
        service.ban_user(1)
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        self.assertTrue(mock_user.objects.get.return_value.banned)
        mock_user.objects.get.return_value.save.assert_called_once()

    @patch("user_functions.User")
    def test_unban_user(self, mock_user):
        mock_user.objects.get.return_value = Mock(banned=True)
        service = UserService()
        service.unban_user(1)
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        self.assertFalse(mock_user.objects.get.return_value.banned)
        mock_user.objects.get.return_value.save.assert_called_once()

    @patch("user_functions.User")
    def test_ignore_user(self, mock_user):
        mock_user.objects.get.return_value = Mock()
        ignored_user = Mock()
        mock_user.objects.get.return_value.ignored_users = [ignored_user]
        service = UserService()
        service.ignore_user(1, 2)
        mock_user.objects.get.assert_any_call(forum_id=1)
        mock_user.objects.get.assert_any_call(forum_id=2)
        self.assertIn(ignored_user, mock_user.objects.get.return_value.ignored_users)
        mock_user.objects.get.return_value.save.assert_called_once()

    @patch("user_functions.User")
    def test_unignore_user(self, mock_user):
        mock_user_instance = Mock()
        ignored_user = Mock()
        def side_effect(forum_id):
            return mock_user_instance if forum_id == 1 else ignored_user
        mock_user.objects.get.side_effect = side_effect
        mock_ignored_users = MagicMock()
        mock_ignored_users.__contains__.return_value = True
        mock_user_instance.ignored_users = mock_ignored_users
        service = UserService()
        service.unignore_user(1, 2)
        mock_user.objects.get.assert_any_call(forum_id=1)
        mock_user.objects.get.assert_any_call(forum_id=2)
        mock_user_instance.ignored_users.remove.assert_called_once_with(ignored_user)
        mock_user_instance.save.assert_called_once()

    @patch("user_functions.User")
    def test_get_ignored_users(self, mock_user):
        mock_ignored_users = [Mock(forum_id=i) for i in range(5)]
        mock_user.objects.get.return_value.ignored_users = mock_ignored_users
        service = UserService()
        ignored_users = service.get_ignored_users(1)
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        self.assertEqual(ignored_users, list(range(5)))

    @patch("user_functions.Report")
    @patch("user_functions.Message")
    @patch("user_functions.User")
    def test_report_message(self, mock_user, mock_message, mock_report):
        mock_user.objects.get.return_value = Mock()
        mock_message.objects.get.return_value = Mock()
        mock_report.return_value = Mock()
        service = UserService()
        service.report_message(1, "message_id", "reason")
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        mock_message.objects.get.assert_called_once_with(id="message_id")
        mock_report.assert_called_once_with(user=mock_user.objects.get.return_value,
                                            message=mock_message.objects.get.return_value, reason="reason")
        mock_report.return_value.save.assert_called_once()

    @patch("user_functions.Report")
    @patch("user_functions.Comment")
    @patch("user_functions.User")
    def test_report_comment(self, mock_user, mock_comment, mock_report):
        mock_user.objects.get.return_value = Mock()
        mock_comment.objects.get.return_value = Mock()
        mock_report.return_value = Mock()
        service = UserService()
        service.report_comment(1, "comment_id", "reason")
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        mock_comment.objects.get.assert_called_once_with(id="comment_id")
        mock_report.assert_called_once_with(user=mock_user.objects.get.return_value,
                                            comment=mock_comment.objects.get.return_value, reason="reason")
        mock_report.return_value.save.assert_called_once()

    @patch("user_functions.User")
    def test_get_top_users(self, mock_user):
        mock_top_users = [Mock() for _ in range(5)]
        mock_user.objects.order_by.return_value = mock_top_users
        service = UserService()
        top_users = service.get_top_users()
        mock_user.objects.order_by.assert_called_once_with('-message', '-comment', '-likes')
        self.assertEqual(top_users, mock_top_users)

    @patch("user_functions.Message")
    def test_get_recent_messages(self, mock_message):
        mock_recent_messages = [Mock() for _ in range(5)]
        mock_message.objects.order_by.return_value = mock_recent_messages
        service = UserService()
        recent_messages = service.get_recent_messages()
        mock_message.objects.order_by.assert_called_once_with('-created_at')
        self.assertEqual(recent_messages, mock_recent_messages)

    @patch("user_functions.Notification")
    @patch("user_functions.User")
    def test_send_notification(self, mock_user, mock_notification):
        mock_user.objects.get.return_value = Mock()
        mock_notification.return_value = Mock()
        service = UserService()
        service.send_notification(1, "text")
        mock_user.objects.get.assert_called_once_with(forum_id=1)
        mock_notification.assert_called_once_with(user=mock_user.objects.get.return_value, text="text")
        mock_notification.return_value.save.assert_called_once()

    @patch("user_functions.Comment")
    @patch("user_functions.Message")
    def test_get_message_comments(self, mock_message, mock_comment):
        mock_comments = [Mock() for _ in range(5)]
        mock_comment.objects.return_value = mock_comments
        mock_message.objects.get.return_value = Mock()
        service = UserService()
        comments = service.get_message_comments("message_id")
        mock_message.objects.get.assert_called_once_with(id="message_id")
        mock_comment.objects.assert_called_once_with(message=mock_message.objects.get.return_value)
        self.assertEqual(comments, mock_comments)

    def test_check_required_fields(self):
        service = UserService()
        data = {"field1": "value1", "field2": "value2"}
        service.check_required_fields(data, ["field1", "field2"])
        with self.assertRaises(ValueError):
            service.check_required_fields(data, ["field1", "field2", "field3"])

    def test_check_message_length(self):
        service = UserService()
        message = "a" * 100
        service.check_message_length(message, 200)
        with self.assertRaises(ValueError):
            service.check_message_length(message, 50)

if __name__ == '__main__':
    unittest.main()
