<?php
session_start(); 
require 'db_connect.php'; 

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = $_POST['password'];

    
    $check_sql = "SELECT email FROM teencareer2 WHERE email = ?";
    $check_stmt = $conn->prepare($check_sql);
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
    
    
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    
    $insert_sql = "INSERT INTO teencareer2 (email, password) VALUES (?, ?)";
    $insert_stmt = $conn->prepare($insert_sql);
    $insert_stmt->bind_param("ss", $email, $hashed_password);

    if ($insert_stmt->execute()) {
        
        
        
       
        $_SESSION['user_id'] = $insert_stmt->insert_id;
        $_SESSION['user_email'] = $email;
        
        
        header("Location: myprofile.php"); 
        exit();
    } else {
        echo "⚠️ Грешка при регистрация: " . $insert_stmt->error;
    }

    $insert_stmt->close();
    $conn->close();
}
?>