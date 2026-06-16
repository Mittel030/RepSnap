<?php
require __DIR__ . '/config.php';

$uid    = auth_required();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $b    = body();
    $to   = $b['to']   ?? '';
    $type = $b['type'] ?? '';
    $data = json_encode($b['data'] ?? null);
    if (!$to || !$type) err('to en type zijn verplicht.');

    // clean stale signals > 60s
    db()->prepare('DELETE FROM signals WHERE created_at < ?')->execute([ts() - 60000]);

    $id = uid();
    db()->prepare('INSERT INTO signals (id,from_user,to_user,type,data,created_at) VALUES (?,?,?,?,?,?)')
       ->execute([$id, $uid, $to, $type, $data, ts()]);
    ok(null);
}

if ($method === 'GET') {
    $since = (int)($_GET['since'] ?? 0);
    $s = db()->prepare('SELECT * FROM signals WHERE to_user=? AND created_at>? ORDER BY created_at ASC');
    $s->execute([$uid, $since]);
    $rows = $s->fetchAll();
    if ($rows) {
        $ph = implode(',', array_fill(0, count($rows), '?'));
        db()->prepare("DELETE FROM signals WHERE id IN ($ph)")->execute(array_column($rows, 'id'));
    }
    ok(array_map(fn($r) => ['from'=>$r['from_user'],'type'=>$r['type'],'data'=>json_decode($r['data'],true),'at'=>$r['created_at']], $rows));
}

err('Methode niet toegestaan.', 405);
