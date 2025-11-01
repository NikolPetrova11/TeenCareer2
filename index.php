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
      <img src="logo.png" class="logo" alt="TeenCareer">

      <nav class="nav-links" id="navMenu">
        <ul>
          <li><a href="#">Да започнем</a></li>
          <li><a href="searching.html">Хайде на работа!</a></li>
          <li><a href="#">Твоят стартов комплект</a></li>
          <li><a href="#">Съвети със стил</a></li>
        </ul>
      </nav>

      <div class="right-buttons">
        <button class="menu-toggle" id="menuToggle" metod="post">☰</button>
        <button class="profile-btn">
          <img src="viber_image_2025-07-15_17-38-46-235.png" alt="Profile" class="profile">
        </button>
      </div>
    </div>
    
    <div class="overlay"></div>
    
    <!-- ✅ Popup с вградена форма за регистрация -->
    <div class="popup">
      <div class="close-btn">&times;</div>
      <div class="form">
        <form action="register.php" method="POST">
          <div class="form-element">
            <label for="email">Email</label>
            <input type="email" name="email" id="email" placeholder="Въведи имейл" required>
          </div> 

          <div class="form-element">
            <label for="password">Password</label>
            <input type="password" name="password" id="password" placeholder="Въведи парола" required>
          </div>

          <div class="form-element">
            <input type="checkbox" id="remember-me">
            <label for="remember-me">Запомни ме</label>
          </div>

          <div class="form-element">
            <button type="submit">Регистрирай се</button>
          </div>
        </form>
      </div>
    </div>
    <!-- ✅ Край на popup-а -->
    
    <script>
      const menuToggle = document.getElementById("menuToggle");
      const navMenu = document.getElementById("navMenu");

      menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
      });

      document.querySelector(".profile-btn").addEventListener("click", function() {
        document.querySelector(".overlay").classList.add("active");
        document.querySelector(".popup").classList.add("active");
      });

      document.querySelector(".popup .close-btn").addEventListener("click", function() {
        document.querySelector(".overlay").classList.remove("active");
        document.querySelector(".popup").classList.remove("active");
      });

      document.querySelector(".overlay").addEventListener("click", function(e) {
        if (e.target.classList.contains("overlay")) {
          document.querySelector(".overlay").classList.remove("active");
          document.querySelector(".popup").classList.remove("active");
        }
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
    <div class="image-wrapper image-1">
        <img src="Desktop-1.1.png">
    </div>
    
    <div class="image-wrapper image-2">
        <img src="Desktop-1.2.png">
    </div>
    
    <div class="image-wrapper image-3">
        <img src="Desktop-1.3.png">
    </div>
    
    <div class="image-wrapper image-4">
        <img src="Desktop-1.4(21).png">
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
      <a href="https://twitter.com"><i class="fab fa-twitter"></i></a>
      <a href="https://instagram.com"><i class="fab fa-instagram"></i></a>
      <a href="https://linkedin.com"><i class="fab fa-linkedin-in"></i></a>
    </div>
  </section>
</body>
</html>
