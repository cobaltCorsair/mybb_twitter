// ================================
// CONSTANTS AND GLOBAL VARIABLES
// ================================
const socket = io.connect('http://localhost:5000');

// ================================
// SOCKET CONNECTION HANDLERS
// ================================
socket.on('connect', () => {
    console.log('Connected to the server');
    socket.emit('join', { room: 'room' });
});
socket.on('new tweet', data => {
    console.log("Received new tweet event:", data);
    const tweetsWrapper = document.getElementById('tweets-wrapper');
    const newTweetElement = document.createElement('div');
    newTweetElement.className = 'tweet-container';
    newTweetElement.innerHTML = `
        <div class="tweet">
            <div class="tweet-header">
                <img src="${data.avatar_url}" alt="User Avatar">
                <span class="tweet-username">${data.username}</span>
            </div>
            <div class="tweet-content">${data.content}</div>
            <div class="tweet-time-date">
                <span class="tweet-time">Текущее время</span> · <span class="tweet-date">Текущая дата</span>
            </div>
            <div class="tweet-actions"></div>
        </div>
        <div class="comments"></div>
    `;
    tweetsWrapper.insertBefore(newTweetElement, tweetsWrapper.firstChild);
});

// ================================
// UI FUNCTIONS
// ================================
const toggleNav = () => {
    const sidebar = document.getElementById("mySidebar");
    const button = document.querySelector(".openbtn");
    const userContainer = document.getElementById("userContainer");
    const blockedUsersButton = document.querySelector(".blocked-users");

    const isSidebarOpen = sidebar.style.width === "300px";
    sidebar.style.width = isSidebarOpen ? "0" : "300px";
    button.style.right = isSidebarOpen ? "-50px" : "250px";
    userContainer.classList[isSidebarOpen ? 'add' : 'remove']("closed");
    blockedUsersButton.style.display = isSidebarOpen ? "none" : "flex";
}
const updateCounter = () => {
    const tweetInput = document.getElementById("tweetInput");
    const tweetCounter = document.getElementById("tweetCounter");
    const tweetLength = tweetInput.value.length;

    if (tweetLength > 500) {
        tweetInput.value = tweetInput.value.substring(0, 500);
    }

    tweetCounter.textContent = `${tweetLength}/500`;
    tweetCounter.style.color = tweetLength === 500 ? "red" : "#888";
}
const toggleUserInfo = () => {
    const userInfo = document.getElementById("userInfo");
    userInfo.classList.toggle("minimized");
}
const toggleElementVisibility = elementId => {
    const element = document.getElementById(elementId);
    element.style.display = element.style.display === "block" ? "none" : "block";
}
const toggleNotifications = () => toggleElementVisibility("notificationPanel");
const toggleBlockedUsers = () => toggleElementVisibility("blockedUsersPanel");
const clearNotifications = () => {
    const notificationPanel = document.getElementById("notificationPanel");
    notificationPanel.innerHTML = '<button class="clear-button" onclick="clearNotifications()">Clear All Notifications</button>';
    document.getElementById("notificationCount").textContent = "0";
}
const unblockUser = username => {
    const blockedUsersPanel = document.getElementById("blockedUsersPanel");
    const users = [...blockedUsersPanel.getElementsByClassName("blocked-user")];

    const userToUnblock = users.find(user => user.textContent.includes(username));
    if (userToUnblock) userToUnblock.remove();
}
const toggleComments = button => {
    const commentsSection = button.closest('.tweet').nextElementSibling;
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
    drawLineBetweenComments();
}
const toggleSubcomments = button => {
    const subcommentsSection = button.closest('.comment').nextElementSibling;
    subcommentsSection.style.display = subcommentsSection.style.display === 'none' ? 'block' : 'none';
    drawLineBetweenComments();
}
const toggleLike = button => button.classList.toggle('liked');
const confirmAndExecute = (message, action, button) => {
    if (confirm(message)) {
        action(button);
    }
}
const confirmDelete = button => confirmAndExecute('Вы уверены, что хотите удалить этот элемент?', deleteTweet, button);
const confirmBlacklist = button => confirmAndExecute('Вы уверены, что хотите добавить этого пользователя в черный список?', addToBlacklist, button);
const drawLineBetweenComments = () => {
    const commentsBlock = document.querySelector(".comments");
    if (!commentsBlock) return;

    const comments = [...commentsBlock.querySelectorAll(".comment")];
    if (comments.length === 0) return;

    const [firstComment, lastComment] = [comments[0], comments[comments.length - 1]];

    const topPosition = firstComment.offsetTop;
    const bottomPosition = lastComment.offsetTop + (lastComment.offsetHeight / 2);

    const lineHeight = bottomPosition - topPosition;
    commentsBlock.style.setProperty("--line-height", `${lineHeight}px`);
}
const sendTweet = () => {
    const tweetInput = document.getElementById("tweetInput");
    const tweetContent = tweetInput.value;
    socket.emit('create message', { content: tweetContent });
    tweetInput.value = '';
}
document.addEventListener("DOMContentLoaded", drawLineBetweenComments);
document.querySelector(".comments").addEventListener("DOMSubtreeModified", drawLineBetweenComments);