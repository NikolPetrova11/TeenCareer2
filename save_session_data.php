<?php
session_start();

$_SESSION['portfolio_data'] = [
    'full_name' => $_POST['full_name'] ?? 'Гост Потребител',
    'email' => $_POST['email'] ?? 'N/A',
    'phone' => $_POST['phone'] ?? 'N/A',
    'education' => $_POST['education'] ?? 'Няма въведено образование.',
    'experience' => $_POST['experience'] ?? 'Няма въведен опит.',
    
];

echo json_encode(['success' => true]);
?>