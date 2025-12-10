<?php
session_start();
require 'db_connect.php'; 

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php"); 
    exit();
}

$user_id = $_SESSION['user_id'];

// Поправена SQL заявка - използва точното име на таблицата: teencareer2
$sql = "SELECT username, dob, phone, email, password FROM teencareer2 WHERE id = ?";

$stmt = $conn->prepare($sql);

// Проверка дали prepare() е успешно
if ($stmt === false) {
    die("Грешка в SQL заявката: " . $conn->error);
}

$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user_data = $result->fetch_assoc();
} else {
    session_destroy();
    header("Location: login.php"); 
    exit();
}

$stmt->close();
$conn->close();
?>
<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="myprofile.css">
<title>TeenCareer Portal</title>
</head>
<body>

<a href="index.php"><img class="arrow" src="arrow67.png"></a>

<div class="main">
    
    <div class="header">
        <h1>Моят профил</h1>
    </div>

    <div class="profile-header">
        <img src="viber_image_2025-07-15_17-38-46-235.png">
        <div>
            <h3><div class="value">
                <?php echo htmlspecialchars($user_data['username'] ?? 'Няма данни'); ?>
            </div></h3>
            <p>Регистриран потребител</p>
        </div>
    </div>

    <div class="tabs">
        <div class="active">За мен</div>
        <div>Любими</div>
        <div>CV файлове</div>
        <div>Портфолиа</div>
    </div>

    <div class="card">
        <h3>Лични данни</h3>

        <div class="info-grid">

            <div>
                <div class="label">Дата на раждане:</div>
                <div class="value">
                <?php 
                    if (!empty($user_data['dob'])) {
                        echo date('d.m.Y г.', strtotime($user_data['dob']));
                    } else {
                        echo 'Няма данни';
                    }
                ?>
                </div>
            </div>

            <div>
                <div class="label">Email:</div>
                <div class="value"><?php echo htmlspecialchars($user_data['email'] ?? 'Няма данни'); ?></div>
            </div>

            <div>
                <div class="label">Телефон:</div>
                <div class="value">
                <?php echo htmlspecialchars($user_data['phone'] ?? 'Няма данни'); ?>
                </div>
            </div>

            <div>
                <div class="label">Парола:</div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="value" id="passwordField">********</span>
                    <span id="togglePassword" style="cursor:pointer; display:flex; align-items:center;">
                        <svg id="eyeClosed" xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                             viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2"
                             stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94"></path>
                            <path d="M1 1l22 22"></path>
                        </svg>
                        <svg id="eyeOpen" xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                             viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2"
                             stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </span>
                </div>
            </div>

        </div>
        
        <div class="buttons">
            <a href="edit_profile.php"><button class="btn edit">Редактирай</button></a>
            <a href="logout.php" style="text-decoration: none;">
                <button class="btn profile">Излез от профила</button>
            </a>
        </div>

    </div>

</div>

<script>
// Реалната парола от PHP
const realPass = "<?php echo htmlspecialchars($user_data['password']); ?>";

// ==================== ФУНКЦИЯ ЗА ПОКАЗВАНЕ/СКРИВАНЕ НА ПАРОЛА ====================
function setupPasswordToggle() {
    const passField = document.getElementById("passwordField");
    const eyeOpen = document.getElementById("eyeOpen");
    const eyeClosed = document.getElementById("eyeClosed");
    const toggleBtn = document.getElementById("togglePassword");
    
    if (toggleBtn) {
        let visible = false;
        
        // Премахваме стари event listeners
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        newToggleBtn.addEventListener("click", () => {
            if (!visible) {
                passField.textContent = realPass;
                document.getElementById("eyeClosed").style.display = "none";
                document.getElementById("eyeOpen").style.display = "block";
                visible = true;
            } else {
                passField.textContent = "********";
                document.getElementById("eyeOpen").style.display = "none";
                document.getElementById("eyeClosed").style.display = "block";
                visible = false;
            }
        });
    }
}

// Инициализираме функцията за паролата при зареждане на страницата
setupPasswordToggle();

// ==================== ФУНКЦИОНАЛНОСТ ЗА ТАБОВЕ ====================

const tabs = document.querySelectorAll('.tabs div');
const card = document.querySelector('.card');

// Запазваме оригиналното съдържание на "За мен"
const originalContent = card.innerHTML;

tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        // Премахваме active класа от всички табове
        tabs.forEach(t => t.classList.remove('active'));
        
        // Добавяме active класа на кликнатия таб
        tab.classList.add('active');
        
        // Показваме съответното съдържание
        if (index === 0) {
            // ЗА МЕН - показваме оригиналното съдържание
            card.innerHTML = originalContent;
            
            // Добавяме отново event listener за паролата
            setupPasswordToggle();
            
        } else if (index === 1) {
            // ЛЮБИМИ - празна бяла кутия
            card.innerHTML = `
                <h3>Любими</h3>
                <div style="margin-top: 20px; padding: 60px 40px; background: white; border: 2px dashed #ddd; border-radius: 10px; text-align: center; color: #999; font-size: 16px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 15px;">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <p>Все още нямате запазени любими позиции</p>
                </div>
            `;
            
        } else if (index === 2) {
            // CV ФАЙЛОВЕ - празна бяла кутия
            card.innerHTML = `
                <h3>CV файлове</h3>
                <div style="margin-top: 20px; padding: 60px 40px; background: white; border: 2px dashed #ddd; border-radius: 10px; text-align: center; color: #999; font-size: 16px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 15px;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p>Все още нямате качени CV файлове</p>
                </div>
            `;
            
        } else if (index === 3) {
          
            card.innerHTML = `
                <h3>Портфолиа</h3>
                <div style="margin-top: 20px; padding: 60px 40px; background: white; border: 2px dashed #ddd; border-radius: 10px; text-align: center; color: #999; font-size: 16px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 15px;">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    <p>Все още нямате създадени портфолиа</p>
                </div>
            `;
        }
    });
});
</script>

</body>
</html>