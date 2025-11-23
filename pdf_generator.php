<?php

require 'vendor/autoload.php'; 

use Dompdf\Dompdf;
use Dompdf\Options;

$portfolioId = $_GET['id'] ?? null;

if (!$portfolioId) {
    http_response_code(400);
    die('Грешка: Липсва ID на портфолиото.');
}


$html = '
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: DejaVu Sans, sans-serif; } /* Важно за кирилица */
            h1 { color: #8274A1; }
        </style>
    </head>
    <body>
        <h1>Портфолио за Работа</h1>
        <p>Вашето портфолио с уникален идентификатор: ' . htmlspecialchars($portfolioId) . '</p>
        </body>
    </html>';


$options = new Options();
$options->setIsRemoteEnabled(true); 
$dompdf = new Dompdf($options);

$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();


$filename = "Portfolio_" . $portfolioId . ".pdf";
$dompdf->stream($filename, ["Attachment" => true]); 
?>