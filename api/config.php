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
    // Vercel populates getenv() and $_SERVER reliably
    function getEnvSafe($key, $default) {
        $val = getenv($key);
        if ($val !== false && $val !== '') return $val;
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
        return $default;
    }

    $host = getEnvSafe('DB_HOST', '127.0.0.1');
    $port = getEnvSafe('DB_PORT', '3306');
    $dbname = getEnvSafe('DB_NAME', 'trimlink');
    $user = getEnvSafe('DB_USER', 'root');
    $pass = getEnvSafe('DB_PASS', '');

    $pdo = new PDO("mysql:host=" . $host . ";port=" . $port . ";dbname=" . $dbname, $user, $pass);
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
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

// Base URL — just protocol + host, no subfolder path needed.
// Works correctly for both local (localhost:8000) and Vercel (trimlink.vercel.app)
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'];
define('BASE_URL', $protocol . $domainName);
?>
