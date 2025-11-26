<style>
    body { 
        font-family: 'DejaVu Sans', sans-serif; 
        margin: 0; 
        padding: 0; 
        font-size: 10pt; 
        color: #333; 
    }
    .cv-wrapper {
        display: table;
        width: 100%;
        height: 100%;
    }
    .left-column {
        display: table-cell;
        width: 35%;
        background-color: #17a2b8;
        color: white;
        padding: 40px 25px;
        vertical-align: top;
    }
    .right-column {
        display: table-cell;
        width: 65%;
        padding: 40px 30px;
        vertical-align: top;
    }
    .profile-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(180deg, #e3f2fd 0%, #a5d6a7 100%);
        margin: 0 auto 30px;
        border: 5px solid rgba(255,255,255,0.3);
    }
    .contact-section h3, .skills-section h3 {
        font-size: 1.1em;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 2px solid rgba(255,255,255,0.3);
    }
    .contact-item {
        margin-bottom: 12px;
        font-size: 9pt;
        line-height: 1.5;
    }
    .contact-icon {
        display: inline-block;
        width: 20px;
        margin-right: 8px;
    }
    .skill-item {
        margin-bottom: 15px;
    }
    .skill-name {
        font-size: 9pt;
        margin-bottom: 5px;
    }
    .skill-bar {
        height: 8px;
        background-color: rgba(255,255,255,0.3);
        border-radius: 4px;
        overflow: hidden;
    }
    .skill-fill {
        height: 100%;
        background-color: white;
        width: 85%;
    }
    .main-name {
        font-size: 2em;
        font-weight: bold;
        color: #2C3E50;
        margin: 0 0 5px 0;
    }
    .main-title {
        font-size: 1.2em;
        color: #666;
        margin: 0 0 30px 0;
    }
    .section-header {
        background-color: #e8d4f8;
        color: #2C3E50;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 1em;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 20px;
    }
    .entry {
        margin-bottom: 20px;
    }
    .entry-title {
        font-weight: bold;
        color: #2C3E50;
        font-size: 1em;
        margin-bottom: 3px;
    }
    .entry-period {
        color: #666;
        font-size: 9pt;
        margin-bottom: 5px;
    }
    .entry-institution {
        color: #8b5cf6;
        font-size: 9pt;
        font-weight: bold;
        margin-bottom: 5px;
    }
    .entry-description {
        color: #666;
        font-size: 9pt;
        line-height: 1.4;
    }
</style>

<div class="cv-wrapper">
    <div class="left-column">
        <div class="profile-circle"></div>
        
        <div class="contact-section">
            <h3>&#128100; Контакт</h3>
            
            <div class="contact-item">
                <span class="contact-icon">&#9742;</span>
                <?= htmlspecialchars($data['phone']) ?>
            </div>
            <div class="contact-item">
                <span class="contact-icon">&#128231;</span>
                <?= htmlspecialchars($data['email']) ?>
            </div>
            <?php if (!empty($data['website'])): ?>
            <div class="contact-item">
                <span class="contact-icon">&#127760;</span>
                <?= htmlspecialchars($data['website']) ?>
            </div>
            <?php endif; ?>
        </div>

        <div class="skills-section" style="margin-top: 30px;">
            <h3>&#9881; Умения</h3>
            <?php 
            $skills = $data['skills'] ?? ['Управление на Проекти', 'Решаване на Проблеми', 'Креативност', 'Лидерство'];
            foreach ($skills as $skill): 
            ?>
            <div class="skill-item">
                <div class="skill-name"><?= htmlspecialchars($skill) ?></div>
                <div class="skill-bar">
                    <div class="skill-fill"></div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="right-column">
        <h1 class="main-name"><?= htmlspecialchars($data['fullName']) ?></h1>
        <div class="main-title"><?= htmlspecialchars($data['jobTitle'] ?? 'Professional Designer') ?></div>

        <?php if (!empty($data['education'])): ?>
        <div class="section">
            <div class="section-header">&#127891; Образование</div>
            <?php 
            $educationEntries = is_array($data['education']) ? $data['education'] : [['description' => $data['education']]];
            foreach ($educationEntries as $edu): 
            ?>
            <div class="entry">
                <div class="entry-title"><?= htmlspecialchars($edu['education'] ?? '') ?></div>
                <div class="entry-period"><?= htmlspecialchars($edu['education'] ?? '') ?></div>
                <div class="entry-institution"><?= htmlspecialchars($edu['education'] ?? '') ?></div>
                <div class="entry-description"><?= nl2br(htmlspecialchars($edu['description'] ?? $data['education'])) ?></div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <?php if (!empty($data['experience'])): ?>
        <div class="section">
            <div class="section-header">&#128188; Професионален Опит</div>
            <?php 
            $experienceEntries = is_array($data['experience']) ? $data['experience'] : [['description' => $data['experience']]];
            foreach ($experienceEntries as $exp): 
            ?>
            <div class="entry">
                <div class="entry-title"><?= htmlspecialchars($exp['experience'] ?? '') ?></div>
                <div class="entry-period"><?= htmlspecialchars($exp['experience'] ?? '') ?></div>
                <div class="entry-institution"><?= htmlspecialchars($exp['experience'] ?? '') ?></div>
                <div class="entry-description"><?= nl2br(htmlspecialchars($exp['description'] ?? $data['experience'])) ?></div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</div>