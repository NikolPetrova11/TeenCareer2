<?php
$city = isset($_GET['city']) ? htmlspecialchars($_GET['city']) : '';
if ($city) {
  echo "<h1>Избраният град е: $city</h1>";
} else {
  echo "<h1>Моля, избери град!</h1>";
}
?>
