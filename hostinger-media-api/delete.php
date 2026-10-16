<?php
require __DIR__ . '/lib.php';

// Server-to-server; no browser CORS required
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    media_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '[]', true);
if (!is_array($body) || empty($body['token'])) {
    media_json(['success' => false, 'message' => 'token required'], 400);
}

$storageKey = media_verify_delete_token($body['token']);
$paths = media_paths($storageKey);

$removed = false;
foreach ([$paths['full'], $paths['part'], $paths['meta']] as $path) {
    if (is_file($path)) {
        @unlink($path);
        $removed = true;
    }
}

if (!$removed) {
    media_json(['success' => true, 'result' => 'not found']);
}

media_json(['success' => true, 'result' => 'ok']);
