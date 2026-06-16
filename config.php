<?php
// config.php
// Function to load .env file manually without external libraries
function loadEnv($path)
{
    if (!file_exists($path)) {
        return;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue; // Skip comments
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Load the .env file located in the same directory
loadEnv(__DIR__ . '/.env');

// Establish PDO connection using environment variables
try {
    $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
    $dbname = $_ENV['DB_NAME'] ?? 'trimlink';
    $user = $_ENV['DB_USER'] ?? 'root';
    $pass = $_ENV['DB_PASS'] ?? '';

    $pdo = new PDO("mysql:host=" . $host . ";dbname=" . $dbname, $user, $pass);
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // For a fresher: We catch the error so it doesn't leak sensitive info, and display a user-friendly message.
    die("ERROR: Could not connect to the database. " . $e->getMessage());
}

// Function to generate a random string for short code
function generateShortCode($length = 6) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $index = rand(0, strlen($characters) - 1);
        $randomString .= $characters[$index];
    }
    return $randomString;
}

// Base URL for the application (e.g., http://localhost/url_shorten/)
// In a real app, you might want to dynamically generate this or define it statically.
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'];
$basePath = dirname($_SERVER['PHP_SELF']) == '/' || dirname($_SERVER['PHP_SELF']) == '\\' ? '' : dirname($_SERVER['PHP_SELF']);
define('BASE_URL', $protocol . $domainName . $basePath);
?>
