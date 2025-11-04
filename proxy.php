<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/html; charset=utf-8");

if (!isset($_GET['url'])) {
    http_response_code(400);
    echo "Missing URL";
    exit;
}

$url = $_GET['url'];
$html = file_get_contents($url);
echo $html;
