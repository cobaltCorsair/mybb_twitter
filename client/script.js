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
});
socket.on('create comment', data => {
    console.log("Received new comment event:", data);
    displayNewComment(data);
});
socket.on('create subcomment', data => {
    console.log("Received new subcomment event:", data);
    displayNewSubcomment(data);
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
        <div class="tweet-container" data-tweet-id="${message.message_id}">
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
const generateCommentHTML = (commentData, isSubcomment = false) => {
    // Если это сабкоммент, то не отображаем кнопку счетчика подкомментариев.
    const subcommentButtonHTML = isSubcomment ? '' : `
        <button class="subcomment-button" onclick="toggleSubcomments(this)">
            <i class="fas fa-reply"></i>
            <span class="subcomment-count">0</span>
        </button>
    `;

    const commentIdAttribute = isSubcomment ? `data-subcomment-id="${commentData.id}"` : `data-comment-id="${commentData.id}"`;

    return `
        <div class="comment" ${commentIdAttribute}>
            <div class="line-container">
                <span class="line-dot"></span>
            </div>
            <div class="comment-header">
                <img src="${commentData.avatar_url}" alt="User Avatar">
                <span class="comment-username">${commentData.username}</span>
            </div>
            <div class="comment-content">
                ${commentData.content}
            </div>
            <div class="comment-time-date">
                <span class="comment-time">${commentData.created_at}</span>
            </div>
            <div class="comment-actions">
                <button class="like-button" onclick="toggleLike(this)"><i class="far fa-heart"></i></button>
                <span class="like-count">0</span>
                <button class="reply-button" onclick="displayReplyForm(this)"><i class="fas fa-pencil-alt"></i></button>
                ${subcommentButtonHTML}
                <button class="edit-button" onclick="editTweet(this)"><i class="far fa-edit"></i></button>
                <button class="delete-button" onclick="confirmDelete(this)"><i class="far fa-trash-alt"></i></button>
                <button class="blacklist-button" onclick="confirmBlacklist(this)"><i class="fas fa-ban"></i></button>
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
        // Проверка на существование твита
        const existingTweet = document.querySelector(`.tweet-container[data-tweet-id="${message.message_id}"]`);

        if (existingTweet) {
            existingTweet.setAttribute('data-tweet-id', message.message_id); // Обновляем ID твита в DOM
        } else {
            const tweetHTML = generateTweetHTML(message);
            const newTweetElement = document.createElement('div');
            newTweetElement.innerHTML = tweetHTML;

            if (loadingOlderTweets) {
                tweetsWrapper.insertBefore(newTweetElement, tweetsWrapper.lastChild); // Старые сообщения вставляем в начало
            } else {
                tweetsWrapper.insertBefore(newTweetElement, tweetsWrapper.firstChild); // Новые сообщения вставляем в самом верху
            }
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
const displayNewComment = (data) => {
    // TODO:: Реализация подгрузки комментов
};
const displayNewSubcomment = (data) => {
    // TODO:: Реализация подгрузки сабкомментов
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
const toggleLike = (button) => {
    const parentElement = button.parentElement;
    const likeCounter = parentElement.querySelector(".like-count");
    if (!likeCounter) {
        console.error("Элемент счётчика лайков не найден!");
        return;
    }
    let currentLikes = parseInt(likeCounter.textContent, 10);

    if (button.classList.contains('liked')) {
        currentLikes--;
    } else {
        currentLikes++;
    }

    likeCounter.textContent = currentLikes;
    button.classList.toggle('liked');
};
const deleteElement = (button) => {
    const elementToDelete = button.closest(".tweet") || button.closest(".comment") || button.closest(".subcomment");

    if (!elementToDelete) {
        console.error("Не удалось найти элемент для удаления!");
        return;
    }

    if (elementToDelete.classList.contains('tweet')) {
        const parentContainer = elementToDelete.closest('.tweet-container');
        if (parentContainer) {
            parentContainer.remove();
        } else {
            elementToDelete.remove();
        }
    } else if (elementToDelete.classList.contains('comment')) {
        const subcommentsSection = elementToDelete.nextElementSibling;
        if (subcommentsSection && subcommentsSection.classList.contains('subcomments')) {
            subcommentsSection.remove();
        }
        elementToDelete.remove();

        // Update comment count for the tweet
        const parentTweet = elementToDelete.closest(".tweet");
        if (parentTweet) {
            updateCommentCount(parentTweet);
        }

    } else if (elementToDelete.classList.contains('subcomment')) {
        elementToDelete.remove();

        // Update subcomment count for the comment
        const parentComment = elementToDelete.closest(".comment");
        if (parentComment) {
            updateSubcommentCount(parentComment);
        }
    }
};
const confirmAndExecute = (message, action, button) => {
    if (confirm(message)) {
        action(button);
    }
}
const confirmDelete = button => confirmAndExecute('Вы уверены, что хотите удалить этот элемент?', deleteElement, button);
const confirmBlacklist = button => confirmAndExecute('Вы уверены, что хотите добавить этого пользователя в черный список?', addToBlacklist, button);
const sendTweet = () => {
    const tweetInput = document.getElementById("tweetInput");
    const tweetContent = tweetInput.value;

    // Предполагаем, что у нас есть функции или переменные, которые могут предоставить user_id, username и avatar_url
    const userId = getCurrentUserId();
    const username = getCurrentUsername();
    const avatarUrl = getCurrentUserAvatarUrl();

    socket.emit('create message', {
        user_id: userId,
        username: username,
        avatar_url: avatarUrl,
        content: tweetContent,
        created_at: "только что"  // Текущее время
    });

    tweetInput.value = '';
    userSentTweet = true;
}
const contentClassMapping = {
    'tweet': 'tweet-content',
    'comment': 'comment-content',
    'subcomment': 'subcomment-content'
};
const getContentElement = (parentElement) => {
    // Определение класса родительского элемента
    const parentClass = [...parentElement.classList].find(cls => contentClassMapping[cls]);
    // Возврат элемента содержимого на основе маппинга
    return parentElement.querySelector(`.${contentClassMapping[parentClass]}`);
};
const editTweet = (button) => {
    const parentElement = button.closest(".tweet") || button.closest(".comment") || button.closest(".subcomment");
    const contentElement = getContentElement(parentElement);
    // Проверяем, находится ли элемент уже в режиме редактирования
    if (contentElement.querySelector('.edit-form')) {
        return; // Если да, то просто выходим из функции
    }

    const currentContent = contentElement.innerHTML.trim(); // Используем innerHTML
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
const saveEdit = (button) => {
    const parentContainer = button.closest(".tweet") || button.closest(".comment") || button.closest(".subcomment");
    const contentElement = getContentElement(parentContainer);
    const textarea = contentElement.querySelector('.edit-textarea');
    const editedContent = textarea.value;
    contentElement.textContent = editedContent;
};
const cancelEdit = (button) => {
    const parentContainer = button.closest(".tweet") || button.closest(".comment") || button.closest(".subcomment");
    const contentElement = getContentElement(parentContainer);
    const originalContent = contentElement.getAttribute('data-original-content');
    contentElement.innerHTML = originalContent;
};
const displayReplyForm = (button) => {
    const isTweet = button.closest(".tweet");
    const isComment = button.closest(".comment");
    const parentElement = isTweet || isComment;
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

    if (isTweet) {
        replyForm.setAttribute('data-type', 'tweet');
    } else if (isComment) {
        replyForm.setAttribute('data-type', 'comment');
    }

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
    const replyForm = button.closest('.reply-form-container');
    const type = replyForm.getAttribute('data-type');

    const textarea = replyForm.querySelector('.reply-textarea');
    const commentContent = textarea.value;

    if (commentContent.trim() === '') {
        alert("Комментарий не может быть пустым!");
        return;
    }

    // Предполагаем, что у нас есть функции или переменные, которые могут предоставить user_id, username и avatar_url
    const userId = getCurrentUserId();
    const username = getCurrentUsername();
    const avatarUrl = getCurrentUserAvatarUrl();
    const messageId = getTweetIdFromElement(button); // Получаем ID связанного сообщения

    const commentData = {
        message_id: messageId,
        user_id: userId,
        username: username,
        avatar_url: avatarUrl,
        content: commentContent,
        created_at: "только что"  // Текущее время
    };

    let newCommentHTML;
    switch (type) {
        case 'tweet':
            newCommentHTML = generateCommentHTML(commentData);
            socket.emit('create comment', commentData);
            break;

        case 'comment':
            newCommentHTML = generateCommentHTML(commentData, true); // Указываем, что это сабкомментарий
            socket.emit('create subcomment', commentData);
            break;

        default:
            console.log('Unknown type');
    }

    const newCommentElement = document.createElement('div');
    newCommentElement.innerHTML = newCommentHTML;

    if (type === 'tweet') {
        const commentsContainer = button.closest('.tweet-container').querySelector('.comments');
        if (commentsContainer) {
            commentsContainer.prepend(newCommentElement);
        } else {
            const newCommentsContainer = document.createElement('div');
            newCommentsContainer.className = 'comments';
            newCommentsContainer.appendChild(newCommentElement);
            button.closest('.tweet-container').appendChild(newCommentsContainer);
        }
        updateCommentCount(button.closest('.tweet-container'));
    } else if (type === 'comment') {
        let parentComment = replyForm.previousElementSibling;
        let subcommentsContainer = parentComment.nextElementSibling;

        // Проверяем, является ли следующий элемент блоком 'reply-form-container' или 'subcomments'
        if (subcommentsContainer && subcommentsContainer.classList.contains('reply-form-container')) {
            subcommentsContainer = subcommentsContainer.nextElementSibling;
        }

        // Если блок 'subcomments' не найден, создаем его
        if (!subcommentsContainer || !subcommentsContainer.classList.contains('subcomments')) {
            subcommentsContainer = document.createElement('div');
            subcommentsContainer.className = 'subcomments';
            parentComment.insertAdjacentElement('afterend', subcommentsContainer);
        }

        // Добавляем новый комментарий в блок 'subcomments'
        subcommentsContainer.prepend(newCommentElement);

        // Находим кнопку replyButton внутри parentComment
        const replyButton = parentComment.querySelector('.reply-button');

        // Обновляем счетчик сабкомментариев
        updateSubcommentCount(replyButton);
    }

    textarea.value = '';
    replyForm.remove();
};
const updateCommentCount = (tweetContainer) => {
    const commentCountElem = tweetContainer.querySelector('.comment-count');
    if (!commentCountElem) return;

    const commentsContainer = tweetContainer.querySelector('.comments');
    const commentCount = commentsContainer ? commentsContainer.children.length : 0;

    commentCountElem.textContent = commentCount;
};
const updateSubcommentCount = (replyButton) => {
    // Находим ближайший родительский комментарий
    const parentComment = replyButton.closest('.comment');
    if (!parentComment) return;

    // Находим элемент счётчика сабкомментов
    const subcommentCountElem = parentComment.querySelector('.subcomment-count');
    if (!subcommentCountElem) return;

    // Находим контейнер с сабкомментариями
    let subcommentsContainer = parentComment.nextElementSibling;
    if (subcommentsContainer && subcommentsContainer.classList.contains('reply-form-container')) {
        subcommentsContainer = subcommentsContainer.nextElementSibling;
    }

    // Если контейнер с сабкомментариями существует, то обновляем счётчик
    if (subcommentsContainer && subcommentsContainer.classList.contains('subcomments')) {
        const subcommentCount = subcommentsContainer.children.length;
        subcommentCountElem.textContent = subcommentCount;
    } else {
        // Если нет сабкомментариев, устанавливаем счётчик в 0
        subcommentCountElem.textContent = 0;
    }
};
// Функция-заглушка для получения ID текущего пользователя
const getCurrentUserId = () => 1;  // Заглушка: возвращает фиксированный ID. Замените на реальный ID.
// Функция-заглушка для получения имени текущего пользователя
const getCurrentUsername = () => "JohnDoe";  // Заглушка: возвращает фиксированное имя. Замените на реальное имя.
// Функция-заглушка для получения URL аватара текущего пользователя
const getCurrentUserAvatarUrl = () => "https://via.placeholder.com/50";  // Заглушка: возвращает фиксированный URL аватара. Замените на реальный URL.
// ================================
// EVENT INITIALIZATION
// ================================
// Функция для получения ID текущего твита
const getTweetIdFromElement = (element) => {
    const tweetContainer = element.closest('.tweet-container');
    return tweetContainer ? tweetContainer.getAttribute('data-tweet-id') : null;
};
document.addEventListener("DOMContentLoaded", function () {
    initTweetLoadingEvents();
    loadRecentMessages();
});