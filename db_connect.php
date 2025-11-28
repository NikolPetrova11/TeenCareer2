<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$servername = "sql302.infinityfree.com";
$username = "if0_40405924";
$password = "wGL8bL2mwI62";
$dbname = "if0_40405924_teencareer2";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Грешка при свързване с базата данни: " . $conn->connect_error);
}

// Задай UTF-8 кодировка
$conn->set_charset("utf8mb4");
?>