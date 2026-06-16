<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uid    = auth_required();

if ($method === 'GET') {
    $type = $_GET['type'] ?? '';

    if ($type === 'conversations') {
        // Last DM per peer using a self-join to avoid GROUP BY issues
        $dms = db()->prepare("
            SELECT
                CASE WHEN m.sender_id=? THEN m.recipient_id ELSE m.sender_id END AS peer_id,
                m.content AS last_msg,
                m.created_at AS last_at,
                u.username, u.display_name, u.avatar
            FROM messages m
            JOIN users u ON u.id = CASE WHEN m.sender_id=? THEN m.recipient_id ELSE m.sender_id END
            WHERE m.group_id IS NULL
              AND (m.sender_id=? OR m.recipient_id=?)
              AND NOT EXISTS (
                SELECT 1 FROM messages m2
                WHERE m2.group_id IS NULL
                  AND m2.created_at > m.created_at
                  AND (
                    (m2.sender_id=m.sender_id AND m2.recipient_id=m.recipient_id)
                    OR (m2.sender_id=m.recipient_id AND m2.recipient_id=m.sender_id)
                  )
              )
            ORDER BY m.created_at DESC
        ");
        $dms->execute([$uid,$uid,$uid,$uid]);
        $dmList = $dms->fetchAll();

        // Friends with no messages yet
        $friends = db()->prepare("
            SELECT CASE WHEN f.from_user=? THEN f.to_user ELSE f.from_user END AS fid,
                   u.username, u.display_name, u.avatar
            FROM friendships f JOIN users u ON u.id = CASE WHEN f.from_user=? THEN f.to_user ELSE f.from_user END
            WHERE (f.from_user=? OR f.to_user=?) AND f.status='accepted'
        ");
        $friends->execute([$uid,$uid,$uid,$uid]);
        $friendList = $friends->fetchAll();

        // Group chats
        $groups = db()->prepare("
            SELECT g.id AS group_id, g.name, g.cover,
                   m.content AS last_msg, m.created_at AS last_at
            FROM grps g
            JOIN group_members gm ON gm.group_id=g.id AND gm.user_id=?
            LEFT JOIN messages m ON m.group_id=g.id AND m.created_at=(SELECT MAX(m2.created_at) FROM messages m2 WHERE m2.group_id=g.id)
            ORDER BY COALESCE(m.created_at, g.created_at) DESC
        ");
        $groups->execute([$uid]);
        ok(['dms' => $dmList, 'friends' => $friendList, 'groups' => $groups->fetchAll()]);
    }

    if ($type === 'dm') {
        $with = $_GET['with'] ?? '';
        if (!$with) err('with ontbreekt.');
        $s = db()->prepare("
            SELECT m.*, u.username, u.display_name, u.avatar
            FROM messages m JOIN users u ON u.id=m.sender_id
            WHERE m.group_id IS NULL
              AND ((m.sender_id=? AND m.recipient_id=?) OR (m.sender_id=? AND m.recipient_id=?))
            ORDER BY m.created_at ASC LIMIT 200
        ");
        $s->execute([$uid, $with, $with, $uid]);
        ok($s->fetchAll());
    }

    if ($type === 'group') {
        $groupId = $_GET['groupId'] ?? '';
        if (!$groupId) err('groupId ontbreekt.');
        $mem = db()->prepare('SELECT 1 FROM group_members WHERE group_id=? AND user_id=?');
        $mem->execute([$groupId, $uid]);
        if (!$mem->fetch()) err('Geen toegang.', 403);
        $s = db()->prepare("
            SELECT m.*, u.username, u.display_name, u.avatar
            FROM messages m JOIN users u ON u.id=m.sender_id
            WHERE m.group_id=?
            ORDER BY m.created_at ASC LIMIT 200
        ");
        $s->execute([$groupId]);
        ok($s->fetchAll());
    }

    err('Ongeldig type.');
}

if ($method === 'POST') {
    $b    = body();
    $type = $b['type'] ?? '';

    if ($type === 'dm') {
        $to      = $b['toUserId'] ?? '';
        $content = trim($b['content'] ?? '');
        if (!$to || !$content) err('toUserId en content zijn verplicht.');

        $fs = db()->prepare('SELECT 1 FROM friendships WHERE ((from_user=? AND to_user=?) OR (from_user=? AND to_user=?)) AND status="accepted"');
        $fs->execute([$uid, $to, $to, $uid]);
        if (!$fs->fetch()) err('Jullie zijn geen vrienden.');

        $id = uid();
        db()->prepare('INSERT INTO messages (id,sender_id,recipient_id,content,created_at) VALUES (?,?,?,?,?)')
           ->execute([$id, $uid, $to, $content, ts()]);
        $s = db()->prepare('SELECT m.*, u.username, u.display_name, u.avatar FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?');
        $s->execute([$id]);
        ok($s->fetch());
    }

    if ($type === 'group') {
        $groupId = $b['groupId'] ?? '';
        $content = trim($b['content'] ?? '');
        if (!$groupId || !$content) err('groupId en content zijn verplicht.');

        $mem = db()->prepare('SELECT 1 FROM group_members WHERE group_id=? AND user_id=?');
        $mem->execute([$groupId, $uid]);
        if (!$mem->fetch()) err('Geen toegang.', 403);

        $id = uid();
        db()->prepare('INSERT INTO messages (id,sender_id,group_id,content,created_at) VALUES (?,?,?,?,?)')
           ->execute([$id, $uid, $groupId, $content, ts()]);
        $s = db()->prepare('SELECT m.*, u.username, u.display_name, u.avatar FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?');
        $s->execute([$id]);
        ok($s->fetch());
    }

    err('Ongeldig type.');
}

err('Methode niet toegestaan.', 405);
