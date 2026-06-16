<?php
require __DIR__ . '/config.php';

$uid = auth_required();
$q   = trim($_GET['q'] ?? '');
if (strlen($q) < 2) ok([]);

$s = db()->prepare('SELECT id, username, display_name, bio, avatar FROM users WHERE (username LIKE ? OR display_name LIKE ?) AND id != ? LIMIT 20');
$like = '%' . $q . '%';
$s->execute([$like, $like, $uid]);
ok($s->fetchAll());
