<?php
header('Content-Type: image/png');
header('Cache-Control: public, max-age=604800');
$s = 512;
$im = imagecreatetruecolor($s, $s);
$red   = imagecolorallocate($im, 220, 38, 38);
$white = imagecolorallocate($im, 255, 255, 255);
imagefilledrectangle($im, 0, 0, $s, $s, $red);
$font = 5;
$text = 'RS';
$scale = 8;
$tw = imagefontwidth($font) * strlen($text) * $scale;
$th = imagefontheight($font) * $scale;
// Scale up using imagecopyresampled trick
$tmp = imagecreatetruecolor(imagefontwidth($font)*strlen($text), imagefontheight($font));
$r2 = imagecolorallocate($tmp, 220, 38, 38);
$w2 = imagecolorallocate($tmp, 255, 255, 255);
imagefilledrectangle($tmp, 0, 0, imagesx($tmp), imagesy($tmp), $r2);
imagestring($tmp, $font, 0, 0, $text, $w2);
imagecopyresampled($im, $tmp, ($s-$tw)/2, ($s-$th)/2, 0, 0, $tw, $th, imagesx($tmp), imagesy($tmp));
imagedestroy($tmp);
imagepng($im);
imagedestroy($im);
