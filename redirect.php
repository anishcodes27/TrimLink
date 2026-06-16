<?php
require_once 'config.php';

// Check if a short code is provided in the URL query string
if (isset($_GET['c']) && !empty($_GET['c'])) {
    $short_code = filter_input(INPUT_GET, 'c', FILTER_SANITIZE_STRING);

    try {
        // Find the original URL
        $stmt = $pdo->prepare("SELECT id, original_url FROM urls WHERE short_code = ?");
        $stmt->execute([$short_code]);
        $urlData = $stmt->fetch();

        if ($urlData) {
            // Increment the click count
            $updateStmt = $pdo->prepare("UPDATE urls SET clicks = clicks + 1 WHERE id = ?");
            $updateStmt->execute([$urlData['id']]);

            // Redirect to the original URL
            header("Location: " . $urlData['original_url'], true, 301);
            exit;
        } else {
            $error = "Link not found or has been removed.";
        }
    } catch (PDOException $e) {
        $error = "Database error occurred.";
    }
} else {
    // No code provided, redirect to home
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Not Found - TrimLink</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body class="min-h-screen flex items-center justify-center flex-col text-center p-4">
    <div class="glass-card p-10 rounded-2xl max-w-md w-full">
        <svg class="w-20 h-20 text-red-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <h1 class="text-3xl font-bold mb-4">Oops!</h1>
        <p class="text-slate-400 mb-8"><?php echo isset($error) ? htmlspecialchars($error) : "Invalid link."; ?></p>
        <a href="index.php" class="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-colors">Go to Homepage</a>
    </div>
</body>
</html>
