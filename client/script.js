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
                    <button class="reply-button" onclick="displayReplyForm(this)"><i class="fas fa-pencil-alt"></i></button>
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
    let commentsSection = button.closest('.tweet').nextElementSibling;
    if (commentsSection && commentsSection.classList.contains('reply-form-container')) {
        commentsSection = commentsSection.nextElementSibling;
    }
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
};
const toggleSubcomments = button => {
    let subcommentsSection = button.closest('.comment').nextElementSibling;
    if (subcommentsSection && subcommentsSection.classList.contains('reply-form-container')) {
        subcommentsSection = subcommentsSection.nextElementSibling;
    }
    subcommentsSection.style.display = subcommentsSection.style.display === 'none' ? 'block' : 'none';
};
const toggleLike = button => button.classList.toggle('liked');
const confirmAndExecute = (message, action, button) => {
    if (confirm(message)) {
        action(button);
    }
}
const confirmDelete = button => confirmAndExecute('Вы уверены, что хотите удалить этот элемент?', deleteTweet, button);
const confirmBlacklist = button => confirmAndExecute('Вы уверены, что хотите добавить этого пользователя в черный список?', addToBlacklist, button);
const sendTweet = () => {
    const tweetInput = document.getElementById("tweetInput");
    const tweetContent = tweetInput.value;
    socket.emit('create message', {content: tweetContent});
    tweetInput.value = '';
    userSentTweet = true;  // Устанавливаем флаг в true при отправке твита
}
const editTweet = (button) => {
    const parentElement = button.closest(".tweet") || button.closest(".comment") || button.closest(".subcomment");
    const contentElement = parentElement.querySelector(".tweet-content");
    const currentContent = contentElement.textContent.trim();

    const editForm = `
        <div class="edit-form">
            <textarea class="edit-textarea">${currentContent}</textarea>
            <div class="edit-actions">
                <button onclick="saveEdit(this)">Сохранить</button>
                <button onclick="cancelEdit(this)">Отменить</button>
            </div>
        </div>
    `;

    // Сохраним оригинальное содержимое, чтобы можно было восстановить его при отмене
    contentElement.setAttribute('data-original-content', currentContent);

    contentElement.innerHTML = editForm;
};
const saveEdit = (button)  => {
    const parentElement = button.closest(".tweet-content");
    const textarea = parentElement.querySelector('.edit-textarea');
    const editedContent = textarea.value;
    parentElement.textContent = editedContent;
}
const cancelEdit = (button) => {
    const parentElement = button.closest(".tweet-content");
    const originalContent = parentElement.getAttribute('data-original-content');
    parentElement.textContent = originalContent;
}
const displayReplyForm = (button) => {
    const parentElement = button.closest(".tweet") || button.closest(".comment");
    const parentContainer = parentElement.parentNode;

    // Удалим все открытые формы для ответа на странице, кроме той, что привязана к текущей кнопке
    const allOpenReplyForms = document.querySelectorAll('.reply-form-container');
    allOpenReplyForms.forEach(form => {
        if (form !== parentElement.nextElementSibling) form.remove();
    });

    // Если форма ответа уже открыта для этого элемента, закройте ее
    if (parentElement.nextElementSibling && parentElement.nextElementSibling.classList.contains('reply-form-container')) {
        parentElement.nextElementSibling.remove();
        return;  // Выходим из функции, так как нам не нужно создавать новую форму
    }

    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form-container';
    replyForm.innerHTML = `
    <div class="reply-input-container">
        <textarea class="reply-textarea" placeholder="Напишите ваш комментарий..."></textarea>
        <div class="reply-actions">
            <span class="reply-counter">0/500</span>
            <button class="reply-button" onclick="addComment(this)">Отправить</button>
        </div>
    </div>
`;
    parentContainer.insertBefore(replyForm, parentElement.nextSibling);
};
const addComment = (button) => {
    const textarea = button.parentElement.querySelector('.reply-textarea');
    const commentContent = textarea.value;
    if (commentContent.trim() === '') {
        alert("Комментарий не может быть пустым!");
        return;
    }
    const commentData = {
        content: commentContent,
        username: "Ваше имя пользователя",  // замените на реальное имя пользователя
        avatar_url: "URL вашего аватара",  // замените на реальный URL аватара
        created_at: "только что"
    };
    const newCommentHTML = generateTweetHTML(commentData);
    const newCommentElement = document.createElement('div');
    newCommentElement.innerHTML = newCommentHTML;
    button.closest('.tweet-container').appendChild(newCommentElement);
    textarea.value = '';
};
// ================================
// EVENT INITIALIZATION
// ================================
document.addEventListener("DOMContentLoaded", function () {
    initTweetLoadingEvents();
    loadRecentMessages();
});