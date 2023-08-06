function toggleNav() {
    var sidebar = document.getElementById("mySidebar");
    var button = document.querySelector(".openbtn");
    var userContainer = document.getElementById("userContainer");
    var blockedUsersButton = document.querySelector(".blocked-users");
    if (sidebar.style.width === "300px") {
        sidebar.style.width = "0";
        button.style.right = "-50px";
        userContainer.classList.add("closed");
        blockedUsersButton.style.display = "none";
    } else {
        sidebar.style.width = "300px";
        button.style.right = "250px";
        userContainer.classList.remove("closed");
        blockedUsersButton.style.display = "flex";
    }
}

function createTweet() {
    var tweetInput = document.getElementById("tweetInput");
    console.log('Tweet:', tweetInput.value);
    tweetInput.value = '';
    updateCounter();
}

function updateCounter() {
    var tweetInput = document.getElementById("tweetInput");
    var tweetCounter = document.getElementById("tweetCounter");
    if (tweetInput.value.length > 500) {
        tweetInput.value = tweetInput.value.substring(0, 500);
    }
    tweetCounter.textContent = tweetInput.value.length + "/500";
    if (tweetInput.value.length === 500) {
        tweetCounter.style.color = "red";
    } else {
        tweetCounter.style.color = "#888";
    }
}

function toggleUserInfo() {
    var userInfo = document.getElementById("userInfo");
    userInfo.classList.toggle("minimized");
}

function toggleNotifications() {
    var notificationPanel = document.getElementById("notificationPanel");
    notificationPanel.style.display = notificationPanel.style.display === "block" ? "none" : "block";
}

function clearNotifications() {
    var notificationPanel = document.getElementById("notificationPanel");
    notificationPanel.innerHTML = '<button class="clear-button" onclick="clearNotifications()">Clear All Notifications</button>'; // Очищает все уведомления
    document.getElementById("notificationCount").textContent = "0"; // Обнуляет счетчик уведомлений
}

function toggleBlockedUsers() {
    var blockedUsersPanel = document.getElementById("blockedUsersPanel");
    blockedUsersPanel.style.display = blockedUsersPanel.style.display === "block" ? "none" : "block";
}

function unblockUser(username) {
    // Здесь нужно добавить логику для разблокирования пользователя
    // Например, удалить элемент из DOM:
    var blockedUsersPanel = document.getElementById("blockedUsersPanel");
    var users = blockedUsersPanel.getElementsByClassName("blocked-user");
    for (var i = 0; i < users.length; i++) {
        if (users[i].textContent.includes(username)) {
            users[i].remove();
            break;
        }
    }
}

function toggleComments(button) {
    const commentsSection = button.closest('.tweet').nextElementSibling;
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
    drawLineBetweenComments();
}

function toggleSubcomments(button) {
    const subcommentsSection = button.closest('.comment').nextElementSibling;
    subcommentsSection.style.display = subcommentsSection.style.display === 'none' ? 'block' : 'none';
    drawLineBetweenComments();
}

function toggleLike(button) {
    button.classList.toggle('liked');
}

function confirmDelete(button) {
    if (confirm('Вы уверены, что хотите удалить этот элемент?')) {
        deleteTweet(button);
    }
}

function confirmBlacklist(button) {
    if (confirm('Вы уверены, что хотите добавить этого пользователя в черный список?')) {
        addToBlacklist(button);
    }
}

function drawLineBetweenComments() {
    const commentsBlock = document.querySelector(".comments");
    if (!commentsBlock) return;

    const comments = commentsBlock.querySelectorAll(".comment");
    if (comments.length === 0) return;

    const firstComment = comments[0];
    const lastComment = comments[comments.length - 1];

    const topPosition = firstComment.offsetTop;
    const bottomPosition = lastComment.offsetTop + (lastComment.offsetHeight / 2);

    const lineHeight = bottomPosition - topPosition;

    // Добавляем стиль для блока comments, создавая псевдоэлемент ::before с нужной высотой
    commentsBlock.style.setProperty("--line-height", `${lineHeight}px`);
}

// Вызываем функцию при загрузке страницы и при любых изменениях в блоке comments
document.addEventListener("DOMContentLoaded", drawLineBetweenComments);
document.querySelector(".comments").addEventListener("DOMSubtreeModified", drawLineBetweenComments);
