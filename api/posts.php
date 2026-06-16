<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uid    = auth_required();

if ($method === 'GET') {
    // Feed: own posts + friends' posts
    $fs = db()->prepare('SELECT CASE WHEN from_user=? THEN to_user ELSE from_user END AS fid FROM friendships WHERE (from_user=? OR to_user=?) AND status="accepted"');
    $fs->execute([$uid, $uid, $uid]);
    $friendIds = array_column($fs->fetchAll(), 'fid');
    $ids = array_merge([$uid], $friendIds);
    $ph  = implode(',', array_fill(0, count($ids), '?'));

    $s = db()->prepare("
        SELECT p.*, u.username, u.display_name, u.avatar,
               (SELECT COUNT(*) FROM likes WHERE post_id=p.id) AS like_count,
               (SELECT COUNT(*) FROM likes WHERE post_id=p.id AND user_id=?) AS user_liked
        FROM posts p JOIN users u ON p.user_id=u.id
        WHERE p.user_id IN ($ph)
        ORDER BY p.created_at DESC LIMIT 100
    ");
    $s->execute(array_merge([$uid], $ids));
    ok($s->fetchAll());
}

if ($method === 'POST') {
    $b = body();
    $image   = trim($b['image'] ?? '');
    $caption = trim($b['caption'] ?? '');
    if (!$image) err('Afbeelding URL is verplicht.');

    $id = uid();
    db()->prepare('INSERT INTO posts (id,user_id,image,caption,created_at) VALUES (?,?,?,?,?)')
       ->execute([$id, $uid, $image, $caption, ts()]);

    $s = db()->prepare('SELECT p.*, u.username, u.display_name, u.avatar, 0 AS like_count, 0 AS user_liked FROM posts p JOIN users u ON p.user_id=u.id WHERE p.id=?');
    $s->execute([$id]);
    ok($s->fetch());
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $s  = db()->prepare('SELECT user_id FROM posts WHERE id=?');
    $s->execute([$id]);
    $row = $s->fetch();
    if (!$row) err('Post niet gevonden.', 404);
    if ($row['user_id'] !== $uid) err('Geen toegang.', 403);
    db()->prepare('DELETE FROM posts WHERE id=?')->execute([$id]);
    ok(null);
}

err('Methode niet toegestaan.', 405);
