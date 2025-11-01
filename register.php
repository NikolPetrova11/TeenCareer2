<?php
require 'db_connect.php'; // свързва с базата

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Хеширане на паролата
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO teencareer2
 (email, password) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $email, $hashed_password);

    if ($stmt->execute()) {
        echo "<h3>✅ Регистрацията е успешна!</h3>";
        echo "<a href='index.php'>Върни се към сайта</a>";
    } else {
        echo "⚠️ Грешка: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>
