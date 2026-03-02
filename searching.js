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

 document.querySelector('.button').addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });

    function addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        
        if (sender === 'user') {
            messageElement.style.textAlign = 'right';
            messageElement.style.backgroundColor = '#e0f7fa'; 
            messageElement.style.borderRadius = '10px';
            messageElement.style.padding = '8px';
            messageElement.style.margin = '5px 0';
            messageElement.style.marginLeft = 'auto';
            messageElement.style.maxWidth = '80%';
        } else {
            messageElement.style.textAlign = 'left';
            messageElement.style.backgroundColor = '#f0f0f0'; 
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

    window.sendMessage = async function() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        chatInput.value = '';

        try {
            addMessage('bot', 'TeenBot пише...'); 

            const response = await fetch('http://localhost:3000/chat', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            chatMessages.removeChild(chatMessages.lastChild);
            addMessage('bot', data.reply || data.error); 

        } catch (error) {
            console.error('Грешка при комуникация с бота:', error);
            chatMessages.removeChild(chatMessages.lastChild); 
            addMessage('bot', 'Грешка: Нещо се обърка при комуникацията с бота. Моля, опитайте отново.');
        }
    };

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    window.newChat = function() {
        chatMessages.innerHTML = ''; 
        addMessage('bot', 'Здравейте! Аз съм TeenBot. Кажете ми каква професия ви интересува и аз ще ви задам въпроси за интервю.');
    };
    newChat();
});

