<?php
$role = isset($_GET['role']) ? urlencode($_GET['role']) : '';
$city = isset($_GET['city']) ? urlencode($_GET['city']) : '';

$url = "https://www.jobs.bg/front_job_jobs.php?keywords=$role&location=$city";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; PHP JobScraper/1.0)');
$html = curl_exec($ch);
curl_close($ch);

libxml_use_internal_errors(true);
$doc = new DOMDocument();
$doc->loadHTML($html);
libxml_clear_errors();

$xpath = new DOMXPath($doc);

// ще променим тези селектори, след като видим структурата
$jobTitles = $xpath->query("//a[contains(@class, 'joblink')]");
$companies = $xpath->query("//div[contains(@class, 'mdc-card__subtitle')]");

echo "<h2>Резултати за: <em>" . urldecode($role) . "</em> в <em>" . urldecode($city) . "</em></h2>";

if ($jobTitles->length > 0) {
    echo "<ul>";
    for ($i = 0; $i < $jobTitles->length; $i++) {
        $title = trim($jobTitles->item($i)->nodeValue);
        $jobTitleNode = $jobTitles->item($i);
        $link = '';
        if ($jobTitleNode instanceof DOMElement) {
            $link = $jobTitleNode->getAttribute('href');
        }
        $company = $companies->item($i)->nodeValue ?? 'Неизвестна фирма';
        echo "<li><a href='$link' target='_blank'>$title</a> — <strong>$company</strong></li>";
    }
    echo "</ul>";
} else {
    echo "<p>Няма намерени обяви.</p>";
}
?>
