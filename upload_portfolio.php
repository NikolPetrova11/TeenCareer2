<?php
session_start();

if (!isset($_FILES['portfolio_file'])) {
    echo json_encode(['success' => false, 'error' => 'Няма качен файл!']);
    exit;
}

$file = $_FILES['portfolio_file'];
$fileName = $file['name'];
$fileTmpName = $file['tmp_name'];
$fileSize = $file['size'];
$fileError = $file['error'];

if ($fileError !== 0) {
    echo json_encode(['success' => false, 'error' => 'Грешка при качване на файла!']);
    exit;
}

if ($fileSize > 10 * 1024 * 1024) {
    echo json_encode(['success' => false, 'error' => 'Файлът е твърде голям! (макс 10MB)']);
    exit;
}

$uploadDir = 'uploads/portfolios/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$guestId = $_POST['user_id'] ?? rand(10000, 99999); 
$userId = $guestId; 

$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
$newFileName = 'portfolio_' . $userId . '_' . time() . '.' . $fileExtension;
$uploadPath = $uploadDir . $newFileName;

if (move_uploaded_file($fileTmpName, $uploadPath)) {

    $_SESSION['uploaded_file_name'] = $fileName;

    echo json_encode([
        'success' => true,
        'portfolio_id' => $userId, 
        'filename' => $newFileName
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Грешка при записване на файла!']);
}
?>