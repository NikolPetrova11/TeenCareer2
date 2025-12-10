<?php
session_start(); 
require 'db_connect.php'; 

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    
    // Валидация
    if (empty($email) || empty($password)) {
        echo "⚠️ Моля, попълнете всички полета.";
        exit();
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "⚠️ Невалиден имейл адрес.";
        exit();
    }
    
    // Провери дали имейлът вече съществува
    $check_sql = "SELECT email FROM teencareer2 WHERE email = ?";
    $check_stmt = $conn->prepare($check_sql);
    
    if ($check_stmt === false) {
        die("Грешка в SQL заявката: " . $conn->error);
    }
    
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $check_stmt->store_result();
    
    if ($check_stmt->num_rows > 0) {
        echo "⚠️ Този имейл вече е регистриран. Моля, влезте или използвайте друг имейл.";
        $check_stmt->close();
        $conn->close();
        exit(); 
    }
    $check_stmt->close();
    
    // Хеширай паролата
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Вмъкни новия потребител
    $insert_sql = "INSERT INTO teencareer2 (email, password, username) VALUES (?, ?, ?)";
    $insert_stmt = $conn->prepare($insert_sql);
    
    if ($insert_stmt === false) {
        die("Грешка в SQL заявката: " . $conn->error);
    }
    
    $insert_stmt->bind_param("sss", $email, $hashed_password, $username);
    
    if ($insert_stmt->execute()) {
        // Запази потребителя в сесията
        $_SESSION['user_id'] = $insert_stmt->insert_id;
        $_SESSION['user_email'] = $email;
        
        // Пренасочи към профила
        header("Location: myprofile.php"); 
        exit();
    } else {
        echo "⚠️ Грешка при регистрация: " . $insert_stmt->error;
    }
    
    $insert_stmt->close();
    $conn->close();
}
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Регистрация - TeenCareer Portal</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h2>Регистрация</h2>
        <form method="POST" action="">
            <input type="text" name="username" placeholder="Потребителско име" required>
            <input type="email" name="email" placeholder="Имейл" required>
            <input type="password" name="password" placeholder="Парола" required>
            <button type="submit">Регистрирай се</button>
        </form>
        <p>Вече имате профил? <a href="login.php">Влезте тук</a></p>
    </div>
</body>
</html>