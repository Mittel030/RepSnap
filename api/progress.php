<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uid    = auth_required();

if ($method === 'GET') {
    $s = db()->prepare('SELECT * FROM progress_photos WHERE user_id=? ORDER BY created_at DESC');
    $s->execute([$uid]);
    ok($s->fetchAll());
}

if ($method === 'POST') {
    $b     = body();
    $image = trim($b['image'] ?? '');
    $note  = trim($b['note'] ?? '');
    if (!$image) err('Afbeelding URL is verplicht.');
    $id = uid();
    db()->prepare('INSERT INTO progress_photos (id,user_id,image,note,created_at) VALUES (?,?,?,?,?)')
       ->execute([$id, $uid, $image, $note, ts()]);
    ok(['id' => $id, 'user_id' => $uid, 'image' => $image, 'note' => $note, 'created_at' => ts()]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $s  = db()->prepare('SELECT user_id FROM progress_photos WHERE id=?');
    $s->execute([$id]);
    $row = $s->fetch();
    if (!$row) err('Niet gevonden.', 404);
    if ($row['user_id'] !== $uid) err('Geen toegang.', 403);
    db()->prepare('DELETE FROM progress_photos WHERE id=?')->execute([$id]);
    ok(null);
}

err('Methode niet toegestaan.', 405);
