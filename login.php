<?php
session_start(); 
require 'db_connect.php'; 


if ($_SERVER["REQUEST_METHOD"] == "POST" && $conn) {
    
    
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password']; 

    
    
    $sql = "SELECT id, email, password FROM teencareer2 WHERE email = ?";
    $stmt = $conn->prepare($sql);
    
    
    if ($stmt === false) {
        
        echo "⚠️ Грешка в системата при подготовка на заявка.";
        exit(); 
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        
        $user = $result->fetch_assoc();
        $stmt->close(); 
        
        
        if (password_verify($password, $user['password'])) {

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
        
            header("Location: myprofile.php"); 
            exit();
        } else {
            
            echo "⚠️ Грешен имейл или парола.";
        }
    } else {
       
        echo "⚠️ Грешен имейл или парола.";
    }

    if (isset($stmt) && $stmt->close() === false) {
    }
} 

if (isset($conn)) {
    $conn->close();
}
?>