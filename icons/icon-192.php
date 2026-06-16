<?php
header('Content-Type: image/png');
header('Cache-Control: public, max-age=604800');
$s = 192;
$im = imagecreatetruecolor($s, $s);
$red  = imagecolorallocate($im, 220, 38, 38);
$white = imagecolorallocate($im, 255, 255, 255);
imagefilledrectangle($im, 0, 0, $s, $s, $red);
$font = 5;
$text = 'RS';
$tw = imagefontwidth($font) * strlen($text);
$th = imagefontheight($font);
imagestring($im, $font, ($s - $tw) / 2, ($s - $th) / 2, $text, $white);
imagepng($im);
imagedestroy($im);
