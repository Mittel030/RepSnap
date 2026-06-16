<?php
require __DIR__ . '/config.php';

$uid = auth_required();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') err('Methode niet toegestaan.', 405);
if (empty($_FILES['file'])) err('Geen bestand ontvangen.');

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) err('Upload fout: ' . $file['error']);

$allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','video/mp4','video/webm','video/quicktime','video/x-m4v'];
$mime = mime_content_type($file['tmp_name']);
if (!in_array($mime, $allowed)) err('Bestandstype niet toegestaan. Gebruik jpg, png, gif, webp, mp4 of webm.');

$maxSize = 100 * 1024 * 1024; // 100MB
if ($file['size'] > $maxSize) err('Bestand is te groot (max 100MB).');

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'bin');
$name = bin2hex(random_bytes(16)) . '.' . $ext;
$uploadDir = dirname(__DIR__) . '/uploads/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

if (!move_uploaded_file($file['tmp_name'], $uploadDir . $name)) err('Opslaan mislukt.');

$isVideo = str_starts_with($mime, 'video/');
ok([
    'url'  => '/Repsnap/uploads/' . $name,
    'type' => $isVideo ? 'video' : 'image',
]);
