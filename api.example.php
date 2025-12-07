<?php
// EXAMPLE CONFIGURATION FILE
// Rename this file to 'api.php' and fill in your details

ini_set('display_errors', 0);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// --- DATABASE SETTINGS (ENTER YOUR OWN HERE) ---
$host = "YOUR_DB_HOST";      // e.g., sql101.epizy.com
$user = "YOUR_DB_USERNAME";  // e.g., epiz_12345
$dbname = "YOUR_DB_NAME";    // e.g., epiz_12345_neon
$pass = "YOUR_DB_PASSWORD";  // e.g., Xy78b...
// -----------------------------------------------

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    echo json_encode(["error" => "DB Connection Failed"]);
    exit;
}

// ... The rest of your logic goes here (You can copy the logic from your real api.php, just NOT the password section) ...
?>