<?php
session_start();

// Проверка дали файл е качен
if (!isset($_FILES['portfolio_file'])) {
    echo json_encode(['success' => false, 'error' => 'Няма качен файл!']);
    exit;
}

$file = $_FILES['portfolio_file'];
$fileName = $file['name'];
$fileTmpName = $file['tmp_name'];
$fileSize = $file['size'];
$fileError = $file['error'];

// Проверка за грешки
if ($fileError !== 0) {
    echo json_encode(['success' => false, 'error' => 'Грешка при качване на файла!']);
    exit;
}

// Проверка на размера (макс 10MB)
if ($fileSize > 10 * 1024 * 1024) {
    echo json_encode(['success' => false, 'error' => 'Файлът е твърде голям! (макс 10MB)']);
    exit;
}

// Създаване на папка за портфолиата (ако не съществува)
$uploadDir = 'uploads/portfolios/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Генериране на уникален ID за гост (понеже нямаме ID от регистрация)
// Този ID ще се използва само за уникалност на файла и връзката към PDF-а.
$guestId = $_POST['user_id'] ?? rand(10000, 99999); 

// Генериране на уникално име за файла
$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
$newFileName = 'portfolio_' . $guestId . '_' . time() . '.' . $fileExtension;
$uploadPath = $uploadDir . $newFileName;

// Преместване на файла
if (move_uploaded_file($fileTmpName, $uploadPath)) {
    // Връщаме генерирания ID, който ще се ползва от JS за download URL
    echo json_encode([
        'success' => true,
        'portfolio_id' => $guestId, 
        'filename' => $newFileName
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Грешка при записване на файла!']);
}
?>