<style>
    /* CSS за класическия (default) дизайн */
    body { font-family: 'DejaVu Sans', sans-serif; margin: 0; padding: 30px; font-size: 10pt; color: #333; }
    h1 { color: #2C3E50; border-bottom: 3px solid #3498DB; padding-bottom: 5px; margin-top: 0; font-size: 1.8em; }
    h2 { color: #34495E; font-size: 1.2em; margin-top: 20px; border-bottom: 1px solid #BDC3C7; padding-bottom: 3px;}
    .section { margin-bottom: 15px; }
    p { margin: 0 0 5px 0; line-height: 1.4; }
    .contact-info p { display: inline-block; margin-right: 20px; }
    strong { font-weight: bold; }
</style>
<div class="cv-container">
    <h1><?= htmlspecialchars($data['fullName']) ?></h1>
    
    <div class="contact-info">
        <p><i style="font-style: normal; margin-right: 5px;">&#9993;</i> <strong>Имейл:</strong> <?= htmlspecialchars($data['email']) ?></p>
        <p><i style="font-style: normal; margin-right: 5px;">&#9742;</i> <strong>Телефон:</strong> <?= htmlspecialchars($data['phone']) ?></p>
    </div>

    <?php if (!empty($data['education'])): ?>
        <div class="section">
            <h2>Образование</h2>
            <p><?= nl2br(htmlspecialchars($data['education'])) ?></p>
        </div>
    <?php endif; ?>

    <?php if (!empty($data['experience'])): ?>
        <div class="section">
            <h2>Професионален Опит/Проекти</h2>
            <p><?= nl2br(htmlspecialchars($data['experience'])) ?></p>
        </div>
    <?php endif; ?>
</div>