<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TeenCareer</title>

    <link rel="stylesheet" type="text/css" href="style1.css" />
    <link rel="stylesheet" type="text/css" href="login.css" />
    <link href="https://fonts.googleapis.com/css2?family=Comforter+Brush&family=Montserrat:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
        display: none;
      }
      
      .overlay.active {
        display: block;
      }
    </style>

</head>
<body>
 
 <header>
  <div class="header-container">
    <a href="index.php">
      <img src="logo.png" class="logo" alt="TeenCareer">
    </a>

    <nav class="nav-links" id="navMenu">
      <ul>
        <li><a href="index.php">Да започнем</a></li>
        <li><a href="searching.html">Хайде на работа!</a></li>
        <li><a href="CV_Portfolio_Maker.html">Твоят стартов комплект</a></li>
        <li><a href="tips.html">Съвети със стил</a></li>
      </ul>
    </nav>

    <div class="right-buttons">
      <button class="menu-toggle" id="menuToggle">☰</button>
      <button class="profile-btn">
        <img src="viber_image_2025-07-15_17-38-46-235.png" alt="Profile" class="profile">
      </button>
    </div>
  </div>
 
<div class="overlay"></div>
 
<div class="popup">
    <div class="close-btn">&times;</div>
    
    <div class="tab-header">
        <button class="tab-btn active" data-form="login">Вход</button>
        <button class="tab-btn" data-form="register">Регистрация</button>
    </div>

    <div class="form-container">

        <div class="form login-form-container active">
            <form action="login.php" method="POST">
                
                <div class="form-element">
                    <label for="login-email">Email</label>
                    <input type="email" name="email" id="login-email" placeholder="Въведи имейл" required>
                </div> 
 
                <div class="form-element">
                    <label for="login-password">Парола</label>
                    <input type="password" name="password" id="login-password" placeholder="Въведи парола" required>
                </div>
 
                <div class="form-element">
                    <button type="submit">Вход</button>
                </div>
            </form>
        </div>
        <div class="form register-form-container">
            <form action="register.php" method="POST">
                
                <div class="form-element">
                    <label for="register-email">Email</label>
                    <input type="email" name="email" id="register-email" placeholder="Въведи имейл" required>
                </div> 
 
                <div class="form-element">
                    <label for="register-password">Парола</label>
                    <input type="password" name="password" id="register-password" placeholder="Въведи парола" required>
                </div>
 
                <div class="form-element">
                    <button type="submit">Регистрирай се</button>
                </div>
            </form>
        </div>
        </div> 
</div>
<script>
  // Съществуваща логика за менюто
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu"); // Уверете се, че имате елемент с ID="navMenu"

  menuToggle.addEventListener("click", () => {
    // Уверете се, че navMenu съществува, преди да добавяте клас
    if (navMenu) {
        navMenu.classList.toggle("active");
    }
  });

  // Логика за отваряне и затваряне на Popup
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


  // НОВА ЛОГИКА ЗА ТАБОВЕТЕ (ВХОД/РЕГИСТРАЦИЯ)
  const tabButtons = document.querySelectorAll(".tab-btn");
  const loginForm = document.querySelector(".login-form-container");
  const registerForm = document.querySelector(".register-form-container");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        // Премахва "active" от всички бутони
        tabButtons.forEach(btn => btn.classList.remove("active"));
        // Добавя "active" към кликнатия бутон
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
</script>
  </header>
  

  <section class="hero-video">
    <video autoplay muted loop playsinline>
        <source src="Header 3.mp4" type="video/mp4">
        Твоят браузър не поддържа видео таг.
    </video>
  </section>

  <section class="mission1">
      <div class="mission">
          <h1>Мисия, визия и ценности (звучим сериозно, нали?)</h1>
          <h2>Но всъщност просто искаме да ти помогнем...</h2>

          <div class="icon-row">
              <div class="icon-wrapper">
                  <img src="1.png" alt="">
                  <p>Да започнеш търсенето.</p>
              </div>

              <div class="icon-wrapper">
                  <img src="2.png" alt="">
                  <p>Да знаеш, че можеш.</p>
              </div>

              <div class="icon-wrapper">
                  <img src="3.png" alt="">
                  <p>Да е с кураж и усмивка.</p>
              </div>
          </div>
      </div>
  </section>

  <section class="quotes">
    <h1 class="quote1">Твоята първа крачка към работа и самостоятелност</h1>
    <h2 class="quote2">Готов ли си да започнеш? </h2>
    <h3 class="quote3">Тук ще намериш всичко, което ти трябва, за да направиш уверено първите си стъпки към работа. Без излишни усложнения, без скучни теории — само практични съвети, инструменти и мотивация.</h3>
  </section>     

  <div class="container">
    <div class="image-wrapper_image-1">
        <img src="Desktop-1.1.png">
    </div>
    
    <div class="image-wrapper_image-2">
        <img src="Desktop-1.2.png">
    </div>
    
    <div class="image-wrapper_image-3">
        <img src="Desktop-1.3.png">
    </div>
    
    <div class="image-wrapper_image-4">
        <img src="Desktop-1.4(37).png">
    </div>
  </div>

  <section class="footer">
    <video autoplay muted loop playsinline>
        <source src="Footer 2.mp4" type="video/mp4">
        Твоят браузър не поддържа видео таг.
    </video>
    <h1>Последвай ни в:</h1>
    <div class="footer-social">
      <a href="https://facebook.com"><i class="fab fa-facebook-f"></i></a>
        <a href="https://tiktok.com"><i class="fab fa-tiktok"></i></a>
      <a href="https://instagram.com"><i class="fab fa-instagram"></i></a>
      <a href="https://linkedin.com"><i class="fab fa-linkedin-in"></i></a>
    </div>
  </section>
</body>
</html>
