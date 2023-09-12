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
    displayRecentMessages({messages: [data], hasMoreMessages: true});
});
socket.on('new comment', data => {
    displayNewComment(data);
});
socket.on('new subcomment', data => {
    displayNewSubcomment(data);
});
socket.on('update message', data => {
    // Находим контейнер твита
    const tweetContainer = document.querySelector(`.tweet-container[data-tweet-id="${data.message_id}"]`);

    // Если контейнер найден, ищем внутри него элемент с содержимым
    if (tweetContainer) {
        const contentElement = tweetContainer.querySelector('.tweet-content');
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
socket.on('delete message', data => {
    const tweetElement = document.querySelector(`.tweet-container[data-tweet-id="${data.message_id}"]`);
    if (tweetElement) {
        tweetElement.remove();
    }
});
socket.on('delete comment', data => {
    const commentElement = document.querySelector(`.comment[data-comment-id="${data.comment_id}"]`);
    if (commentElement) {
        const tweetContainer = commentElement.closest('.tweet-container');
        commentElement.parentNode.remove();
        if (tweetContainer) {
            updateCommentCount(tweetContainer);
        }
    }
});
socket.on('delete subcomment', data => {
    const subcommentElement = document.querySelector(`.subcomment[data-subcomment-id="${data.subcomment_id}"]`);
    if (subcommentElement) {
        const parentComment = subcommentElement.closest('.comment');
        subcommentElement.parentNode.remove();
        if (parentComment) {
            updateSubcommentCount(parentComment.querySelector('.reply-button'));
        }
    }
});
socket.on('message likes', (data) => {
    let tweetElement = document.querySelector(`.tweet-container[data-tweet-id="${data.message_id}"]`);
    let commentElement = document.querySelector(`.comment[data-comment-id="${data.message_id}"]`);
    let subcommentElement = document.querySelector(`.subcomment[data-subcomment-id="${data.message_id}"]`);

    let targetElement = tweetElement || commentElement || subcommentElement;

    if (targetElement) {
        const likeCounter = targetElement.querySelector(".like-count");
        const likeButton = targetElement.querySelector(".like-button");
        if (likeCounter) {
            likeCounter.textContent = data.likes.total;
        }
        if (data.likes.user_liked) {
            likeButton.classList.add('liked');
        } else {
            likeButton.classList.remove('liked');
        }
    }
});
socket.on('update ignored users', data => {
    updateIgnoredUsers(data);
});
// Когда страница загружается
window.onload = function () {
    socket.emit('get ignored users', {user_id: getCurrentUserId()});
}
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
                    <button class="blacklist-button" data-user-id="${message.user_id}" onclick="confirmBlacklist(this)"><i class="fas fa-ban"></i></button>
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
    const commentClassName = isSubcomment ? 'subcomment' : 'comment';
    const commentHeaderClassName = isSubcomment ? 'subcomment-header' : 'comment-header';
    const commentContentClassName = isSubcomment ? 'subcomment-content' : 'comment-content';
    const commentTimeDateClassName = isSubcomment ? 'subcomment-time-date' : 'comment-time-date';
    const commentActionsClassName = isSubcomment ? 'subcomment-actions' : 'comment-actions';

    return `
        <div class="${commentClassName}" ${commentIdAttribute}>
            <div class="line-container">
                <span class="line-dot"></span>
            </div>
            <div class="${commentHeaderClassName}">
                <img src="${commentData.avatar_url}" alt="User Avatar">
                <span class="comment-username">${commentData.username}</span>
            </div>
            <div class="${commentContentClassName}">
                ${commentData.content}
            </div>
            <div class="${commentTimeDateClassName}">
                <span class="comment-time">${commentData.created_at}</span>
            </div>
            <div class="${commentActionsClassName}">
                <button class="like-button" onclick="toggleLike(this)"><i class="far fa-heart"></i></button>
                <span class="like-count">0</span>
                <button class="reply-button" onclick="displayReplyForm(this)"><i class="fas fa-pencil-alt"></i></button>
                ${subcommentButtonHTML}
                <button class="edit-button" onclick="editTweet(this)"><i class="far fa-edit"></i></button>
                <button class="delete-button" onclick="confirmDelete(this)"><i class="far fa-trash-alt"></i></button>
                <button class="blacklist-button" data-user-id="${commentData.user_id}" onclick="confirmBlacklist(this)"><i class="fas fa-ban"></i></button>
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
        requestLikesForMessage(message, "tweet");
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

            // Добавляем сабкомментарии для каждого комментария
            addSubcommentsToComment(commentData, newCommentElement);
            updateCommentCount(tweetContainerElement);
        }
        requestLikesForMessage(commentData, "comment");
    });
}
const addSubcommentsToComment = (commentData, parentComment) => {
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

            const replyButton = parentComment.querySelector('.reply-button');
            if (replyButton) {
                updateSubcommentCount(replyButton);
            }
        }
        requestLikesForMessage(subcommentData, "subcomment");
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
const requestLikesForMessage = (data, messageType) => {
    data.user_id = getCurrentUserId();
    data.message_type = messageType;
    data.message_id = data.message_id || data.comment_id || data.subcomment_id;
    socket.emit('get message likes', data.user_id, data.message_id, messageType);
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
const toggleComments = button => {
    let commentsSection = button.closest('.tweet').nextElementSibling;
    if (commentsSection && commentsSection.classList.contains('reply-form-container')) {
        commentsSection = commentsSection.nextElementSibling;
    }
    if (commentsSection) {
        commentsSection.style.display = (commentsSection.style.display === 'none' || !commentsSection.style.display) ? 'block' : 'none';
    }
};
const toggleSubcomments = button => {
    let subcommentsSection = button.closest('.comment').nextElementSibling;
    if (subcommentsSection && subcommentsSection.classList.contains('reply-form-container')) {
        subcommentsSection = subcommentsSection.nextElementSibling;
    }
    if (subcommentsSection) {
        subcommentsSection.style.display = (subcommentsSection.style.display === 'none' || !subcommentsSection.style.display) ? 'block' : 'none';
    }
};
const toggleLike = (button) => {
    const parentElement = button.closest(".comment") || button.closest(".subcomment") || button.closest(".tweet-container");

    if (!parentElement) {
        console.error("Не удалось определить родительский элемент!");
        return;
    }

    let messageId;
    let messageType;
    if (parentElement.classList.contains('tweet-container')) {
        messageId = parentElement.getAttribute('data-tweet-id');
        messageType = 'tweet';
    } else if (parentElement.classList.contains('comment')) {
        messageId = parentElement.getAttribute('data-comment-id');
        messageType = 'comment';
    } else if (parentElement.classList.contains('subcomment')) {
        messageId = parentElement.getAttribute('data-subcomment-id');
        messageType = 'subcomment';
    }

    const userId = getCurrentUserId();
    const likeCounter = parentElement.querySelector(".like-count");

    if (!likeCounter) {
        return;
    }

    if (button.classList.contains('liked')) {
        socket.emit('remove like message', userId, messageId, messageType);
    } else {
        socket.emit('like message', userId, messageId, messageType);
    }
};
const deleteElement = (button) => {
    const elementToDelete = button.closest(".tweet") || button.closest(".comment") || button.closest(".subcomment");

    if (!elementToDelete) {
        console.error("Не удалось найти элемент для удаления!");
        return;
    }
    const currentUserID = getCurrentUserId();

    if (elementToDelete.classList.contains('tweet')) {
        const parentContainer = elementToDelete.closest('.tweet-container');
        if (parentContainer) {
            const messageId = parentContainer.getAttribute('data-tweet-id');
            socket.emit('delete message', {
                message_id: messageId,
                user_id: currentUserID
            });
            elementToDelete.remove();
        }
    } else if (elementToDelete.classList.contains('comment')) {
        const tweetContainer = elementToDelete.closest('.tweet-container');
        const commentId = elementToDelete.getAttribute('data-comment-id');

        socket.emit('delete comment', {
            comment_id: commentId,
            user_id: currentUserID
        });

        elementToDelete.parentNode.remove();

        if (tweetContainer) {
            updateCommentCount(tweetContainer);
        }
    } else if (elementToDelete.classList.contains('subcomment')) {
        const subcommentsContainer = elementToDelete.closest('.subcomments');
        const parentComment = subcommentsContainer ? subcommentsContainer.previousElementSibling : null;
        const subcommentId = elementToDelete.getAttribute('data-subcomment-id');

        socket.emit('delete subcomment', {
            subcomment_id: subcommentId,
            user_id: currentUserID
        });

        elementToDelete.parentNode.remove();

        if (parentComment) {
            updateSubcommentCount(parentComment.querySelector('.reply-button'));
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
    } else if (parentContainer.classList.contains('subcomment') && parentContainer.hasAttribute('data-subcomment-id')) {
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
const addToBlacklist = (button) => {
    const userId = button.dataset.userId;
    const data = {
        user_id: getCurrentUserId(),
        ignored_user_id: userId
    };
    socket.emit('ignore user', data);
}
const unblockUser = (userId) => {
    const data = {
        user_id: getCurrentUserId(),
        ignored_user_id: parseInt(userId, 10)  // Преобразуем userId из строки в число
    };
    socket.emit('unignore user', data);

    // Удаление пользователя из списка на клиенте
    const blockedUsersPanel = document.getElementById("blockedUsersPanel");
    const users = [...blockedUsersPanel.getElementsByClassName("blocked-user")];

    const userToUnblock = users.find(user => user.dataset.userId === userId);  // Сравниваем как строки
    if (userToUnblock) userToUnblock.remove();

    // Проверка, пуст ли список после удаления
    if (blockedUsersPanel.children.length === 0) {
        blockedUsersPanel.innerHTML = '<div class="empty-list-message">Список игнорирования пуст.</div>';
    }
}
const updateIgnoredUsers = (ignoredUsers) => {
    const blockedUsersPanel = document.getElementById('blockedUsersPanel');
    blockedUsersPanel.innerHTML = '';

    ignoredUsers.forEach((user) => {
        console.log(user);
        const blockedUser = document.createElement('div');
        blockedUser.classList.add('blocked-user');
        blockedUser.dataset.userId = user.id;

        const userAvatar = document.createElement('img');
        userAvatar.src = user.avatar_url; // Теперь используем URL аватара пользователя из данных сервера
        userAvatar.alt = 'User Avatar';

        const userName = document.createElement('span');
        userName.classList.add('nickname');
        userName.innerText = user.username; // Теперь используем никнейм пользователя из данных сервера

        const unblockUserButton = document.createElement('span');
        unblockUserButton.classList.add('unblock-user');
        unblockUserButton.innerText = '×';
        unblockUserButton.dataset.userId = user.id;
        unblockUserButton.onclick = function () {
            unblockUser(this.dataset.userId);
        };

        blockedUser.appendChild(userAvatar);
        blockedUser.appendChild(userName);
        blockedUser.appendChild(unblockUserButton);

        blockedUsersPanel.appendChild(blockedUser);
    });

    if (ignoredUsers.length === 0) {
        blockedUsersPanel.innerHTML = '<div class="empty-list-message">Список игнорирования пуст.</div>';
    }
}
// TODO: Нужно реализовать скрытие и открытие проигнорированных сообщений, как старых (уже загруженных),
//  так и новых, часть функций для этого уже реализована
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