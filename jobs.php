<?php
// search.php

// 1. Вземаме параметрите от URL
$role = isset($_GET['role']) ? urlencode($_GET['role']) : '';
$city = isset($_GET['city']) ? urlencode($_GET['city']) : '';

// 2. Задаваме URL на търсене в jobs.bg (примерен)
$url = "https://www.jobs.bg/front_job_search.php?keywords=$role&location=$city";

// 3. Зареждаме HTML с cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; PHP JobScraper/1.0)');
$html = curl_exec($ch);
curl_close($ch);

// 4. Зареждаме HTML в DOMDocument
libxml_use_internal_errors(true);
$doc = new DOMDocument();
$doc->loadHTML($html);
libxml_clear_errors();

// 5. Използваме DOMXPath за извличане
$xpath = new DOMXPath($doc);

// Примерни селектори (трябва да се нагласят според структурата на сайта)
$jobTitles = $xpath->query("//a[contains(@class, 'joblink')]");
$companies = $xpath->query("//div[contains(@class, 'mdc-list-item__secondary-text')]");

echo "<h2>Резултати за: <em>$role</em> в <em>$city</em></h2>";

if ($jobTitles->length > 0) {
    echo "<ul>";
    for ($i = 0; $i < $jobTitles->length; $i++) {
        $title = trim($jobTitles->item($i)->nodeValue);
        $link = $jobTitles->item($i)->attributes->getNamedItem('href')->nodeValue;
        $company = $companies->item($i)->nodeValue ?? 'Неизвестна фирма';
        echo "<li><a href='$link' target='_blank'>$title</a> — <strong>$company</strong></li>";
    }
    echo "</ul>";
} else {
    echo "<p>Няма намерени обяви.</p>";
}
?>
