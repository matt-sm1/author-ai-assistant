<?php

function media_config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $path = __DIR__ . '/config.php';
        if (!is_file($path)) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'config.php missing']);
            exit;
        }
        $cfg = require $path;
    }
    return $cfg;
}

function media_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function media_cors(): void
{
    $cfg = media_config();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = array_filter(array_map('trim', explode(',', $cfg['cors_origins'] ?? '')));

    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Upload-Ticket, X-Chunk-Index, X-Content-Sha256');
        header('Access-Control-Max-Age: 600');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function media_canonical(array $fields): string
{
    ksort($fields);
    $parts = [];
    foreach ($fields as $k => $v) {
        $parts[] = $k . '=' . $v;
    }
    return implode("\n", $parts);
}

function media_sign(array $fields): string
{
    $cfg = media_config();
    return hash_hmac('sha256', media_canonical($fields), $cfg['signing_secret']);
}

function media_safe_eq(string $a, string $b): bool
{
    return hash_equals($a, $b);
}

function media_verify_ticket(array $ticket): array
{
    $fields = [
        'mediaId' => (string)($ticket['mediaId'] ?? ''),
        'storageKey' => (string)($ticket['storageKey'] ?? ''),
        'maxBytes' => (string)($ticket['maxBytes'] ?? ''),
        'mime' => (string)($ticket['mime'] ?? ''),
        'resourceType' => (string)($ticket['resourceType'] ?? ''),
        'exp' => (string)($ticket['exp'] ?? ''),
        'nonce' => (string)($ticket['nonce'] ?? ''),
    ];

    $sig = (string)($ticket['sig'] ?? '');
    if (!media_safe_eq(media_sign($fields), $sig)) {
        media_json(['success' => false, 'message' => 'Invalid upload ticket signature'], 401);
    }

    $exp = (int)$fields['exp'];
    if ($exp < time()) {
        media_json(['success' => false, 'message' => 'Upload ticket expired'], 401);
    }

    $maxBytes = (int)$fields['maxBytes'];
    if ($maxBytes <= 0) {
        media_json(['success' => false, 'message' => 'Invalid ticket maxBytes'], 400);
    }

    if (!preg_match('#^media/\d{4}/\d{2}/[0-9A-HJKMNP-TV-Z]{26}\.[a-z0-9]+$#', $fields['storageKey'])) {
        media_json(['success' => false, 'message' => 'Invalid storage key'], 400);
    }

    $cfg = media_config();
    if (!in_array($fields['mime'], $cfg['allowed_mimes'], true)) {
        media_json(['success' => false, 'message' => 'MIME not allowed'], 400);
    }

    return [
        'mediaId' => $fields['mediaId'],
        'storageKey' => $fields['storageKey'],
        'maxBytes' => $maxBytes,
        'mime' => $fields['mime'],
        'resourceType' => $fields['resourceType'],
        'exp' => $exp,
        'nonce' => $fields['nonce'],
    ];
}

function media_read_ticket_from_request(): array
{
    $header = $_SERVER['HTTP_X_UPLOAD_TICKET'] ?? '';
    if ($header !== '') {
        $decoded = json_decode($header, true);
        if (is_array($decoded)) {
            return media_verify_ticket($decoded);
        }
    }

    $raw = file_get_contents('php://input');
    // For multipart, ticket may be in POST field
    if (!empty($_POST['ticket'])) {
        $decoded = json_decode($_POST['ticket'], true);
        if (is_array($decoded)) {
            return media_verify_ticket($decoded);
        }
        if (is_string($_POST['ticket'])) {
            // already array via form fields? try json
        }
    }

    media_json(['success' => false, 'message' => 'Missing upload ticket'], 401);
}

/**
 * Storage keys look like media/YYYY/MM/file.ext (public URL path).
 * media_root is already .../public_html/media, so strip the leading media/
 * segment when building the filesystem path — otherwise files land at
 * media/media/YYYY/... while URLs point at /media/YYYY/...
 */
function media_relative_under_root(string $storageKey): string
{
    $relative = str_replace('\\', '/', $storageKey);
    if (strpos($relative, 'media/') === 0) {
        return substr($relative, strlen('media/'));
    }
    return $relative;
}

function media_paths(string $storageKey): array
{
    $cfg = media_config();
    $root = realpath($cfg['media_root']);
    if ($root === false) {
        if (!mkdir($cfg['media_root'], 0755, true) && !is_dir($cfg['media_root'])) {
            media_json(['success' => false, 'message' => 'media_root unavailable'], 500);
        }
        $root = realpath($cfg['media_root']);
    }

    $underRoot = media_relative_under_root($storageKey);
    $full = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $underRoot);

    // Legacy uploads were written with a double "media/" nest; prefer that path if present.
    $legacyRelative = str_replace('\\', '/', $storageKey);
    $legacyFull = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $legacyRelative);
    if (
        !file_exists($full) &&
        !file_exists($full . '.part') &&
        (file_exists($legacyFull) || file_exists($legacyFull . '.part'))
    ) {
        $full = $legacyFull;
    }

    $dir = dirname($full);
    $part = $full . '.part';
    $meta = $full . '.meta.json';

    return [
        'root' => $root,
        'full' => $full,
        'dir' => $dir,
        'part' => $part,
        'meta' => $meta,
    ];
}

function media_assert_under_root(string $root, string $path): void
{
    $realRoot = realpath($root);
    $parent = dirname($path);
    if (!is_dir($parent)) {
        mkdir($parent, 0755, true);
    }
    $realParent = realpath($parent);
    if ($realRoot === false || $realParent === false || strpos($realParent, $realRoot) !== 0) {
        media_json(['success' => false, 'message' => 'Path escape denied'], 400);
    }
}

function media_issue_receipt(array $ticket, int $bytes, string $sha256, $width, $height, string $format): array
{
    $fields = [
        'mediaId' => $ticket['mediaId'],
        'storageKey' => $ticket['storageKey'],
        'bytes' => (string)$bytes,
        'sha256' => strtolower($sha256),
        'width' => $width === null ? '' : (string)$width,
        'height' => $height === null ? '' : (string)$height,
        'format' => $format,
        'resourceType' => $ticket['resourceType'],
        'exp' => (string)(time() + 900),
    ];
    $fields['sig'] = media_sign($fields);
    return $fields;
}

function media_verify_delete_token(array $token): string
{
    $fields = [
        'storageKey' => (string)($token['storageKey'] ?? ''),
        'exp' => (string)($token['exp'] ?? ''),
        'op' => 'delete',
    ];
    if (!media_safe_eq(media_sign($fields), (string)($token['sig'] ?? ''))) {
        media_json(['success' => false, 'message' => 'Invalid delete token'], 401);
    }
    if ((int)$fields['exp'] < time()) {
        media_json(['success' => false, 'message' => 'Delete token expired'], 401);
    }
    if (!preg_match('#^media/\d{4}/\d{2}/[0-9A-HJKMNP-TV-Z]{26}\.[a-z0-9]+$#', $fields['storageKey'])) {
        media_json(['success' => false, 'message' => 'Invalid storage key'], 400);
    }
    return $fields['storageKey'];
}

function media_ext(string $storageKey): string
{
    $pos = strrpos($storageKey, '.');
    return $pos === false ? 'bin' : substr($storageKey, $pos + 1);
}
