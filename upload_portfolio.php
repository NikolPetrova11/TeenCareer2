<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Не е POST заявка']);
    exit;
}

if (!isset($_FILES['portfolio_file'])) {
    echo json_encode([
        'success' => false, 
        'error' => 'Няма качен файл',
        'debug' => $_FILES
    ]);
    exit;
}

$file = $_FILES['portfolio_file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => 'Файлът е твърде голям (над php.ini лимит)',
        UPLOAD_ERR_FORM_SIZE => 'Файлът е твърде голям',
        UPLOAD_ERR_PARTIAL => 'Файлът е качен частично',
        UPLOAD_ERR_NO_FILE => 'Не е избран файл',
        UPLOAD_ERR_NO_TMP_DIR => 'Липсва временна директория',
        UPLOAD_ERR_CANT_WRITE => 'Грешка при запис на диска',
        UPLOAD_ERR_EXTENSION => 'PHP разширение спря качването'
    ];
    
    echo json_encode([
        'success' => false, 
        'error' => $errorMessages[$file['error']] ?? 'Неизвестна грешка',
        'error_code' => $file['error']
    ]);
    exit;
}

$portfolioId = uniqid('portfolio_', true);

$uploadDir = __DIR__ . '/uploaded_portfolios/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode([
            'success' => false, 
            'error' => 'Не може да се създаде директория',
            'path' => $uploadDir
        ]);
        exit;
    }
}

if (!is_writable($uploadDir)) {
    echo json_encode([
        'success' => false, 
        'error' => 'Директорията няма права за писане',
        'path' => $uploadDir
    ]);
    exit;
}

$filename = $portfolioId . '_' . basename($file['name']);
$filepath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    echo json_encode([
        'success' => true,
        'portfolio_id' => $portfolioId,
        'filename' => $filename,
        'filepath' => $filepath
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'error' => 'Грешка при move_uploaded_file',
        'tmp_name' => $file['tmp_name'],
        'target_path' => $filepath
    ]);
}

?>