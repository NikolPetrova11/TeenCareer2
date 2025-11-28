<?php
session_start();
require 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    
    // Валидация
    if (empty($email) || empty($password)) {
        $error = "Моля, попълнете всички полета.";
    } else {
        // Провери дали потребителят съществува
        $sql = "SELECT id, email, password FROM teencareer2 WHERE email = ?";
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            die("Грешка в SQL заявката: " . $conn->error);
        }
        
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            
            // Провери паролата
            if (password_verify($password, $user['password'])) {
                // Успешен вход
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_email'] = $user['email'];
                
                header("Location: myprofile.php");
                exit();
            } else {
                $error = "Грешна парола.";
            }
        } else {
            $error = "Потребител с този имейл не съществува.";
        }
        
        $stmt->close();
    }
    
    $conn->close();
}
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход - TeenCareer Portal</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h2>Вход</h2>
        
        <?php if (isset($error)): ?>
            <div class="error"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <form method="POST" action="">
            <input type="email" name="email" placeholder="Имейл" required>
            <input type="password" name="password" placeholder="Парола" required>
            <button type="submit">Влез</button>
        </form>
        <p>Нямате профил? <a href="register.php">Регистрирайте се тук</a></p>
    </div>
</body>
</html>