<?php
// Включить вывод ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Установить заголовки CORS
header('Access-Control-Allow-Origin: https://www.gamefinders.org');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Обработать preflight запрос
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// API ключ DeepSeek
$apiKey = 'sk-7f36fac6978e4df0b3ee1e97534d5fc4';

// Получить тип запроса
$action = $_GET['action'] ?? '';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Обработка POST запроса
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if ($action === 'deepseek') {
            handleDeepSeekRequest($data, $apiKey);
        } else {
            throw new Exception('Unknown action');
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Обработка GET запроса
        if ($action === 'deepseek') {
            $query = $_GET['query'] ?? '';
            handleDeepSeekGetRequest($query, $apiKey);
        } else {
            throw new Exception('Unknown action');
        }
    } else {
        throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

function handleDeepSeekRequest($data, $apiKey) {
    if (!$data) {
        throw new Exception('No data received');
    }
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://api.deepseek.com/chat/completions',
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception('API request failed: ' . $error);
    }
    
    http_response_code($httpCode);
    echo $response;
}

function handleDeepSeekGetRequest($query, $apiKey) {
    if (empty($query)) {
        throw new Exception('Query parameter is required');
    }
    
    $prompt = createGameSearchPrompt($query);
    
    $requestData = [
        'model' => 'deepseek-chat',
        'messages' => [
            ['role' => 'user', 'content' => $prompt]
        ],
        'max_tokens' => 4000,
        'temperature' => 0.7
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
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($httpCode);
    echo $response;
}

function createGameSearchPrompt($query) {
    return "Пользователь ищет игры по запросу: \"{$query}\". 

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
}
?>