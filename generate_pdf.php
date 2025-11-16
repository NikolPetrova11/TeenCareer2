<?php
// generate_pdf.php

// Включете Dompdf и заредете класа
require 'vendor/autoload.php';
use Dompdf\Dompdf;

// 1. Вземете данните от формата
$data = [];

if (!empty($_POST)) {
    // Безопасно събиране на всички данни
    foreach ($_POST as $key => $value) {
        // Прилагаме филтър за безопасност
        $data[$key] = is_array($value) ? $value : trim(filter_var($value, FILTER_SANITIZE_FULL_SPECIAL_CHARS));
    }
    
    // Определяме кой темплейт да използваме (стойност по подразбиране е 'default')
    $templateName = $data['template'] ?? 'default'; 
    $templateFile = "template_{$templateName}.php"; // Напр. template_modern.php
    
    // За по-голяма съвместимост с данните от JS
    $data['name'] = $data['fullName'] ?? ''; // fullName от JS да стане name за Dompdf
    
} else {
    // В случай, че някой директно отвори generate_pdf.php без POST данни
    die("Грешка: Не са изпратени данни. Моля, попълнете формата.");
}

// 2. Буфериране на HTML съдържанието
ob_start();

if (file_exists($templateFile)) {
    // Включваме темплейтния файл, който ще използва данните от масива $data
    include $templateFile; 
} else {
    // Ако файлът липсва (за да избегнем грешки), използваме default
    include 'template_default.php';
}

$html = ob_get_clean();


// 3. Настройки и генериране на Dompdf
$dompdf = new Dompdf();

$options = $dompdf->getOptions();
$options->set('defaultFont', 'DejaVu Sans'); // Задава DejaVu Sans като основен шрифт за кирилица
$dompdf->setOptions($options);
// *******************************************************************

$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait'); 
$dompdf->render();


// 4. Изпращане на PDF към браузъра за сваляне
$filename = "CV-" . str_replace(' ', '_', $data['name']) . ".pdf";

$dompdf->stream($filename, [
    "Attachment" => true 
]);

exit(0);
?>