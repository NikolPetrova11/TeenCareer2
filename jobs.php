<?php
$role = isset($_GET['role']) ? urlencode($_GET['role']) : '';
$city = isset($_GET['city']) ? urlencode($_GET['city']) : '';

echo "<h1>Обяви за <em>" . urldecode($role) . "</em> в <em>" . urldecode($city) . "</em></h1>";

$results = [];

/* ------------------------------
    jobs.bg
--------------------------------*/
$url_jobsbg = "https://www.jobs.bg/front_job_search.php?keywords=$role&location=$city";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url_jobsbg,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; PHP JobScraper/1.0)'
]);
$html = curl_exec($ch);
curl_close($ch);

if ($html) {
    libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    $doc->loadHTML($html);
    libxml_clear_errors();
    $xpath = new DOMXPath($doc);

    // примерни селектори (ще ги нагласим после)
    $titles = $xpath->query("//a[contains(@class, 'joblink')]");
    foreach ($titles as $t) {
        $results[] = [
            'title' => trim($t->nodeValue),
            'link'  => ($t instanceof DOMElement) ? $t->getAttribute('href') : '',
            'source' => 'Jobs.bg'
        ];
    }
}

/* ------------------------------
     zaplata.bg
--------------------------------*/
$url_zaplata = "https://www.zaplata.bg/?q=$role&l=$city";
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url_zaplata,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERAGENT => 'Mozilla/5.0'
]);
$html = curl_exec($ch);
curl_close($ch);

if ($html) {
    libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    $doc->loadHTML($html);
    libxml_clear_errors();
    $xpath = new DOMXPath($doc);

    // примерен селектор за zaplata.bg
    $titles = $xpath->query("//a[contains(@class, 'job-title')]");
    foreach ($titles as $t) {
        $href = ($t instanceof DOMElement) ? $t->getAttribute('href') : '';
        $results[] = [
            'title' => trim($t->nodeValue),
            'link'  => $href ? "https://www.zaplata.bg" . $href : '',
            'source' => 'Zaplata.bg'
        ];
    }
}

/* ------------------------------
    indeed.com
--------------------------------*/
$url_indeed = "https://bg.indeed.com/jobs?q=$role&l=$city";
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url_indeed,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERAGENT => 'Mozilla/5.0'
]);
$html = curl_exec($ch);
curl_close($ch);

if ($html) {
    libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    $doc->loadHTML($html);
    libxml_clear_errors();
    $xpath = new DOMXPath($doc);

    $titles = $xpath->query("//a[contains(@class, 'jcs-JobTitle')]");
    foreach ($titles as $t) {
        $results[] = [
            'title' => trim($t->nodeValue),
            'link'  => ($t instanceof DOMElement) ? "https://bg.indeed.com" . $t->getAttribute('href') : '',
            'source' => 'Indeed.com'
        ];
    }
}

/* ------------------------------
 Извеждане на резултатите
--------------------------------*/
if (count($results) > 0) {
    echo "<ul>";
    foreach ($results as $r) {
        echo "<li><a href='{$r['link']}' target='_blank'>{$r['title']}</a> 
              <small>({$r['source']})</small></li>";
    }
    echo "</ul>";
} else {
    echo "<p>Няма намерени обяви.</p>";
}
?>
