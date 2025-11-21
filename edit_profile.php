<?php
session_start(); 
require 'db_connect.php'; 

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$message = ''; 
$error = false;

// 1. Извличане на текущите данни за попълване на формата
$fetch_sql = "SELECT username, dob, phone FROM teencareer2 WHERE id = ?";
$fetch_stmt = $conn->prepare($fetch_sql);
$fetch_stmt->bind_param("i", $user_id);
$fetch_stmt->execute();
$current_data = $fetch_stmt->get_result()->fetch_assoc();
$fetch_stmt->close();


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 2. Взимане на данните от формата
    $new_username = filter_input(INPUT_POST, 'username', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
    $new_dob = $_POST['dob'];
    $new_phone = filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_NUMBER_INT);
    
    // Взимане на паролите (може да са празни, ако потребителят не ги сменя)
    $new_password = $_POST['new_password'];
    $confirm_password = $_POST['confirm_password'];
    
    // 3. Обновяване на личните данни (винаги)
    $update_data_sql = "UPDATE teencareer2 SET username = ?, dob = ?, phone = ? WHERE id = ?";
    $update_data_stmt = $conn->prepare($update_data_sql);
    $update_data_stmt->bind_param("sssi", $new_username, $new_dob, $new_phone, $user_id);

    if ($update_data_stmt->execute()) {
        $message = "✅ Личните данни са успешно обновени.";
        // Обновяваме текущите данни, за да видим промените веднага
        $current_data['username'] = $new_username;
        $current_data['dob'] = $new_dob;
        $current_data['phone'] = $new_phone;
    } else {
        $message = "⚠️ Грешка при обновяване на личните данни: " . $update_data_stmt->error;
        $error = true;
    }
    $update_data_stmt->close();
    
    
    // 4. Обновяване на паролата (само ако полетата не са празни)
    if (!empty($new_password)) {
        if ($new_password !== $confirm_password) {
            $message = "⚠️ Новата парола и потвърждението не съвпадат. Паролата НЕ Е променена.";
            $error = true;
        } elseif (strlen($new_password) < 6) {
            $message = "⚠️ Паролата трябва да е поне 6 символа. Паролата НЕ Е променена.";
            $error = true;
        } else {
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            $update_pass_sql = "UPDATE teencareer2 SET password = ? WHERE id = ?"; 
            
            $update_pass_stmt = $conn->prepare($update_pass_sql);
            $update_pass_stmt->bind_param("si", $hashed_password, $user_id);

            if ($update_pass_stmt->execute()) {
                 // Ако личните данни вече са обновени, само добавяме към съобщението
                $message .= " ✅ Паролата е успешно променена!"; 
            } else {
                $message .= " ⚠️ Грешка при промяна на паролата.";
                $error = true;
            }
            $update_pass_stmt->close();
        }
    }
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
     <link href="https://fonts.googleapis.com/css2?family=Comforter+Brush&family=Montserrat:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <title>Редакция на Профил</title>

    <style>
        .edit-form { max-width: 500px; margin: 50px auto; padding: 30px; background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .edit-form h2 { color: #8274A1; margin-bottom: 25px; text-align: center;font-family: 'Montserrat' }
        .edit-form label { display: block; margin-bottom: 5px; font-weight: bold; color:#333; font-family: 'Montserrat'; }
        .edit-form input { width: 100%; padding: 10px; margin-bottom: 18px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;font-family: 'Montserrat' }
        .success-message { color: green; font-weight: bold; margin-bottom: 15px; border: 1px solid green; padding: 10px; border-radius: 5px; background: #e6ffe6; }
        .error-message { color: red; font-weight: bold; margin-bottom: 15px; border: 1px solid red; padding: 10px; border-radius: 5px; background: #ffe6e6; font-family: 'Montserrat'}
        .buttons-group { display: flex; gap: 10px; margin-top: 20px; }
        .btn { padding: 10px 20px; border-radius: 8px; cursor: pointer; border: none; font-weight: bold; font-family: 'Montserrat'}
        .edit { background:#09989e; color:white; }
        .profile { background:#8274A1 ; color:white; font-family: 'Montserrat'}
    </style>
</head>
<body style="background-color:#E3D7E8;">

<div class="edit-form">
    <h2>Редакция на Профил и Парола</h2>
    
    <?php if ($message): ?>
        <div class="<?php echo $error ? 'error-message' : 'success-message'; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form method="POST">
        
        <label for="username">Име/Потребителско име:</label>
        <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($current_data['username'] ?? ''); ?>" required>
        
        <label for="dob">Дата на раждане:</label>
        <input type="date" id="dob" name="dob" value="<?php echo htmlspecialchars($current_data['dob'] ?? ''); ?>" required>

        <label for="phone">Телефон:</label>
        <input type="tel" id="phone" name="phone" value="<?php echo htmlspecialchars($current_data['phone'] ?? ''); ?>" required>

        <hr style="margin: 25px 0; border-top: 1px solid #eee;">
        
        <h3 style="font-family: 'Montserrat'">Смяна на Парола (Оставете празни, ако не искате да сменяте)</h3>
        
        <label for="new_password">Нова Парола:</label>
        <input type="password" id="new_password" name="new_password">

        <label for="confirm_password">Потвърди Нова Парола:</label>
        <input type="password" id="confirm_password" name="confirm_password">

        <div class="buttons-group">
            <button type="submit" class="btn edit">Запази Промените</button>
            <button type="button" class="btn profile" onclick="window.location.href='myprofile.php'">Обратно към профила</button>
        </div>
    </form>
</div>

</body>
</html>