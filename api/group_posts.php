<?php
require __DIR__ . '/config.php';

$method  = $_SERVER['REQUEST_METHOD'];
$uid     = auth_required();

if ($method === 'GET') {
    $groupId = $_GET['groupId'] ?? '';
    if (!$groupId) err('groupId ontbreekt.');

    $mem = db()->prepare('SELECT 1 FROM group_members WHERE group_id=? AND user_id=?');
    $mem->execute([$groupId, $uid]);
    if (!$mem->fetch()) err('Geen toegang.', 403);

    $s = db()->prepare('SELECT gp.*, u.username, u.display_name, u.avatar FROM group_posts gp JOIN users u ON u.id=gp.user_id WHERE gp.group_id=? ORDER BY gp.created_at DESC LIMIT 100');
    $s->execute([$groupId]);
    ok($s->fetchAll());
}

if ($method === 'POST') {
    $b       = body();
    $groupId = $b['groupId'] ?? '';
    $image   = trim($b['image'] ?? '');
    $caption = trim($b['caption'] ?? '');
    if (!$groupId) err('groupId ontbreekt.');
    if (!$image)   err('Afbeelding URL is verplicht.');

    $mem = db()->prepare('SELECT 1 FROM group_members WHERE group_id=? AND user_id=?');
    $mem->execute([$groupId, $uid]);
    if (!$mem->fetch()) err('Geen toegang.', 403);

    $id = uid();
    db()->prepare('INSERT INTO group_posts (id,group_id,user_id,image,caption,created_at) VALUES (?,?,?,?,?,?)')
       ->execute([$id, $groupId, $uid, $image, $caption, ts()]);

    $s = db()->prepare('SELECT gp.*, u.username, u.display_name, u.avatar FROM group_posts gp JOIN users u ON u.id=gp.user_id WHERE gp.id=?');
    $s->execute([$id]);
    ok($s->fetch());
}

err('Methode niet toegestaan.', 405);
