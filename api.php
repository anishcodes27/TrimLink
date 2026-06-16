<?php
require_once 'config.php';
header('Content-Type: application/json');

$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

if ($action === 'shorten' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $original_url = filter_input(INPUT_POST, 'url', FILTER_SANITIZE_URL);
    if (empty($original_url) || !filter_var($original_url, FILTER_VALIDATE_URL)) {
        echo json_encode(['success' => false, 'message' => 'Please enter a valid URL.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT short_code FROM urls WHERE original_url = ?");
        $stmt->execute([$original_url]);
        $existing = $stmt->fetch();

        if ($existing) {
            $short_code = $existing['short_code'];
        } else {
            $short_code = generateShortCode();
            $stmt = $pdo->prepare("SELECT id FROM urls WHERE short_code = ?");
            while ($stmt->execute([$short_code]) && $stmt->rowCount() > 0) {
                $short_code = generateShortCode();
            }

            $stmt = $pdo->prepare("INSERT INTO urls (original_url, short_code) VALUES (?, ?)");
            $stmt->execute([$original_url, $short_code]);
        }

        $short_url = BASE_URL . '/redirect.php?c=' . $short_code;
        echo json_encode(['success' => true, 'short_url' => $short_url]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error.']);
    }
    exit;
}

if ($action === 'get_dashboard') {
    try {
        $statsStmt = $pdo->query("SELECT COUNT(id) as total_links, COALESCE(SUM(clicks), 0) as total_clicks FROM urls");
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        $mostClickedStmt = $pdo->query("SELECT original_url, clicks FROM urls ORDER BY clicks DESC LIMIT 1");
        $mostClicked = $mostClickedStmt->fetch(PDO::FETCH_ASSOC);
        $mostClickedCount = $mostClicked ? $mostClicked['clicks'] : 0;

        $stmt = $pdo->query("SELECT * FROM urls ORDER BY created_at DESC");
        $urls = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'stats' => [
                'total_links' => $stats['total_links'],
                'total_clicks' => $stats['total_clicks'],
                'most_clicked' => $mostClickedCount
            ],
            'urls' => $urls
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching data.']);
    }
    exit;
}

if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Invalid ID provided.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM urls WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Link not found.']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error.']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action.']);
exit;
