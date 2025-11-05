<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// API ключ DeepSeek
$apiKey = 'sk-7f36fac6978e4df0b3ee1e97534d5fc4';

// Получаем query из GET параметра
$userQuery = $_GET['query'] ?? '';
$query = trim(urldecode($userQuery));

if (empty($query)) {
    http_response_code(400);
    echo json_encode(['error' => 'Query parameter is required']);
    exit();
}

// Упрощенный промпт для лучшей стабильности
$prompt = "Пользователь ищет игры по запросу: \"{$query}\". 

Верни ТОЛЬКО JSON без каких-либо дополнительных текстов:

{
    \"analysis\": {
        \"understoodMood\": \"краткое описание настроения\",
        \"recommendedStyle\": \"стиль игр\", 
        \"keyFactors\": [\"фактор1\", \"фактор2\"],
        \"reasoning\": \"краткое объяснение подбора\"
    },
    \"games\": [
        {
            \"name\": \"Название игры 1\",
            \"genre\": \"Жанр\",
            \"description\": \"Описание игры\",
            \"moodMatch\": 0.95,
            \"playtime\": \"Время игры\",
            \"vibe\": \"Атмосфера\",
            \"whyPerfect\": \"Почему подходит\",
            \"platforms\": [\"PC\", \"PS5\"]
        },
        {
            \"name\": \"Название игры 2\", 
            \"genre\": \"Жанр\",
            \"description\": \"Описание игры\",
            \"moodMatch\": 0.90,
            \"playtime\": \"Время игры\", 
            \"vibe\": \"Атмосфера\",
            \"whyPerfect\": \"Почему подходит\",
            \"platforms\": [\"PC\", \"XBOX\"]
        },
        {
            \"name\": \"Название игры 3\",
            \"genre\": \"Жанр\", 
            \"description\": \"Описание игры\",
            \"moodMatch\": 0.85,
            \"playtime\": \"Время игры\",
            \"vibe\": \"Атмосфера\",
            \"whyPerfect\": \"Почему подходит\",
            \"platforms\": [\"PC\", \"Switch\"]
        }
    ]
}";

// Запрос к DeepSeek API
$requestData = [
    'model' => 'deepseek-chat',
    'messages' => [
        [
            'role' => 'user',
            'content' => $prompt
        ]
    ],
    'max_tokens' => 3000,
    'temperature' => 0.7,
    'stream' => false
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.deepseek.com/chat/completions',
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($requestData),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
        'Accept: application/json'
    ],
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => 'GameFinder/1.0'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'API request failed: ' . $error]);
    exit();
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['error' => 'DeepSeek API returned error: ' . $httpCode]);
    exit();
}

// Проверяем JSON
$jsonData = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid JSON from DeepSeek: ' . json_last_error_msg()]);
    exit();
}

// Возвращаем успешный ответ
echo $response;
?>