<?php
require __DIR__ . '/lib.php';
media_cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    media_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    media_json(['success' => false, 'message' => 'file is required'], 400);
}

$ticketRaw = $_POST['ticket'] ?? ($_SERVER['HTTP_X_UPLOAD_TICKET'] ?? '');
$ticketData = is_string($ticketRaw) ? json_decode($ticketRaw, true) : null;
if (!is_array($ticketData)) {
    media_json(['success' => false, 'message' => 'Missing upload ticket'], 401);
}
$ticket = media_verify_ticket($ticketData);

$file = $_FILES['file'];
$size = (int)$file['size'];
if ($size <= 0 || $size > $ticket['maxBytes']) {
    media_json(['success' => false, 'message' => 'Invalid file size'], 413);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$detected = $finfo->file($file['tmp_name']) ?: '';
if ($detected !== $ticket['mime']) {
    // allow jpeg alias
    $aliases = [
        'image/jpg' => 'image/jpeg',
    ];
    $normalized = $aliases[$detected] ?? $detected;
    if ($normalized !== $ticket['mime']) {
        media_json(['success' => false, 'message' => 'MIME mismatch'], 400);
    }
}

$paths = media_paths($ticket['storageKey']);
media_assert_under_root($paths['root'], $paths['full']);
if (!is_dir($paths['dir'])) {
    mkdir($paths['dir'], 0755, true);
}

if (is_file($paths['full'])) {
    $sha = hash_file('sha256', $paths['full']);
    $bytes = filesize($paths['full']);
} else {
    if (!move_uploaded_file($file['tmp_name'], $paths['full'])) {
        media_json(['success' => false, 'message' => 'Unable to store file'], 500);
    }
    $sha = hash_file('sha256', $paths['full']);
    $bytes = filesize($paths['full']);
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

$receipt = media_issue_receipt(
    $ticket,
    (int)$bytes,
    $sha,
    $width,
    $height,
    media_ext($ticket['storageKey'])
);

media_json(['success' => true, 'receipt' => $receipt]);
