// menu logic
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


  // LOGIN/REGISTER
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
  // CV Modal
document.getElementById('uploadCvBtn').addEventListener('click', function(e) {
    e.preventDefault();
    const modal = document.getElementById('cvModal');
    modal.style.display = 'flex';
});

function closeCvModal() {
    document.getElementById('cvModal').style.display = 'none';
    document.getElementById('cvResult').style.display = 'none';
    document.getElementById('cvError').style.display = 'none';
    document.getElementById('dropText').textContent = 'Плъзни файл тук или ';
    document.getElementById('cvFileInput').value = '';
    selectedFile = null;
}

let selectedFile = null;

function handleFileSelect(input) {
    if (input.files[0]) {
        selectedFile = input.files[0];
        document.getElementById('dropText').innerHTML = `✅ <strong>${selectedFile.name}</strong>`;
    }
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropZone').style.background = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        selectedFile = file;
        document.getElementById('dropText').innerHTML = `✅ <strong>${file.name}</strong>`;
    } else {
        document.getElementById('cvError').style.display = 'block';
        document.getElementById('cvError').textContent = 'Моля качете PDF файл.';
    }
}

async function uploadAndAnalyze() {
    if (!selectedFile) {
        document.getElementById('cvError').style.display = 'block';
        document.getElementById('cvError').textContent = 'Моля избери CV файл първо.';
        return;
    }

    const btn = document.getElementById('analyzeBtn');
    btn.textContent = '⏳ Анализира се...';
    btn.disabled = true;
    document.getElementById('cvError').style.display = 'none';
    document.getElementById('cvResult').style.display = 'none';

    const formData = new FormData();
    formData.append('cv', selectedFile);

    try {
        const response = await fetch('/api/analyze-cv', { method: 'POST', body: formData });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Грешка');

        document.getElementById('cvResultText').textContent = data.recommendation;
        document.getElementById('cvResult').style.display = 'block';
    } catch (err) {
        document.getElementById('cvError').style.display = 'block';
        document.getElementById('cvError').textContent = err.message;
    } finally {
        btn.textContent = 'Анализирай';
        btn.disabled = false;
    }
}
