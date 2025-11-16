<?php



require 'vendor/autoload.php';
use Dompdf\Dompdf;


$data = [];

if (!empty($_POST)) {
   
    foreach ($_POST as $key => $value) {
        $data[$key] = is_array($value) ? $value : trim(filter_var($value, FILTER_SANITIZE_FULL_SPECIAL_CHARS));
    }
    
    $templateName = $data['template'] ?? 'default'; 
    $templateFile = "template_{$templateName}.php"; 
    $data['name'] = $data['fullName'] ?? ''; 
    
} else {
    die("Грешка: Не са изпратени данни. Моля, попълнете формата.");
}


ob_start();

if (file_exists($templateFile)) {
    
    include $templateFile; 
} else {
    
    include 'template_default.php';
}

$html = ob_get_clean();



$dompdf = new Dompdf();

$options = $dompdf->getOptions();
$options->set('defaultFont', 'DejaVu Sans'); 
$dompdf->setOptions($options);


$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait'); 
$dompdf->render();

$filename = "CV-" . str_replace(' ', '_', $data['name']) . ".pdf";

$dompdf->stream($filename, [
    "Attachment" => true 
]);

exit(0);
?>