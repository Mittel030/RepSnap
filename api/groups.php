<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uid    = auth_required();

if ($method === 'GET') {
    $mine = db()->prepare("
        SELECT g.*, gm.role,
               (SELECT COUNT(*) FROM group_members WHERE group_id=g.id) AS member_count
        FROM grps g
        JOIN group_members gm ON gm.group_id=g.id AND gm.user_id=?
        ORDER BY g.created_at DESC
    ");
    $mine->execute([$uid]);
    $myGroups = $mine->fetchAll();

    $others = db()->prepare("
        SELECT g.*,
               (SELECT COUNT(*) FROM group_members WHERE group_id=g.id) AS member_count
        FROM grps g
        WHERE g.id NOT IN (SELECT group_id FROM group_members WHERE user_id=?)
        ORDER BY g.created_at DESC
    ");
    $others->execute([$uid]);
    ok(['mine' => $myGroups, 'others' => $others->fetchAll()]);
}

if ($method === 'POST') {
    $b    = body();
    $code = strtoupper(trim($b['code'] ?? ''));

    if ($code) {
        // Join by code
        $g = db()->prepare('SELECT * FROM grps WHERE code=?');
        $g->execute([$code]);
        $group = $g->fetch();
        if (!$group) err('Code niet gevonden.');

        $ex = db()->prepare('SELECT 1 FROM group_members WHERE group_id=? AND user_id=?');
        $ex->execute([$group['id'], $uid]);
        if ($ex->fetch()) err('Je bent al lid van deze groep.');

        db()->prepare('INSERT INTO group_members (id,group_id,user_id,role,joined_at) VALUES (?,?,?,?,?)')
           ->execute([uid(), $group['id'], $uid, 'member', ts()]);
        ok($group);
    }

    // Create group
    $name  = trim($b['name'] ?? '');
    $desc  = trim($b['description'] ?? '');
    $cover = trim($b['cover'] ?? '');
    if (!$name) err('Groepsnaam is verplicht.');

    $genCode = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
    $id = uid();
    db()->prepare('INSERT INTO grps (id,name,description,cover,code,created_by,created_at) VALUES (?,?,?,?,?,?,?)')
       ->execute([$id, $name, $desc, $cover, $genCode, $uid, ts()]);
    db()->prepare('INSERT INTO group_members (id,group_id,user_id,role,joined_at) VALUES (?,?,?,?,?)')
       ->execute([uid(), $id, $uid, 'admin', ts()]);

    $g = db()->prepare('SELECT *, 1 AS member_count FROM grps WHERE id=?');
    $g->execute([$id]);
    ok($g->fetch());
}

if ($method === 'DELETE') {
    $id     = $_GET['id'] ?? '';
    $action = $_GET['action'] ?? 'leave';

    $gm = db()->prepare('SELECT role FROM group_members WHERE group_id=? AND user_id=?');
    $gm->execute([$id, $uid]);
    $m = $gm->fetch();
    if (!$m) err('Je bent geen lid van deze groep.', 403);

    if ($action === 'delete') {
        if ($m['role'] !== 'admin') err('Alleen de admin kan de groep verwijderen.', 403);
        db()->prepare('DELETE FROM grps WHERE id=?')->execute([$id]);
    } else {
        db()->prepare('DELETE FROM group_members WHERE group_id=? AND user_id=?')->execute([$id, $uid]);
    }
    ok(null);
}

err('Methode niet toegestaan.', 405);
