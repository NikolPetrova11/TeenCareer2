document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chatToggle');
    const chatApp = document.getElementById('chatApp');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = chatApp.querySelector('#chatInputArea button');

    // Показване/скриване на чат прозореца
    chatToggle.addEventListener('click', () => {
        chatApp.style.display = chatApp.style.display === 'flex' ? 'none' : 'flex';
        if (chatApp.style.display === 'flex') {
            chatInput.focus();
            chatMessages.scrollTop = chatMessages.scrollHeight; // Скрол до долу
        }
    });

 document.querySelector('.button').addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });

    // Функция за добавяне на съобщение към чата
    function addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        
        // Базови стилове за съобщенията (препоръчително е да ги преместите в searching1.css)
        if (sender === 'user') {
            messageElement.style.textAlign = 'right';
            messageElement.style.backgroundColor = '#e5d6eb'; // Светлосиньо за потребителя
            messageElement.style.color = '#8274A1';
            messageElement.style.borderRadius = '10px';
            messageElement.style.padding = '8px';
            messageElement.style.margin = '5px 0';
            messageElement.style.marginLeft = 'auto'; // Избутва съобщението на потребителя вдясно
            messageElement.style.maxWidth = '80%';
        } else {
            messageElement.style.textAlign = 'left';
            messageElement.style.backgroundColor = '#e5d6eb'; // Светлосиво за бота
            messageElement.style.color = '#8274A1';
            messageElement.style.borderRadius = '10px';
            messageElement.style.padding = '8px';
            messageElement.style.margin = '5px 0';
            messageElement.style.marginRight = 'auto'; // Избутва съобщението на бота вляво
            messageElement.style.maxWidth = '80%';
        }
        
        messageElement.innerHTML = `<strong>${sender === 'user' ? 'Вие' : 'TeenBot'}:</strong> ${text}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Скрол до долу
    }

    // Функция за изпращане на съобщение към бекенда
    window.sendMessage = async function() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        chatInput.value = ''; // Изчистваме полето веднага

        try {
            addMessage('bot', 'TeenBot пише...'); // Показваме индикатор за писане

            const response = await fetch('http://localhost:3000/chat', { // Уверете се, че URL-ът съвпада с вашия Node.js сървър
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            // Премахваме индикатора за писане преди да добавим реалния отговор
            chatMessages.removeChild(chatMessages.lastChild);
            addMessage('bot', data.reply || data.error); // Показваме отговора или грешката

        } catch (error) {
            console.error('Грешка при комуникация с бота:', error);
            chatMessages.removeChild(chatMessages.lastChild); // Премахваме индикатора за писане
            addMessage('bot', 'Грешка: Нещо се обърка при комуникацията с бота. Моля, опитайте отново.');
        }
    };

    // Изпращане на съобщение при натискане на Enter
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Функция за нов чат (извиква се при натискане на бутона "+ Нов чат")
    window.newChat = function() {
        chatMessages.innerHTML = ''; // Изчистваме всички съобщения
        addMessage('bot', 'Здравейте! Аз съм TeenBot. Кажете ми каква професия ви интересува и аз ще ви задам въпроси за интервю.');
    };

    // Първоначално съобщение при отваряне на чата
    newChat();
});

