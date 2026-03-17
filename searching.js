document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chatToggle');
    const chatApp = document.getElementById('chatApp');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = chatApp.querySelector('#chatInputArea button');

    chatToggle.addEventListener('click', () => {
        chatApp.style.display = chatApp.style.display === 'flex' ? 'none' : 'flex';
        if (chatApp.style.display === 'flex') {
            chatInput.focus();
            chatMessages.scrollTop = chatMessages.scrollHeight; 
        }
    });

    const cardsContainer = document.querySelector('.cards-container');
    const arrowRight = document.querySelector('.arrow1');
    const arrowLeft = document.querySelector('.arrow2');

    function rotateRight() {
        const first = cardsContainer.querySelector('.card');
        if (first) cardsContainer.appendChild(first);
    }

    function rotateLeft() {
        const cards = cardsContainer.querySelectorAll('.card');
        if (cards.length > 0) {
            const last = cards[cards.length - 1];
            cardsContainer.insertBefore(last, cards[0]);
        }
    }

    if (arrowRight) arrowRight.addEventListener('click', rotateRight);
    if (arrowLeft) arrowLeft.addEventListener('click', rotateLeft);

 document.querySelector('.button').addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });

    const chatHistoryEl = document.getElementById('chatHistory');
    let currentChatId = null;
    let chatHistoryList = [];
    let isLoggedIn = false;

    function addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        
        if (sender === 'user') {
            messageElement.style.textAlign = 'right';
            messageElement.style.backgroundColor = '#e5d6eb'; 
            messageElement.style.color = '#8274A1'; 
            messageElement.style.borderRadius = '10px';
            messageElement.style.padding = '8px';
            messageElement.style.margin = '5px 0';
            messageElement.style.marginLeft = 'auto';
            messageElement.style.maxWidth = '80%';
        } else {
            messageElement.style.textAlign = 'left';
             messageElement.style.backgroundColor = '#e5d6eb'; 
             messageElement.style.color = '#8274A1'; 
            messageElement.style.borderRadius = '10px';
            messageElement.style.padding = '8px';
            messageElement.style.margin = '5px 0';
            messageElement.style.marginRight = 'auto'; 
            messageElement.style.maxWidth = '80%';
        }
        
        messageElement.innerHTML = `<strong>${sender === 'user' ? 'Вие' : 'TeenBot'}:</strong> ${text}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; 
    }

    function renderChatHistory() {
        if (!chatHistoryEl) return;
        chatHistoryEl.innerHTML = '';
        if (!isLoggedIn) {
            const p = document.createElement('p');
            p.textContent = 'Влезте в профила, за да запазите и заредите история на чатовете.';
            p.style.color = '#fff';
            p.style.padding = '8px';
            chatHistoryEl.appendChild(p);
            return;
        }

        if (!chatHistoryList.length) {
            const p = document.createElement('p');
            p.textContent = 'Няма запазени чатове';
            p.style.color = '#fff';
            p.style.padding = '8px';
            chatHistoryEl.appendChild(p);
            return;
        }

        chatHistoryList.forEach(chat => {
            const btn = document.createElement('button');
            btn.textContent = chat.title || 'Нов чат';
            btn.style.display = 'block';
            btn.style.width = '100%';
            btn.style.marginBottom = '4px';
            btn.style.textAlign = 'left';
            btn.style.background = chat.id === currentChatId ? '#fff' : 'transparent';
            btn.style.color = '#593D6E';
            btn.style.border = '1px solid #ddd';
            btn.style.borderRadius = '6px';
            btn.style.padding = '6px';
            btn.addEventListener('click', () => loadConversation(chat.id));
            chatHistoryEl.appendChild(btn);
        });
    }

    async function loadChatHistoryFromServer() {
        try {
            const response = await fetch('/api/chat-history', { credentials: 'include' });
            if (response.status === 401) {
                isLoggedIn = false;
                chatHistoryList = [];
                currentChatId = null;
                renderChatHistory();
                return;
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                isLoggedIn = true;
                chatHistoryList = data;
                if (!currentChatId && chatHistoryList.length) {
                    currentChatId = chatHistoryList[0].id;
                }
                renderChatHistory();
                if (currentChatId) {
                    await loadConversation(currentChatId);
                    return;
                }
            }
        } catch (e) {
            console.error('Неуспешно зареждане на историята', e);
            isLoggedIn = false;
            chatHistoryList = [];
            currentChatId = null;
            renderChatHistory();
        }
    }

    async function loadConversation(chatId) {
        currentChatId = chatId;
        chatMessages.innerHTML = '';

        try {
            const response = await fetch(`/api/chat-history/${chatId}`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data.messages)) {
                    data.messages.forEach(msg => addMessage(msg.sender, msg.text));
                    chatHistoryList = chatHistoryList.map(chat => chat.id === chatId ? { ...chat, title: data.title || chat.title } : chat);
                    renderChatHistory();
                    return;
                }
            }
        } catch (error) {
            console.error('Неуспешно зареждане на чат', error);
        }
        addMessage('bot', 'Здравейте! Аз съм TeenBot. Кажете ми каква професия ви интересува и аз ще ви задам въпроси за интервю.');
    }

    async function createNewConversation() {
        if (!isLoggedIn) {
            currentChatId = null;
            chatMessages.innerHTML = '';
            addMessage('bot', 'Започнете чат. Историята ще се запази, след като се логнете в профила.');
            return;
        }

        try {
            const response = await fetch('/api/chat-history', {
                credentials: 'include',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Нов чат', messages: [{ sender: 'bot', text: 'Здравейте! Аз съм TeenBot. Кажете ми каква професия ви интересува и аз ще ви задам въпроси за интервю.' }] })
            });

            if (response.ok) {
                const { id, title } = await response.json();
                currentChatId = id;
                chatHistoryList.unshift({ id, title: title || 'Нов чат', lastMessage: 'Здравейте!...' });
                renderChatHistory();
                chatMessages.innerHTML = '';
                addMessage('bot', 'Здравейте! Аз съм TeenBot. Кажете ми каква професия ви интересува и аз ще ви задам въпроси за интервю.');
                return;
            }
            addMessage('bot', 'Не мога да създам нов чат сега.');
        } catch (error) {
            console.error('Неуспешно създаване на чат', error);
            addMessage('bot', 'Не мога да създам нов чат. Опитайте след като влезете.');
        }
    }

    async function saveMessageToCurrentChat(sender, text) {
        if (!isLoggedIn || !currentChatId) return;

        try {
            await fetch(`/api/chat-history/${currentChatId}`, {
                credentials: 'include',
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: { sender, text } })
            });
        } catch (err) {
            console.error('Неуспешно съхранение на съобщение', err);
        }
    }

    window.sendMessage = async function() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        await saveMessageToCurrentChat('user', message);
        chatInput.value = '';

        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('chat-message', 'bot');
        loadingMessage.innerHTML = `<strong>TeenBot:</strong> Мисля...`;
        chatMessages.appendChild(loadingMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch('/chat', { 
                credentials: 'include',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            if (chatMessages.contains(loadingMessage)) chatMessages.removeChild(loadingMessage);

            if (data.reply) {
                addMessage('bot', data.reply);
                await saveMessageToCurrentChat('bot', data.reply);
            } else {
                addMessage('bot', 'Грешка: ' + (data.error || 'Нещо се обърка.'));
            }
        } catch (error) {
            console.error('Грешка:', error);
            if (chatMessages.contains(loadingMessage)) chatMessages.removeChild(loadingMessage);
            addMessage('bot', 'Нямам връзка със сървъра. Провери дали Node.js работи.');
        }
    };

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    window.newChat = async function() {
        await createNewConversation();
    };

    loadChatHistoryFromServer();
});


// Existing menu logic
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu"); 

  menuToggle.addEventListener("click", () => {
    if (navMenu) {
        navMenu.classList.toggle("active");
    }
  });

  // Popup open/close logic
  const profileBtn = document.querySelector(".profile-btn");
  const overlay = document.querySelector(".overlay");
  const popup = document.querySelector(".popup");
  const closeBtn = document.querySelector(".popup .close-btn");

  profileBtn.addEventListener("click", async function() {
    try {
      const resp = await fetch('/api/user-data', { credentials: 'include' });
      if (resp.ok) {
        window.location.href = '/profile';
        return;
      }
    } catch (err) {
      console.error('Error checking login', err);
    }
    overlay.classList.add("active");
    popup.classList.add("active");
  });

  closeBtn.addEventListener("click", function() {
    overlay.classList.remove("active");
    popup.classList.remove("active");
  });

  overlay.addEventListener("click", function(e) {
    if (e.target.classList.contains("overlay")) {
        overlay.classList.remove("active");
        popup.classList.remove("active");
    }
  });


  //LOGIN/REGISTER
  const tabButtons = document.querySelectorAll(".tab-btn");
  const loginForm = document.querySelector(".login-form-container");
  const registerForm = document.querySelector(".register-form-container");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        tabButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        const targetForm = button.getAttribute("data-form");

        if (targetForm === "login") {
            loginForm.classList.add("active");
            registerForm.classList.remove("active");
        } else if (targetForm === "register") {
            loginForm.classList.remove("active");
            registerForm.classList.add("active");
        }
    });
  });