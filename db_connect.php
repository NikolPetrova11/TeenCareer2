<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "teencareer2"; 

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Грешка при свързване: " . $conn->connect_error);
}
?>
