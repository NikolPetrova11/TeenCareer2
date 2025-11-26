<?php
session_start();

require 'vendor/autoload.php'; 

use Dompdf\Dompdf;
use Dompdf\Options;

// --- Премахната е логиката за свързване с базата данни ---

// Вземаме ID-то, което се изпраща, но го използваме само за генериране на името на файла
$portfolioId = $_GET['id'] ?? 'Guest';

// Статични/Примерни данни за гост потребител:
$displayName = "Гост Потребител";
$contactEmail = "guest@teencareer.bg";
$contactPhone = "N/A";

// HTML за PDF със статични данни
$html = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        /* ... Вашите CSS стилове остават същите ... */
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
        .column { width: 48%; }
        .info-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
            font-size: 12px;
        }
        .info-icon {
            width: 20px;
            margin-right: 10px;
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
        .interest-tag {
            display: inline-block;
            border: 2px solid #5a4a3a;
            border-radius: 20px;
            padding: 8px 20px;
            margin: 5px;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">' . htmlspecialchars($displayName) . '</div>
        <h1>PORTFOLIO</h1>
        <div class="subtitle">Примерен Дизайн</div>
    </div>

    <div class="profile-section">
        <div class="section-title">INTRODUCTION</div>
        <div style="font-size: 14px; color: #5a4a3a; margin-bottom: 5px;">About Me</div>
        
        <div class="intro-text">
            Здравейте! Аз съм **Гост Потребител**. Този PDF е генериран с примерни данни. За да създадете персонализирано портфолио, моля, регистрирайте се и попълнете профила си!
        </div>
        
        <div class="section-title" style="margin-top: 20px;">Software Skills</div>
        <div class="skills-grid">
            <div class="skill-item">
                <div class="skill-icon">Ps</div>
                <div style="font-weight: bold; font-size: 14px;">Photoshop</div>
                <div style="font-size: 12px; color: #5a4a3a;">75%</div>
                <div class="skill-bar"><div class="skill-progress" style="width: 75%;"></div></div>
            </div>
            <div class="skill-item">
                <div class="skill-icon">Ai</div>
                <div style="font-weight: bold; font-size: 14px;">Illustrator</div>
                <div style="font-size: 12px; color: #5a4a3a;">85%</div>
                <div class="skill-bar"><div class="skill-progress" style="width: 85%;"></div></div>
            </div>
            <div class="skill-item">
                <div class="skill-icon">Fg</div>
                <div style="font-weight: bold; font-size: 14px;">Figma</div>
                <div style="font-size: 12px; color: #5a4a3a;">80%</div>
                <div class="skill-bar"><div class="skill-progress" style="width: 80%;"></div></div>
            </div>
        </div>
    </div>

    <div class="two-column">
        <div class="column">
            <div class="section-header">• CONTACT •</div>
            <div class="info-item">
                <span class="info-icon">📞</span>
                <span>' . htmlspecialchars($contactPhone) . '</span>
            </div>
            <div class="info-item">
                <span class="info-icon">✉️</span>
                <span>' . htmlspecialchars($contactEmail) . '</span>
            </div>
            <div class="info-item">
                <span class="info-icon">📅</span>
                <span>N/A</span>
            </div>
            <div class="info-item">
                <span class="info-icon">👤</span>
                <span>' . htmlspecialchars($displayName) . '</span>
            </div>
        </div>
        
        <div class="column">
            <div class="section-header">• EDUCATION •</div>
            <div style="font-size: 12px; line-height: 1.6; margin-top: 10px;">
                <strong>Примерна Гимназия</strong><br>
                Специалност: Графичен дизайн<br>
                2020 - 2025
            </div>
        </div>
    </div>

    <div class="two-column">
        <div class="column">
            <div class="section-header">• INTEREST •</div>
            <div class="interest-tag">#design</div>
            <div class="interest-tag">#creative</div>
            <div class="interest-tag">#art</div>
            <div class="interest-tag">#photography</div>
        </div>
        
        <div class="column">
            <div class="section-header">• EXPERIENCE •</div>
            <div style="font-size: 11px; padding: 10px; background: rgba(255,255,255,0.6); border-radius: 15px;">
                <strong>Примерен Дизайнер</strong><br>
                2023 - Настояще<br><br>
                Работа по различни проекти включващи лого дизайн, банери, социални медии и уеб дизайн.
            </div>
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

$filename = "Portfolio_" . str_replace(' ', '_', $displayName) . ".pdf";
$dompdf->stream($filename, ["Attachment" => true]);
?>