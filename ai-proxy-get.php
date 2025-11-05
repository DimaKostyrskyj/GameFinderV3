<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Твой API ключ
$apiKey = 'sk-7f36fac6978e4df0b3ee1e97534d5fc4';

// Получаем query из GET параметра
$userQuery = $_GET['query'] ?? '';
$query = urldecode($userQuery);

if (empty($query)) {
    http_response_code(400);
    echo json_encode(['error' => 'Query parameter is required']);
    exit();
}

// Промпт для AI
$prompt = "Пользователь ищет игры по запросу: \"{$query}\". 

Проанализируй запрос и предложи 3-4 самые релевантные игры. 

Верни ответ ТОЛЬКО в формате JSON:

{
    \"analysis\": {
        \"understoodMood\": \"какое настроение понял из запроса\",
        \"recommendedStyle\": \"рекомендуемый стиль игр\", 
        \"keyFactors\": [\"фактор1\", \"фактор2\", \"фактор3\"],
        \"reasoning\": \"объяснение почему подобраны эти игры\"
    },
    \"games\": [
        {
            \"name\": \"название игры\",
            \"genre\": \"жанр\",
            \"description\": \"описание игры\",
            \"moodMatch\": 0.95,
            \"playtime\": \"время игры\",
            \"vibe\": \"атмосфера\",
            \"whyPerfect\": \"почему идеально подходит\",
            \"platforms\": [\"PC\", \"PS5\", \"XBOX\"]
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
    'max_tokens' => 4000,
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

// Проверяем, что ответ - валидный JSON
$jsonResponse = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid JSON response from DeepSeek API']);
    exit();
}

http_response_code($httpCode);
echo $response;
?>