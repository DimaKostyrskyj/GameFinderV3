<?php
header('Access-Control-Allow-Origin: https://www.gamefinders.org');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$allowedEndpoints = [
    'ISteamApps/GetAppList/v2/',
    'api/appdetails'
];

$endpoint = $_GET['endpoint'] ?? '';

// Проверяем разрешенные endpoint'ы
if (!in_array($endpoint, $allowedEndpoints)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid endpoint']);
    exit;
}

// Обработка Steam API
$url = 'https://api.steampowered.com/' . $endpoint;

// Добавляем параметры для appdetails
if ($endpoint === 'api/appdetails') {
    $appId = $_GET['appid'] ?? '';
    $currency = $_GET['cc'] ?? 'us';
    $url = "https://store.steampowered.com/api/appdetails?appids={$appId}&cc={$currency}&filters=price_overview";
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;
?>