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

    function addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        
        if (sender === 'user') {
            messageElement.style.textAlign = 'right';
            messageElement.style.backgroundColor = '#e5d6eb'; // Светлосиньо за потребителя
            messageElement.style.color = '#8274A1'; 
            messageElement.style.borderRadius = '10px';
            messageElement.style.padding = '8px';
            messageElement.style.margin = '5px 0';
            messageElement.style.marginLeft = 'auto';
            messageElement.style.maxWidth = '80%';
        } else {
            messageElement.style.textAlign = 'left';
             messageElement.style.backgroundColor = '#e5d6eb'; // Светлосиньо за потребителя
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

    window.sendMessage = async function() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage('user', message);
    chatInput.value = '';

    // Създаваме "loading" съобщение
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('chat-message', 'bot');
    loadingMessage.innerHTML = `<strong>TeenBot:</strong> Мисля...`;
    chatMessages.appendChild(loadingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('/chat', { // Използвай относителен път
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        // Премахваме точно това "loading" съобщение
        chatMessages.removeChild(loadingMessage);

        if (data.reply) {
            addMessage('bot', data.reply);
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

    window.newChat = function() {
        chatMessages.innerHTML = ''; 
        addMessage('bot', 'Здравейте! Аз съм TeenBot. Кажете ми каква професия ви интересува и аз ще ви задам въпроси за интервю.');
    };
    newChat();
});
document.addEventListener("DOMContentLoaded", () => {

  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
  });

});

