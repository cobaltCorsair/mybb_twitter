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
}

function toggleSubcomments(button) {
    const subcommentsSection = button.closest('.comment').nextElementSibling;
    subcommentsSection.style.display = subcommentsSection.style.display === 'none' ? 'block' : 'none';
}

function toggleLike(button) {
    button.classList.toggle('liked');
}
