/* JavaScript code for TeenCareer website */
/*-- Animations Balls --*/
const balls = document.querySelectorAll('.ball');

function startCycle() {
    balls.forEach(ball => {
        ball.classList.remove('hide-all');
        ball.style.animation = 'none';
        ball.offsetHeight;
        ball.style.animation = '';
    });

    
    setTimeout(() => {
        balls.forEach(ball => ball.classList.add('hide-all'));
    }, 9000);

    
    setTimeout(startCycle, 9500);
}

startCycle();
function updateHeaderHeight() {
    const header = document.querySelector('header');
    document.documentElement.style.setProperty(
      '--header-height',
      header.offsetHeight + 'px'
    );
  }

  window.addEventListener('load', updateHeaderHeight);
  window.addEventListener('resize', updateHeaderHeight);

  /*-- Navigation --*/

  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu"); 

  menuToggle.addEventListener("click", () => {
    
    if (navMenu) {
        navMenu.classList.toggle("active");
    }
  });

  /*-- POP-UP --*/

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

  /*-- Clicable zone --*/
  
function klik() {
  window.location.href = "searching.html";
}
function klik1() {
  window.location.href = "CV_Portfolio_Maker.html";
}
function klik2() {
  window.location.href = "CV_Portfolio_Maker.html";
}
function klik3() {
  window.location.href = "tips.html";
}



