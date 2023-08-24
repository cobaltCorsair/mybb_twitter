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
socket.on('new comment', data => {
    console.log("Received new comment event:", data);
    displayNewComment(data);
});
socket.on('new subcomment', data => {
    console.log("Received new subcomment event:", data);
    displayNewSubcomment(data);
});
socket.on('update message', data => {
    const tweetElement = document.querySelector(`.tweet[data-tweet-id="${data.message_id}"]`);
    if (tweetElement) {
        const contentElement = getContentElement(tweetElement);
        contentElement.textContent = data.new_content;
    }
});
socket.on('update comment', data => {
    const commentElement = document.querySelector(`.comment[data-comment-id="${data.comment_id}"]`);
    if (commentElement) {
        const contentElement = getContentElement(commentElement);
        contentElement.textContent = data.new_content;
    }
});
socket.on('update subcomment', data => {
    const subcommentElement = document.querySelector(`.subcomment[data-subcomment-id="${data.subcomment_id}"]`);
    if (subcommentElement) {
        const contentElement = getContentElement(subcommentElement);
        contentElement.textContent = data.new_content;
    }
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

    const commentIdAttribute = isSubcomment ? `data-subcomment-id="${commentData.subcomment_id}"` : `data-comment-id="${commentData.comment_id}"`;

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
    console.log("displayRecentMessages called with data:", data);

    const tweetsWrapper = document.getElementById('tweets-wrapper');

    const wasAtBottom = isWrapperAtBottom(tweetsWrapper);

    data.messages.forEach(message => {
        console.log("Processing message:", message);

        // Проверка на существование твита
        const existingTweet = document.querySelector(`.tweet-container[data-tweet-id="${message.message_id}"]`);
        console.log("Existing tweet:", existingTweet);

        if (!existingTweet) {
            const tweetHTML = generateTweetHTML(message);
            const newTweetElement = document.createElement('div');
            newTweetElement.innerHTML = tweetHTML;

            if (loadingOlderTweets) {
                tweetsWrapper.insertBefore(newTweetElement, tweetsWrapper.lastChild); // Старые сообщения вставляем в начало
            } else {
                tweetsWrapper.insertBefore(newTweetElement, tweetsWrapper.firstChild); // Новые сообщения вставляем в самом верху
            }
            addCommentsToTweet(message, newTweetElement);
        } else {
            addCommentsToTweet(message, existingTweet);
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
const addCommentsToTweet = (message, tweetContainerElement) => {
    console.log("addCommentsToTweet called with message:", message);
    message.comments.forEach(commentData => {
        const existingComment = tweetContainerElement.querySelector(`.comment[data-comment-id="${commentData.comment_id}"]`);
        if (!existingComment) {
            const newCommentHTML = generateCommentHTML(commentData);
            const newCommentElement = document.createElement('div');
            newCommentElement.innerHTML = newCommentHTML;

            let commentsContainer = tweetContainerElement.querySelector('.comments');

            if (!commentsContainer) {
                commentsContainer = document.createElement('div');
                commentsContainer.className = 'comments';
                const tweetElement = tweetContainerElement.querySelector('.tweet');
                tweetElement.insertAdjacentElement('afterend', commentsContainer);
            }

            commentsContainer.prepend(newCommentElement);
            console.log("Added comment to DOM:", newCommentElement);

            // Добавляем сабкомментарии для каждого комментария
            addSubcommentsToComment(commentData, newCommentElement);
            updateCommentCount(tweetContainerElement);
        }
    });
}
const addSubcommentsToComment = (commentData, parentComment) => {
    console.log("addSubcommentsToComment called with commentData:", commentData);
    commentData.subcomments.forEach(subcommentData => {
        const existingSubcomment = parentComment.querySelector(`.comment[data-subcomment-id="${subcommentData.subcomment_id}"]`);
        if (!existingSubcomment) {
            const newSubcommentHTML = generateCommentHTML(subcommentData, true);
            const newSubcommentElement = document.createElement('div');
            newSubcommentElement.innerHTML = newSubcommentHTML;

            let subcommentsContainer = parentComment.querySelector('.subcomments');
            if (!subcommentsContainer) {
                subcommentsContainer = document.createElement('div');
                subcommentsContainer.className = 'subcomments';
                parentComment.appendChild(subcommentsContainer);
            }
            subcommentsContainer.prepend(newSubcommentElement);
            console.log("Added subcomment to DOM:", newSubcommentElement);

            const replyButton = parentComment.querySelector('.reply-button');
            if (replyButton) {
                updateSubcommentCount(replyButton);
            }
        }
    });
}
const displayNewComment = (data) => {
    const newCommentHTML = generateCommentHTML(data);
    const newCommentElement = document.createElement('div');
    newCommentElement.innerHTML = newCommentHTML;

    const tweetElement = document.querySelector(`.tweet-container[data-tweet-id="${data.message_id}"]`);

    const commentsContainer = tweetElement.querySelector('.comments');

    if (commentsContainer) {
        commentsContainer.prepend(newCommentElement);
    } else {
        const newCommentsContainer = document.createElement('div');
        newCommentsContainer.className = 'comments';
        newCommentsContainer.appendChild(newCommentElement);
        tweetElement.appendChild(newCommentsContainer);
    }
    updateCommentCount(tweetElement);
};
const displayNewSubcomment = (data) => {
    const newSubcommentHTML = generateCommentHTML(data, true);
    const newSubcommentElement = document.createElement('div');
    newSubcommentElement.innerHTML = newSubcommentHTML;
    const parentComment = document.querySelector(`.comment[data-comment-id="${data.message_id}"]`);
    let subcommentsContainer = parentComment.nextElementSibling;

    if (!subcommentsContainer || !subcommentsContainer.classList.contains('subcomments')) {
        subcommentsContainer = document.createElement('div');
        subcommentsContainer.className = 'subcomments';
        parentComment.insertAdjacentElement('afterend', subcommentsContainer);
    }

    subcommentsContainer.prepend(newSubcommentElement);

    const replyButton = parentComment.querySelector('.reply-button');
    updateSubcommentCount(replyButton);
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
    const currentUserID = getCurrentUserId();

    // Определяем, что именно редактируется, чтобы отправить правильное событие
    if (parentContainer.classList.contains('tweet')) {
        const tweetContainer = parentContainer.closest('.tweet-container');
        socket.emit('update message', {
            message_id: tweetContainer.getAttribute('data-tweet-id'),
            user_id: currentUserID,
            new_content: editedContent
        });
    } else if (parentContainer.classList.contains('comment') && !parentContainer.hasAttribute('data-subcomment-id')) {
        socket.emit('update comment', {
            comment_id: parentContainer.getAttribute('data-comment-id'),
            user_id: currentUserID,
            new_content: editedContent
        });
    } else if (parentContainer.classList.contains('comment') && parentContainer.hasAttribute('data-subcomment-id')) {
        socket.emit('update subcomment', {
            subcomment_id: parentContainer.getAttribute('data-subcomment-id'),
            user_id: currentUserID,
            new_content: editedContent
        });
    }


    // Пока что просто обновляем содержимое на клиенте
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

    const userId = getCurrentUserId();
    const username = getCurrentUsername();
    const avatarUrl = getCurrentUserAvatarUrl();
    const messageId = getTweetIdFromElement(button);

    const commentData = {
        message_id: messageId,
        user_id: userId,
        username: username,
        avatar_url: avatarUrl,
        content: commentContent,
        created_at: "только что"
    };

    switch (type) {
        case 'tweet':
            socket.emit('create comment', commentData);
            break;
        case 'comment':
            const commentId = getCommentIdFromElement(button); // Получаем comment_id
            if (commentId) {
                commentData.message_id = commentId;
            } else {
                console.error("Cannot determine comment_id");
                return;
            }
            socket.emit('create subcomment', commentData);
            break;
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
const getCommentIdFromElement = (element) => {
    const replyForm = element.closest('.reply-form-container');
    if (replyForm) {
        const commentElement = replyForm.previousElementSibling;
        if (commentElement && commentElement.classList.contains('comment')) {
            return commentElement.getAttribute('data-comment-id');
        }
    }
    return null;
};
document.addEventListener("DOMContentLoaded", function () {
    initTweetLoadingEvents();
    loadRecentMessages();
});