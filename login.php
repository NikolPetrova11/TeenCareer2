<?php
session_start(); 
require 'db_connect.php'; 

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = $_POST['password'];

    
    $sql = "SELECT id, email, password FROM teencareer2 WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        
        $user = $result->fetch_assoc();
        
        
        if (password_verify($password, $user['password'])) {
            
            
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            
            
            header("Location: myprofile.html");
            exit();
        } else {
           
            echo "⚠️ Грешна парола.";
        }
    } else {
       
        echo "⚠️ Потребител с този имейл не съществува.";
    }

    $stmt->close();
    $conn->close();
}
?>