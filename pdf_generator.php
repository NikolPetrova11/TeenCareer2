<?php

require 'vendor/autoload.php'; 

use Dompdf\Dompdf;
use Dompdf\Options;

// Вземане на ID от URL
$cvId = $_GET['id'] ?? null;

if (!$cvId) {
    http_response_code(400);
    die('Грешка: Липсва ID на CV-то.');
}

// Свързване към базата данни (СЪЩИТЕ данни като в CV maker-а)
$host = 'localhost';
$dbname = 'teencareer';  // Промени с името на твоята база
$username = 'root';     // Промени с твоето потребителско име
$password = '';         // Промени с твоята парола

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Грешка при свързване с базата данни: " . $e->getMessage());
}

// Вземане на основните данни от CV таблицата
$stmt = $pdo->prepare("SELECT * FROM cvs WHERE id = ?");
$stmt->execute([$cvId]);
$cv = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$cv) {
    die('CV-то не е намерено.');
}

// Вземане на уменията
$stmt = $pdo->prepare("SELECT skill, level FROM skills WHERE cv_id = ? ORDER BY level DESC");
$stmt->execute([$cvId]);
$skills = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Вземане на опита
$stmt = $pdo->prepare("
    SELECT job_title as position, company, 
           CONCAT(start_date, ' - ', IFNULL(end_date, 'Present')) as duration,
           description 
    FROM experience 
    WHERE cv_id = ? 
    ORDER BY start_date DESC
");
$stmt->execute([$cvId]);
$experiences = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Вземане на образованието
$stmt = $pdo->prepare("
    SELECT institution, degree, field_of_study,
           CONCAT(start_year, ' - ', IFNULL(end_year, 'Present')) as period
    FROM education 
    WHERE cv_id = ?
    ORDER BY start_year DESC
");
$stmt->execute([$cvId]);
$educations = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Създаване на текст за образование
$educationText = '';
foreach ($educations as $edu) {
    $educationText .= $edu['institution'] . "\n";
    $educationText .= $edu['degree'] . ' - ' . $edu['field_of_study'] . "\n";
    $educationText .= $edu['period'] . "\n\n";
}

// Вземане на езиците (може да ги използваме като интереси)
$stmt = $pdo->prepare("SELECT language FROM languages WHERE cv_id = ?");
$stmt->execute([$cvId]);
$languages = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Ако нямаш отделна таблица за интереси, използвай хобитата или езиците
$interests = [];
if (!empty($cv['hobbies'])) {
    $hobbiesArray = explode(',', $cv['hobbies']);
    foreach ($hobbiesArray as $hobby) {
        $interests[] = ['interest_name' => trim($hobby)];
    }
}

// Генериране на HTML за PDF
$html = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: DejaVu Sans, sans-serif; 
            background: linear-gradient(135deg, #f5f1e8 0%, #e8dcc4 100%);
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
        }
        
        .header h1 {
            font-size: 72px;
            color: #5a4a3a;
            letter-spacing: 8px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .header .name {
            font-family: cursive;
            font-size: 32px;
            color: #3a2a1a;
            position: absolute;
            top: -10px;
            left: 50px;
        }
        
        .header .subtitle {
            font-size: 14px;
            color: #5a4a3a;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-top: -10px;
        }
        
        .profile-section {
            background: rgba(255, 255, 255, 0.5);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #3a2a1a;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 2px solid #5a4a3a;
            padding-bottom: 5px;
        }
        
        .intro-text {
            background: #d4c4a8;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            font-size: 12px;
            line-height: 1.6;
            color: #3a2a1a;
        }
        
        .skills-grid {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        
        .skill-item {
            text-align: center;
            width: 30%;
        }
        
        .skill-icon {
            width: 80px;
            height: 80px;
            background: #fff;
            border-radius: 15px;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
        }
        
        .skill-bar {
            height: 8px;
            background: #e0d0b8;
            border-radius: 4px;
            margin-top: 5px;
            position: relative;
        }
        
        .skill-progress {
            height: 100%;
            border-radius: 4px;
            background: linear-gradient(90deg, #8d7456 0%, #5a4a3a 100%);
        }
        
        .two-column {
            display: flex;
            justify-content: space-between;
            gap: 30px;
        }
        
        .column {
            width: 48%;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
            font-size: 12px;
        }
        
        .info-icon {
            width: 20px;
            margin-right: 10px;
            color: #5a4a3a;
        }
        
        .experience-item {
            background: rgba(255, 255, 255, 0.6);
            border-radius: 15px;
            padding: 15px;
            margin: 10px 0;
        }
        
        .experience-duration {
            display: inline-block;
            background: #fff;
            border: 2px solid #5a4a3a;
            border-radius: 20px;
            padding: 5px 15px;
            font-size: 11px;
            margin-bottom: 10px;
        }
        
        .experience-title {
            font-weight: bold;
            font-size: 14px;
            color: #3a2a1a;
            margin: 5px 0;
        }
        
        .experience-desc {
            font-size: 11px;
            line-height: 1.5;
            color: #5a4a3a;
        }
        
        .interest-tag {
            display: inline-block;
            border: 2px solid #5a4a3a;
            border-radius: 20px;
            padding: 8px 20px;
            margin: 5px;
            font-size: 11px;
        }
        
        .section-header {
            background: #5a4a3a;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            display: inline-block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 20px 0 10px 0;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="name">' . htmlspecialchars($cv['full_name'] ?? 'Име') . '</div>
        <h1>PORTFOLIO</h1>
        <div class="subtitle">' . htmlspecialchars($cv['job_title'] ?? 'Graphic Design') . '</div>
    </div>

    <!-- Introduction Section -->
    <div class="profile-section">
        <div class="section-title">INTRODUCTION</div>
        <div style="font-size: 14px; color: #5a4a3a; margin-bottom: 5px;">About Me</div>
        
        <div class="intro-text">
            ' . nl2br(htmlspecialchars($cv['summary'] ?? $cv['objective'] ?? 'Здравейте! Аз съм професионалист с голяма страст към създаването на качествена работа.')) . '
        </div>
        
        <!-- Skills -->
        <div class="section-title" style="margin-top: 20px;">Software Skills</div>
        <div class="skills-grid">';

foreach ($skills as $index => $skill) {
    if ($index < 3) { // Показваме само първите 3 умения
        // Определяме иконка според уменията
        $icon = '🎨'; // По подразбиране
        $skillLower = strtolower($skill['skill']);
        if (strpos($skillLower, 'photoshop') !== false) $icon = 'Ps';
        elseif (strpos($skillLower, 'illustrator') !== false) $icon = 'Ai';
        elseif (strpos($skillLower, 'figma') !== false) $icon = 'Fg';
        elseif (strpos($skillLower, 'code') !== false || strpos($skillLower, 'programming') !== false) $icon = '💻';
        
        $html .= '
            <div class="skill-item">
                <div class="skill-icon">' . $icon . '</div>
                <div style="font-weight: bold; font-size: 14px;">' . htmlspecialchars($skill['skill']) . '</div>
                <div style="font-size: 12px; color: #5a4a3a;">' . htmlspecialchars($skill['level']) . '%</div>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ' . htmlspecialchars($skill['level']) . '%;"></div>
                </div>
            </div>';
    }
}

$html .= '
        </div>
    </div>

    <!-- Contact and Education -->
    <div class="two-column">
        <div class="column">
            <div class="section-header">• CONTACT •</div>
            <div class="info-item">
                <span class="info-icon">📞</span>
                <span>' . htmlspecialchars($cv['phone'] ?? 'N/A') . '</span>
            </div>
            <div class="info-item">
                <span class="info-icon">✉️</span>
                <span>' . htmlspecialchars($cv['email'] ?? 'N/A') . '</span>
            </div>
            <div class="info-item">
                <span class="info-icon">📍</span>
                <span>' . htmlspecialchars($cv['address'] ?? $cv['city'] ?? 'N/A') . '</span>
            </div>
            <div class="info-item">
                <span class="info-icon">💬</span>
                <span>' . htmlspecialchars($cv['linkedin'] ?? $cv['website'] ?? 'N/A') . '</span>
            </div>
        </div>
        
        <div class="column">
            <div class="section-header">• EDUCATION •</div>
            <div style="font-size: 12px; line-height: 1.6; margin-top: 10px;">
                ' . nl2br(htmlspecialchars($educationText ?: 'Образователна информация')) . '
            </div>
        </div>
    </div>

    <!-- Interest and Experience -->
    <div class="two-column">
        <div class="column">
            <div class="section-header">• INTEREST •</div>';

foreach ($interests as $interest) {
    $html .= '<div class="interest-tag">#' . htmlspecialchars($interest['interest_name']) . '</div>';
}

// Ако нямаш интереси, добави езиците
if (empty($interests)) {
    foreach ($languages as $lang) {
        $html .= '<div class="interest-tag">#' . htmlspecialchars($lang['language']) . '</div>';
    }
}

$html .= '
        </div>
        
        <div class="column">
            <div class="section-header">• EXPERIENCE •</div>';

foreach ($experiences as $exp) {
    $html .= '
            <div class="experience-item">
                <div class="experience-duration">' . htmlspecialchars($exp['duration']) . '</div>
                <div class="experience-title">' . htmlspecialchars($exp['position']) . ' | ' . htmlspecialchars($exp['company']) . '</div>
                <div class="experience-desc">' . nl2br(htmlspecialchars($exp['description'])) . '</div>
            </div>';
}

$html .= '
        </div>
    </div>

</body>
</html>';

// Генериране на PDF
$options = new Options();
$options->setIsRemoteEnabled(true);
$options->setDefaultFont('DejaVu Sans');
$dompdf = new Dompdf($options);

$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

$filename = "Portfolio_" . str_replace(' ', '_', $cv['full_name']) . "_" . $cvId . ".pdf";
$dompdf->stream($filename, ["Attachment" => true]); 

?>