<?php
// generate_pdf.php

// 1. Включете Dompdf и заредете класа
require 'vendor/autoload.php';
use Dompdf\Dompdf;
use Dompdf\Options;

// 2. Вземете данните от формата
// *** КЛЮЧОВАТА ПРОМЯНА Е ТУК ***
// Използваме $_POST, който съдържа всички данни от формата
$data = [];

// Проверяваме дали заявката е POST и дали има данни
if (!empty($_POST)) {
    // Основните полета
    $data['name']       = $_POST['name'] ?? ''; 
    $data['job_title']  = $_POST['job_title'] ?? ''; 
    $data['phone']      = $_POST['phone'] ?? ''; 
    $data['email']      = $_POST['email'] ?? ''; 
    $data['address']    = $_POST['address'] ?? ''; 

    // Масивите
    $data['skills']     = $_POST['skills'] ?? [];
    $data['experience'] = $_POST['experience'] ?? [];
    $data['education']  = $_POST['education'] ?? []; // Ако имате полета за образование
} else {
    // В случай, че някой директно отвори generate_pdf.php без POST данни
    die("Грешка: Не са изпратени данни. Моля, попълнете формата.");
}
// *** КРАЙ НА ПРОМЯНАТА ***

// 3. Настройки на Dompdf 
$options = new Options();
// ... (останалите настройки) ...

$dompdf = new Dompdf($options);

// 4. Буфериране на HTML съдържанието
ob_start();
include 'CV_Portfolio_Maker.html'; 
$html = ob_get_clean();

// 5. Зареждане на HTML и генериране
// ... (останалата част от кода) ...

// 6. Изпращане на PDF към браузъра за сваляне
$filename = "CV-" . str_replace(' ', '_', $data['name']) . ".pdf";

$dompdf->stream($filename, [
    "Attachment" => true 
]);

exit(0);
?>