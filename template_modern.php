<style>
    /* CSS за модерния дизайн (две колони) */
    body { font-family:'DejaVu Sans',  sans-serif; margin: 0; padding: 0; font-size: 10pt; }
    .cv-wrap { display: flex; width: 100%; }
    .sidebar { width: 30%; background-color: #E6E6FA; padding: 20px 10px; color: #333; height: 100%; float: left; }
    .main-content { width: 65%; padding: 20px; float: right; }
    h1 { color: #483D8B; font-size: 1.5em; border-bottom: none; margin-bottom: 10px; }
    h2 { color: #483D8B; font-size: 1.1em; border-bottom: 2px solid #483D8B; padding-bottom: 3px; margin-top: 20px; }
    p { margin: 0 0 5px 0; line-height: 1.4; }
    /* Тъй като Dompdf не работи добре с чист flex/grid, използваме float */
</style>
<div class="cv-wrap">
    <div class="sidebar">
        <h1><?= htmlspecialchars($data['fullName']) ?></h1>
        <p style="margin-top: 15px;"><i style="font-style: normal; margin-right: 5px;">&#9993;</i> <?= htmlspecialchars($data['email']) ?></p>
        <p><i style="font-style: normal; margin-right: 5px;">&#9742;</i> <?= htmlspecialchars($data['phone']) ?></p>
    </div>
    <div class="main-content">
        <?php if (!empty($data['education'])): ?>
            <h2>Образование</h2>
            <p><?= nl2br(htmlspecialchars($data['education'])) ?></p>
        <?php endif; ?>
        
        <?php if (!empty($data['experience'])): ?>
            <h2>Професионален Опит</h2>
            <p><?= nl2br(htmlspecialchars($data['experience'])) ?></p>
        <?php endif; ?>
    </div>
</div>