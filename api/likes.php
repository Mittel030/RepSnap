<?php
require __DIR__ . '/config.php';

$uid = auth_required();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') err('Methode niet toegestaan.', 405);

$postId = body()['postId'] ?? '';
if (!$postId) err('postId ontbreekt.');

$chk = db()->prepare('SELECT id FROM posts WHERE id=?');
$chk->execute([$postId]);
if (!$chk->fetch()) err('Post niet gevonden.', 404);

$ex = db()->prepare('SELECT 1 FROM likes WHERE post_id=? AND user_id=?');
$ex->execute([$postId, $uid]);

if ($ex->fetch()) {
    db()->prepare('DELETE FROM likes WHERE post_id=? AND user_id=?')->execute([$postId, $uid]);
    $liked = false;
} else {
    db()->prepare('INSERT INTO likes (post_id,user_id) VALUES (?,?)')->execute([$postId, $uid]);
    $liked = true;
}

$cnt = db()->prepare('SELECT COUNT(*) FROM likes WHERE post_id=?');
$cnt->execute([$postId]);
ok(['liked' => $liked, 'count' => (int)$cnt->fetchColumn()]);
