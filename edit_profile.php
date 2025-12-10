<?php
session_start();
require 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$user_id = $_SESSION['user_id'];

// Ако формата е изпратена
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $dob = $_POST['dob'];
    $phone = trim($_POST['phone']);
    $email = trim($_POST['email']);
    
    $update_sql = "UPDATE teencareer2 SET username = ?, dob = ?, phone = ?, email = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    
    if ($update_stmt === false) {
        die("Грешка в SQL заявката: " . $conn->error);
    }
    
    $update_stmt->bind_param("ssssi", $username, $dob, $phone, $email, $user_id);
    
    if ($update_stmt->execute()) {
        header("Location: myprofile.php");
        exit();
    } else {
        $error = "Грешка при актуализация: " . $update_stmt->error;
    }
    
    $update_stmt->close();
}

// Вземи текущите данни
$sql = "SELECT username, dob, phone, email FROM teencareer2 WHERE id = ?";
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    die("Грешка в SQL заявката: " . $conn->error);
}

$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user_data = $result->fetch_assoc();

$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Редактирай профил - TeenCareer Portal</title>
    <link rel="stylesheet" href="myprofile.css">
</head>
<body>

<a href="myprofile.php"><img class="arrow" src="arrow67.png"></a>

<div class="main">
    <div class="header">
        <h1>Редактирай профил</h1>
    </div>

    <div class="card">
        <?php if (isset($error)): ?>
            <div class="error"><?php echo $error; ?></div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="info-grid">
                <div>
                    <label>Потребителско име:</label>
                    <input type="text" name="username" value="<?php echo htmlspecialchars($user_data['username']); ?>">
                </div>
                
                <div>
                    <label>Дата на раждане:</label>
                    <input type="date" name="dob" value="<?php echo htmlspecialchars($user_data['dob']); ?>">
                </div>
                
                <div>
                    <label>Телефон:</label>
                    <input type="text" name="phone" value="<?php echo htmlspecialchars($user_data['phone']); ?>">
                </div>
                
                <div>
                    <label>Email:</label>
                    <input type="email" name="email" value="<?php echo htmlspecialchars($user_data['email']); ?>">
                </div>
            </div>

            <div class="buttons">
                <button type="submit" class="btn edit">Запази промените</button>
                <a href="myprofile.php"><button type="button" class="btn profile">Отказ</button></a>
            </div>
        </form>
    </div>
</div>

</body>
</html>