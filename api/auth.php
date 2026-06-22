<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $uid = auth_required();
    ok(user_row($uid));
}

if ($method === 'POST') {
    $b = body();
    $action = $b['action'] ?? '';

    if ($action === 'signup') {
        $username    = strtolower(trim($b['username'] ?? ''));
        $displayName = trim($b['displayName'] ?? '');
        $password    = $b['password'] ?? '';

        if (!$username || !$displayName || !$password) err('Alle velden zijn verplicht.');
        if (strlen($username) < 3) err('Gebruikersnaam moet minimaal 3 tekens zijn.');
        if (!preg_match('/^[a-z0-9_.]+$/', $username)) err('Gebruikersnaam mag alleen letters, cijfers, . en _ bevatten.');
        if (strlen($password) < 6) err('Wachtwoord moet minimaal 6 tekens zijn.');

        $chk = db()->prepare('SELECT id FROM users WHERE username=?');
        $chk->execute([$username]);
        if ($chk->fetch()) err('Gebruikersnaam is al bezet.');

        $id   = uid();
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $avatar = "https://i.pravatar.cc/150?u={$username}";
        $now  = ts();

        db()->prepare('INSERT INTO users (id,username,display_name,password,bio,avatar,created_at) VALUES (?,?,?,?,?,?,?)')
           ->execute([$id, $username, $displayName, $hash, '', $avatar, $now]);

        $token = bin2hex(random_bytes(32));
        db()->prepare('INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)')
           ->execute([$token, $id, $now + 30 * 86400 * 1000]);

        ok(['token' => $token, 'user' => user_row($id)]);
    }

    if ($action === 'login') {
        $username = strtolower(trim($b['username'] ?? ''));
        $password = $b['password'] ?? '';

        $s = db()->prepare('SELECT id, password FROM users WHERE username=?');
        $s->execute([$username]);
        $row = $s->fetch();
        if (!$row || !password_verify($password, $row['password'])) err('Gebruikersnaam of wachtwoord onjuist.');

        $token = bin2hex(random_bytes(32));
        db()->prepare('INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)')
           ->execute([$token, $row['id'], ts() + 30 * 86400 * 1000]);

        ok(['token' => $token, 'user' => user_row($row['id'])]);
    }

    if ($action === 'logout') {
        $token = get_token();
        if ($token) db()->prepare('DELETE FROM sessions WHERE token=?')->execute([$token]);
        ok(null);
    }

    err('Onbekende actie.');
}

if ($method === 'PUT') {
    $uid = auth_required();
    $b   = body();
    $fields = [];
    $vals   = [];
    if (isset($b['displayName'])) { $fields[] = 'display_name=?'; $vals[] = substr(trim($b['displayName']), 0, 60); }
    if (isset($b['bio']))         { $fields[] = 'bio=?';          $vals[] = substr(trim($b['bio']), 0, 120); }
    if (isset($b['avatar']))      { $fields[] = 'avatar=?';       $vals[] = substr(trim($b['avatar']), 0, 500); }
    if ($fields) {
        $vals[] = $uid;
        db()->prepare('UPDATE users SET '.implode(',', $fields).' WHERE id=?')->execute($vals);
    }
    ok(user_row($uid));
}

err('Methode niet toegestaan.', 405);
