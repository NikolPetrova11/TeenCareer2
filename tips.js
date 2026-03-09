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

  profileBtn.addEventListener("click", function() {
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