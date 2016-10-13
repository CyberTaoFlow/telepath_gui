<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$is_admin = $this->ion_auth->is_admin();
$perms = array();

if (!$is_admin) {
    $this->acl->init_current_acl();
    $tmp = $this->acl->perms;

    if (!empty($tmp)) {
        foreach ($tmp as $k => $v) {
            $perms[str_replace('::', '_', $k)] = true;
        }
    }

}

/*
$perms = array();
$master_list = $this->acl->get_master_list();
foreach($master_list as $cat => $items) {
	foreach($items as $item => $desc) {
		$perms[$cat . '_' . $item] = true;
	}
}
*/
/*
$can_access = false;

if($is_admin) {
	$can_access = true;
} else {
	$this->acl->init_current_acl();
	$can_access = $this->acl->has_perm('Telepath', 'get');
}

if($licence_valid !== 'VALID') { $logged_in = false; $can_access = false; }

if(!$logged_in) {
	echo '123';
	die;
}

if($logged_in && $can_access) {
	echo '1010101';
}
*/

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Telepath 3.0</title>
    <link rel='shortcut icon' href='/favicon.ico'/>
    <link rel='icon' href='/favicon.ico'/>

    <?php

    $minify = $this->config->item('minifying');


    if ($minify) {

        require __DIR__ . '/../../vendor/minify/min/utils.php';

        echo '<link rel="stylesheet" href="' . Minify_getUri('css', ['minAppUri' => 'vendor/minify/min', 'rewriteWorks' => FALSE]) . '">';


    } else {

        $groups = require __DIR__ . '/../../vendor/minify/min/groupsConfig.php';

        foreach ($groups['css'] as $path) {
            $min_dir = realpath(__DIR__ . '/../../vendor/minify/min');
            $src = str_replace($min_dir . '/../../../css/', 'css/', $path);
            echo '<link rel="stylesheet" href="' . $src . '">';

        }
    }

    ?>


    <script>
        var telepath = {
            basePath: "<?php echo dirname($_SERVER['PHP_SELF']) != '/' ? dirname($_SERVER['PHP_SELF']) : ''; ?>",
            controllerPath: "<?php echo $_SERVER['PHP_SELF']; ?>",
            licenseValid: "VALID",
            access: <?php echo json_encode(array('admin' => $is_admin, 'perm' => $perms)) ?>
        };
    </script>

    <?php

    if ($minify) {

        echo '<script src="' . Minify_getUri('js_lib', ['minAppUri' => 'vendor/minify/min', 'rewriteWorks' => FALSE]) . '"></script>';
        echo '<script src="' . Minify_getUri('js', ['minAppUri' => 'vendor/minify/min', 'rewriteWorks' => FALSE]) . '"></script>';

    } else {

        $js = array_merge($groups['js_lib'], $groups['js']);

        foreach ($js as $path) {
            $min_dir = realpath(__DIR__ . '/../../vendor/minify/min');
            $src = str_replace($min_dir . '/../../../js/', 'js/', $path);
            echo '<script src="' . $src . '"></script>';
        }
    }

    ?>


</head>

<body>
<img class="loader" src="img/loader.gif">
</body>
</html>
