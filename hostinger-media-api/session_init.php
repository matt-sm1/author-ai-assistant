<?php
require __DIR__ . '/lib.php';
media_cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    media_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$ticket = media_read_ticket_from_request();
$paths = media_paths($ticket['storageKey']);
media_assert_under_root($paths['root'], $paths['full']);

if (!is_dir($paths['dir'])) {
    mkdir($paths['dir'], 0755, true);
}

if (is_file($paths['full'])) {
    media_json(['success' => false, 'message' => 'Object already completed'], 409);
}

// Truncate / create empty part file
$fh = fopen($paths['part'], 'c+b');
if ($fh === false) {
    media_json(['success' => false, 'message' => 'Unable to open part file'], 500);
}
ftruncate($fh, 0);
fclose($fh);

$meta = [
    'mediaId' => $ticket['mediaId'],
    'storageKey' => $ticket['storageKey'],
    'maxBytes' => $ticket['maxBytes'],
    'mime' => $ticket['mime'],
    'resourceType' => $ticket['resourceType'],
    'received' => 0,
    'chunks' => 0,
];
file_put_contents($paths['meta'], json_encode($meta));

media_json(['success' => true, 'storageKey' => $ticket['storageKey']]);
