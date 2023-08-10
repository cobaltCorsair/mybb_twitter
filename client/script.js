// ================================
// CONSTANTS AND GLOBAL VARIABLES
// ================================
const socket = io.connect('http://localhost:5000');
// ================================
// SOCKET CONNECTION HANDLERS
// ================================
socket.on('connect', () => {
    console.log('Connected to the server');
    socket.emit('join', {room: 'room'});
});
socket.on('new tweet', data => {
    console.log("Received new tweet event:", data);
    displayRecentMessages({messages: [data], hasMoreMessages: true});
    removeExtraTweets();
});
// ================================
// TWEET LOADING FUNCTIONS
// ================================
let offset = 0;
const limit = 10;
let loadingOlderTweets = false;
const MAX_TWEETS_ON_PAGE = 15;
let userSentTweet = false;
const isWrapperAtBottom = (wrapper) => {
    return wrapper.scrollTop + wrapper.clientHeight === wrapper.scrollHeight;
};
const generateTweetHTML = (message) => {
    return `
        <div class="tweet-container">
            <div class="tweet">
                <div class="tweet-header">
                    <img src="${message.avatar_url}" alt="User Avatar">
                    <span class="tweet-username">${message.username}</span>
                </div>
                <div class="tweet-content">${message.content}</div>
                <div class="tweet-time-date">
                    <span class="tweet-time">${message.created_at}</span>
                </div>
                <div class="tweet-actions">
                    <button class="like-button" onclick="toggleLike(this)"><i class="far fa-heart"></i></button>
                    <span class="like-count">0</span>
                    <button class="comment-button" onclick="toggleComments(this)"><i class="far fa-comment"></i></button>
                    <span class="comment-count">0</span>
                    <button class="edit-button" onclick="editTweet(this)"><i class="far fa-edit"></i></button>
                    <button class="delete-button" onclick="confirmDelete(this)"><i class="far fa-trash-alt"></i></button>
                    <button class="blacklist-button" onclick="confirmBlacklist(this)"><i class="fas fa-ban"></i></button>
                </div>
            </div>
        </div>
    `;
};

const removeExcessTweets = () => {
    const tweetsWrapper = document.getElementById('tweets-wrapper');
    const tweets = tweetsWrapper.getElementsByClassName('tweet-container');
    while (tweets.length > MAX_TWEETS_ON_PAGE) {
        tweets[tweets.length - 1].remove(); // удаляем последний элемент
    }
};
const loadRecentMessages = () => {
    loadingOlderTweets = true;
    socket.emit('get recent messages', {offset: offset});
    offset += limit;
};
const displayRecentMessages = (data) => {
    const tweetsWrapper = document.getElementById('tweets-wrapper');

    const wasAtBottom = isWrapperAtBottom(tweetsWrapper);

    data.messages.forEach(message => {
        const tweetHTML = generateTweetHTML(message);
        const newTweetElement = document.createElement('div');
        newTweetElement.innerHTML = tweetHTML;

        if (loadingOlderTweets) {
            tweetsWrapper.insertBefore(newTweetElement, tweetsWrapper.lastChild); // Старые сообщения вставляем в начало
        } else {
            tweetsWrapper.insertBefore(newTweetElement, tweetsWrapper.firstChild); // Новые сообщения вставляем в самом верху
        }
    });

    if (!loadingOlderTweets) {
        removeExcessTweets();
        if (userSentTweet) { // Если это новое сообщение от текущего пользователя
            tweetsWrapper.scrollTop = 0; // Прокрутка в самый верх
            userSentTweet = false;
        }
    } else if (wasAtBottom) {
        tweetsWrapper.scrollTop = tweetsWrapper.scrollHeight;
    }

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!data.hasMoreMessages) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = '';
    }

    loadingOlderTweets = false;
};
const initTweetLoadingEvents = () => {
    socket.on('recent messages', displayRecentMessages);
    document.getElementById('load-more-btn').addEventListener('click', loadRecentMessages);
};
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
    socket.emit('create message', {content: tweetContent});
    tweetInput.value = '';
    userSentTweet = true;  // Устанавливаем флаг в true при отправке твита
}
const editTweet = (button) => {
    // ! TODO: Функция редактирования твита.
};
// ================================
// EVENT INITIALIZATION
// ================================
document.addEventListener("DOMContentLoaded", function () {
    drawLineBetweenComments();
    initTweetLoadingEvents();
    loadRecentMessages();

    document.querySelector(".comments").addEventListener("DOMSubtreeModified", drawLineBetweenComments);
});