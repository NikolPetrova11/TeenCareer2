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
const realPass = "<?php echo htmlspecialchars($user_data['password']); ?>";

let visible = false;

const passField = document.getElementById("passwordField");
const eyeOpen = document.getElementById("eyeOpen");
const eyeClosed = document.getElementById("eyeClosed");

document.getElementById("togglePassword").addEventListener("click", () => {
    if (!visible) {
        passField.textContent = realPass;
        eyeClosed.style.display = "none";
        eyeOpen.style.display = "block";
        visible = true;
    } else {
        passField.textContent = "********";
        eyeOpen.style.display = "none";
        eyeClosed.style.display = "block";
        visible = false;
    }
});
</script>
</body>
</html>