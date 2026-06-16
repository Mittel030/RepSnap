<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uid    = auth_required();

if ($method === 'GET') {
    $friends = db()->prepare("
        SELECT u.id, u.username, u.display_name, u.bio, u.avatar,
               f.id AS friendship_id, f.status, f.from_user
        FROM friendships f
        JOIN users u ON (CASE WHEN f.from_user=? THEN f.to_user ELSE f.from_user END = u.id)
        WHERE f.from_user=? OR f.to_user=?
        ORDER BY f.created_at DESC
    ");
    $friends->execute([$uid, $uid, $uid]);
    ok($friends->fetchAll());
}

if ($method === 'POST') {
    $b          = body();
    $toUsername = strtolower(trim($b['toUsername'] ?? ''));
    if (!$toUsername) err('Gebruikersnaam ontbreekt.');

    $target = db()->prepare('SELECT id FROM users WHERE username=?');
    $target->execute([$toUsername]);
    $t = $target->fetch();
    if (!$t) err('Gebruiker niet gevonden.');
    if ($t['id'] === $uid) err('Je kunt jezelf niet toevoegen.');

    $ex = db()->prepare('SELECT id FROM friendships WHERE (from_user=? AND to_user=?) OR (from_user=? AND to_user=?)');
    $ex->execute([$uid, $t['id'], $t['id'], $uid]);
    if ($ex->fetch()) err('Vriendschapsverzoek bestaat al of zijn al vrienden.');

    $id = uid();
    db()->prepare('INSERT INTO friendships (id,from_user,to_user,status,created_at) VALUES (?,?,?,?,?)')
       ->execute([$id, $uid, $t['id'], 'pending', ts()]);
    ok(['id' => $id]);
}

if ($method === 'PUT') {
    $b  = body();
    $id = $b['id'] ?? '';
    $s  = db()->prepare('SELECT * FROM friendships WHERE id=?');
    $s->execute([$id]);
    $fs = $s->fetch();
    if (!$fs) err('Verzoek niet gevonden.', 404);
    if ($fs['to_user'] !== $uid) err('Geen toegang.', 403);
    db()->prepare('UPDATE friendships SET status="accepted" WHERE id=?')->execute([$id]);
    ok(null);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $s  = db()->prepare('SELECT * FROM friendships WHERE id=?');
    $s->execute([$id]);
    $fs = $s->fetch();
    if (!$fs) err('Niet gevonden.', 404);
    if ($fs['from_user'] !== $uid && $fs['to_user'] !== $uid) err('Geen toegang.', 403);
    db()->prepare('DELETE FROM friendships WHERE id=?')->execute([$id]);
    ok(null);
}

err('Methode niet toegestaan.', 405);
