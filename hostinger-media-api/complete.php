<?php
require __DIR__ . '/lib.php';
media_cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    media_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '[]', true);
if (!is_array($body)) {
    media_json(['success' => false, 'message' => 'Invalid JSON'], 400);
}

$ticket = media_verify_ticket($body['ticket'] ?? []);
$expectedSha = strtolower((string)($body['sha256'] ?? ''));
if (!preg_match('/^[a-f0-9]{64}$/', $expectedSha)) {
    media_json(['success' => false, 'message' => 'Invalid sha256'], 400);
}

$paths = media_paths($ticket['storageKey']);
media_assert_under_root($paths['root'], $paths['full']);

if (is_file($paths['full'])) {
    // Idempotent complete
    $bytes = filesize($paths['full']);
    $sha = hash_file('sha256', $paths['full']);
    if (!hash_equals($expectedSha, $sha)) {
        media_json(['success' => false, 'message' => 'Checksum mismatch on existing object'], 409);
    }
    $width = null;
    $height = null;
    if ($ticket['resourceType'] === 'image') {
        $info = @getimagesize($paths['full']);
        if (is_array($info)) {
            $width = $info[0] ?? null;
            $height = $info[1] ?? null;
        }
    }
    $receipt = media_issue_receipt($ticket, (int)$bytes, $sha, $width, $height, media_ext($ticket['storageKey']));
    media_json(['success' => true, 'receipt' => $receipt]);
}

if (!is_file($paths['part'])) {
    media_json(['success' => false, 'message' => 'Part file missing'], 400);
}

$bytes = filesize($paths['part']);
if ($bytes <= 0 || $bytes > $ticket['maxBytes']) {
    @unlink($paths['part']);
    @unlink($paths['meta']);
    media_json(['success' => false, 'message' => 'Invalid part size'], 400);
}

$sha = hash_file('sha256', $paths['part']);
if (!hash_equals($expectedSha, $sha)) {
    media_json(['success' => false, 'message' => 'Checksum mismatch'], 400);
}

if (!rename($paths['part'], $paths['full'])) {
    media_json(['success' => false, 'message' => 'Unable to finalize object'], 500);
}
@unlink($paths['meta']);

$width = null;
$height = null;
if ($ticket['resourceType'] === 'image') {
    $info = @getimagesize($paths['full']);
    if (is_array($info)) {
        $width = $info[0] ?? null;
        $height = $info[1] ?? null;
    }
}

$receipt = media_issue_receipt(
    $ticket,
    (int)$bytes,
    $sha,
    $width,
    $height,
    media_ext($ticket['storageKey'])
);

media_json(['success' => true, 'receipt' => $receipt]);
