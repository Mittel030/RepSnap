<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('DB_HOST', 'mysql_db');
define('DB_USER', 'repsnap');
define('DB_PASS', 'repsnap123');
define('DB_NAME', 'repsnap');

function db(): PDO {
    static $pdo;
    if (!$pdo) {
        $pdo = new PDO(
            'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    }
    return $pdo;
}

function uid(): string { return bin2hex(random_bytes(8)); }
function ts(): int     { return (int)(microtime(true) * 1000); }
function body(): array { return json_decode(file_get_contents('php://input'), true) ?? []; }

function ok(mixed $data): never {
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

function err(string $msg, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

function get_token(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION']
      ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
      ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? '') : '')
      ?? '';
    return str_starts_with($h, 'Bearer ') ? substr($h, 7) : null;
}

function auth_required(): string {
    $token = get_token();
    if (!$token) err('Niet ingelogd.', 401);
    $s = db()->prepare('SELECT user_id FROM sessions WHERE token=? AND expires_at>?');
    $s->execute([$token, ts()]);
    $row = $s->fetch();
    if (!$row) err('Sessie verlopen. Log opnieuw in.', 401);
    return $row['user_id'];
}

function user_row(string $id): ?array {
    $s = db()->prepare('SELECT id, username, display_name, bio, avatar, created_at FROM users WHERE id=?');
    $s->execute([$id]);
    return $s->fetch() ?: null;
}
