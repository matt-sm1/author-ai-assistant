<?php
require __DIR__ . '/lib.php';
media_cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    media_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$headerTicket = $_SERVER['HTTP_X_UPLOAD_TICKET'] ?? '';
$ticketData = json_decode($headerTicket, true);
if (!is_array($ticketData)) {
    media_json(['success' => false, 'message' => 'Missing upload ticket'], 401);
}
$ticket = media_verify_ticket($ticketData);

$chunkIndex = (int)($_SERVER['HTTP_X_CHUNK_INDEX'] ?? -1);
if ($chunkIndex < 0) {
    media_json(['success' => false, 'message' => 'Missing chunk index'], 400);
}

$paths = media_paths($ticket['storageKey']);
media_assert_under_root($paths['root'], $paths['full']);

if (!is_file($paths['part']) || !is_file($paths['meta'])) {
    media_json(['success' => false, 'message' => 'Upload session not initialized'], 400);
}

$meta = json_decode((string)file_get_contents($paths['meta']), true) ?: [];
$received = (int)($meta['received'] ?? 0);

$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
if ($contentLength <= 0) {
    media_json(['success' => false, 'message' => 'Empty chunk'], 400);
}

if ($received + $contentLength > $ticket['maxBytes']) {
    media_json(['success' => false, 'message' => 'Chunk exceeds declared size'], 413);
}

$in = fopen('php://input', 'rb');
$out = fopen($paths['part'], 'ab');
if ($in === false || $out === false) {
    media_json(['success' => false, 'message' => 'Unable to write chunk'], 500);
}

$written = stream_copy_to_stream($in, $out);
fclose($in);
fclose($out);

if ($written === false) {
    media_json(['success' => false, 'message' => 'Chunk write failed'], 500);
}

$meta['received'] = $received + (int)$written;
$meta['chunks'] = (int)($meta['chunks'] ?? 0) + 1;
$meta['lastChunkIndex'] = $chunkIndex;
file_put_contents($paths['meta'], json_encode($meta));

media_json([
    'success' => true,
    'received' => $meta['received'],
    'chunkIndex' => $chunkIndex,
]);
