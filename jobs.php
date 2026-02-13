<?php
// Disable error reporting for public release
// error_reporting(0); 

// --- SETTINGS ---
$token = "apify_api_qDQn1U5W18thP54TJ0Ci18Ex8oNpVN4gGV6H"; // ТВОЯТ токен
$actorId = "worldunboxer~rapid-linkedin-scraper"; 

$filtered = [];
$searchPerformed = false;
$errorMessage = null;

// Function to extract years of experience (Remains unchanged)
function extractExperienceYears($text) {
    if (!$text) return 0;
    $patterns = [
        '/(\d+)\+?\s*years?/i',
        '/(\d+)\s*yrs/i'
    ];
    $maxYears = 0;
    foreach ($patterns as $pattern) {
        if (preg_match_all($pattern, $text, $matches)) {
            foreach ($matches[1] as $m) {
                $maxYears = max($maxYears, (int)$m);
            }
        }
    }
    return $maxYears;
}


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $searchPerformed = true;

    // Input from form
    $country = trim($_POST['country'] ?? '');
    $city = trim($_POST['city'] ?? '');
    $job = trim($_POST['job'] ?? '');
    $experience = (int) ($_POST['experience'] ?? 0);

    // Location formatting
    $location = $city ? "$city, $country" : $country;

    // Prepare input for actor
    $input = [
        "jobs_entries" => 10,
        "location" => $location,
        "start_jobs" => 0
    ];

    // Use the correct synchronous endpoint
    $url = "https://api.apify.com/v2/acts/$actorId/run-sync-get-dataset-items?format=json";

    $ch = curl_init($url);

    // Use Authorization Header for token
    $headers = [
        "Content-Type: application/json",
        "Authorization: Bearer " . $token 
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input));
    curl_setopt($ch, CURLOPT_TIMEOUT, 300); // 5 minutes timeout

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($response === false) {
        $errorMessage = "cURL грешка: " . curl_error($ch);
    } 
    // CORRECTION: Accept 200 AND 201 as success
    elseif ($httpCode !== 200 && $httpCode !== 201) { 
        $errorMessage = "Грешка при извикване на API (HTTP Code: {$httpCode}): " . $response;
    } 
    else {
        // Data is directly in $response
        $results = json_decode($response, true);

        if (!is_array($results)) {
            $errorMessage = "Няма данни от API-то или грешка в JSON: " . $response;
        } else {
            // Filter results
            $filtered = array_filter($results, function($jobOffer) use ($city, $job, $experience, $country) {
                if (!isset($jobOffer['location'], $jobOffer['job_title']) && !isset($jobOffer['job_description'])) {
                    return false;
                }

                $jobLocation = $jobOffer['location'] ?? '';
                $jobTitle = $jobOffer['job_title'] ?? '';
                $jobFunction = $jobOffer['job_function'] ?? '';
                $jobDescription = $jobOffer['job_description'] ?? '';

                // Filter by city
                if (!empty($city) && stripos($jobLocation, $city) === false) {
                    return false;
                }
                // Filter by country
                if (empty($city) && !empty($country) && stripos($jobLocation, $country) === false) {
                     return false;
                }

                // Filter by profession
                if (!empty($job) && stripos($jobTitle, $job) === false && stripos($jobFunction, $job) === false) {
                    return false;
                }

                // Filter by experience
                if ($experience > 0) {
                    $yearsFound = extractExperienceYears($jobDescription);
                    if ($yearsFound < $experience) {
                        return false;
                    }
                }

                return true;
            });
        }
    }
    curl_close($ch);
}
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Търсене на работа</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #E3D7E8;
            color: #333;
            line-height: 1.6;
            position: relative;
        }

        .container {
            max-width: 1000px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            margin-top:-185px;
        }

        h2 {
            color: #09989e;
            border-bottom: 2px solid ;
            padding-bottom: 10px;
            margin-top: 20px;
            margin-bottom: 25px;
            font-size: 2em;
            text-align: center;
        }

        form {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            margin-bottom: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        form div {
            margin-bottom: 10px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #8274A1;
            font-size: 0.95em;
        }

        input[type="text"],
        input[type="number"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #dcdcdc;
            border-radius: 5px;
            box-sizing: border-box;
            font-size: 1em;
            transition: border-color 0.2s ease-in-out;
        }
        input[type="text"]:focus,
        input[type="number"]:focus {
            border-color: #8274A1;
            outline: none;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        button[type="submit"] {
            grid-column: 1 / -1;
            background-color: #8274A1;
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: bold;
            transition: background-color 0.3s ease, transform 0.2s ease;
            margin-top: 15px;
        }

        button[type="submit"]:hover {
            background-color: #09989e;
            transform: translateY(-2px);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            background-color: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            border-radius: 10px;
            overflow: hidden;
            
        
        }

        th, td {
            border: 1px solid #e0e0e0;
            padding: 15px;
            text-align: left;
            vertical-align: top;
            font-size: 0.95em;
        }

        th {
            background-color: #8274A1;
            color: white;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        tr:nth-child(even) {
            background-color: #f6f8fa;
        }

        tr:hover {
            background-color: #ebf5fb;
        }

        a {
            color: #8274A1;
            text-decoration: none;
            font-weight: bold;
            transition: color 0.2s ease;
        }

        a:hover {
            text-decoration: underline;
            color: #8274A1;
        }

        p.no-results, p.error-message {
            margin-top: 20px;
            padding: 15px;
            background-color: #ffe0e0;
            border: 1px solid #ffb3b3;
            color: #cc0000;
            border-radius: 8px;
            font-size: 1.1em;
            text-align: center;
        }
        p.info-message {
            margin-top: 20px;
            padding: 15px;
            background-color: #e0f2f7;
            border: 1px solid #b3e5fc;
            color: #8274A1;
            border-radius: 8px;
            font-size: 1.1em;
            text-align: center;
        }
        .photo{
            margin-left: 55%
       
       
            
        }
        .arrow{
           
            max-width:150px;
            width: 100%;
         
    position: fixed;   /* стои винаги в горния ляв ъгъл */
    top: 20px;
    left: 20px;
    width: 150px;
    z-index: 99999;
}
@media (max-width: 1024px) {
        .container{
            margin-left: 150px;
            margin-right: -100px;
        } 
        .photo{
            margin-left: 65%;

        }

} 
@media (max-width: 768px) {
        .container{
            margin-left: 100px;
            margin-right: -50px;
        } 
        .photo{
            margin-left: 55%;

        }
    }
           
        
    </style>
</head>
<body>
    <img class="photo" src="0-02-05-b2e5265937e32c427cebb5bfeb3ecdb9a5f50602c038f9ffd6b2f32b7d4d1b80_1c8c6fe2f4ce6c07-removebg-preview.png">
     <a href="searching.html"><img class="arrow" src="arrow67.png"></a>
<div class="container">
    <h2>Търсене на работа</h2>

    <form action="" method="POST"> 
        <div>
            <label for="country">Държава:</label>
            <input type="text" id="country" name="country" placeholder="Напр: United States" value="<?= htmlspecialchars($country ?? '') ?>" required>
        </div>
        <div>
            <label for="city">Град (по желание):</label>
            <input type="text" id="city" name="city" placeholder="Напр: Dallas" value="<?= htmlspecialchars($city ?? '') ?>">
        </div>
        <div>
            <label for="job">Професия:</label>
            <input type="text" id="job" name="job" placeholder="Напр: Developer, Nurse, Manager" value="<?= htmlspecialchars($job ?? '') ?>">
        </div>
        <div>
            <label for="experience">Минимални години стаж:</label>
            <input type="number" id="experience" name="experience" placeholder="Напр: 3" min="0" value="<?= htmlspecialchars($experience ?? 0) ?>">
        </div>
        <button type="submit">Търси</button>
    </form>

    <?php if (isset($errorMessage)): ?>
        <p class="error-message">Възникна грешка: <?= htmlspecialchars($errorMessage) ?></p>
    <?php elseif ($searchPerformed): // Show results only if a search was performed ?>
        <h2>Резултати</h2>
        <?php if (empty($filtered)): ?>
            <p class="no-results">Няма намерени резултати, отговарящи на вашите критерии.</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Компания</th>
                        <th>Позиция</th>
                        <th>Локация</th>
                        <th>Стаж</th>
                        <th>Обява</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($filtered as $item): ?>
                        <?php 
                            $companyName = htmlspecialchars($item['company_name'] ?? 'N/A');
                            $jobTitle = htmlspecialchars($item['job_title'] ?? 'N/A');
                            $locationDisplay = htmlspecialchars($item['location'] ?? 'N/A');
                            $applyUrl = htmlspecialchars($item['apply_url'] ?? '#');
                            $jobDescription = $item['job_description'] ?? '';
                            $yearsFound = extractExperienceYears($jobDescription);
                        ?>
                        <tr>
                            <td><?= $companyName ?></td>
                            <td><?= $jobTitle ?></td>
                            <td><?= $locationDisplay ?></td>
                            <td><?= $yearsFound > 0 ? "{$yearsFound} години" : "Неуточнено" ?></td>
                            <td>
                                <?php if ($applyUrl !== '#'): ?>
                                    <a href="<?= $applyUrl ?>" target="_blank">Отвори</a>
                                <?php else: ?>
                                    Не е налична
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    <?php else: // If the page is loaded for the first time ?>
         <p class="info-message">Моля, въведете критерии за търсене на работа.</p>
    <?php endif; ?>
</div>
</body>
</html>