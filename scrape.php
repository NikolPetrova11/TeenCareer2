<?php
header("Content-Type: application/json; charset=utf-8");

$role = isset($_GET['role']) ? urlencode($_GET['role']) : '';
$city = isset($_GET['city']) ? urlencode($_GET['city']) : '';

$url = "https://www.zaplata.bg/?q=$role&l=$city";

// 1. Зареждаме страницата
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; TeenCareerBot/1.0)');
$html = curl_exec($ch);
curl_close($ch);

// 2. Зареждаме HTML в DOM
libxml_use_internal_errors(true);
$doc = new DOMDocument();
$doc->loadHTML($html);
libxml_clear_errors();

$xpath = new DOMXPath($doc);

// 3. Извличаме заглавие, линк и фирма
$jobNodes = $xpath->query("//div[contains(@class,'title')]/a");
$companyNodes = $xpath->query("//div[contains(@class,'logo')]/a/img");

$results = [];

for ($i = 0; $i < $jobNodes->length; $i++) {
    $title = trim($jobNodes->item($i)->nodeValue);
    $link = '';
    $jobNode = $jobNodes->item($i);
    if ($jobNode instanceof DOMElement) {
        $link = $jobNode->getAttribute('href');
    }
    $company = 'Неизвестна фирма';
    
    if ($i < $companyNodes->length) {
        $companyNode = $companyNodes->item($i);
        if ($companyNode instanceof DOMElement && $companyNode->hasAttribute('alt')) {
            $company = $companyNode->getAttribute('alt');
        }
    }

    if (strpos($link, 'http') !== 0) {
        $link = 'https://www.zaplata.bg' . $link;
    }

    $results[] = [
        'title' => $title,
        'company' => $company,
        'link' => $link
    ];
}

echo json_encode(['results' => $results], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
