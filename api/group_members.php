<?php
require __DIR__ . '/config.php';

$uid     = auth_required();
$groupId = $_GET['groupId'] ?? '';
if (!$groupId) err('groupId ontbreekt.');

$s = db()->prepare('SELECT gm.user_id, gm.role, u.username, u.display_name, u.avatar FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=?');
$s->execute([$groupId]);
ok($s->fetchAll());
