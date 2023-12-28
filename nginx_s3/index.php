<!DOCTYPE html>
<html>
<head>
    <title>Report Links</title>
</head>
<body>

<h2>Report Links:</h2>

<?php
$directory = '/usr/share/nginx/html/reports/';
$files = glob($directory . '*.html');

foreach($files as $file) {
    $filename = basename($file);
    echo "<p><a href='/reports/$filename'>$filename</a></p>";

}
?>

</body>
</html>
