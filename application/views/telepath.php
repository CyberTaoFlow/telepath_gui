<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$is_admin = $this->ion_auth->is_admin();
$perms    = array();

if(!$is_admin) {
	$this->acl->init_current_acl();
	$tmp = $this->acl->perms;
	
	if(!empty($tmp)) {
		foreach($tmp as $k => $v) {
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
	<!-- <link href='http://fonts.googleapis.com/css?family=Roboto+Condensed:300' rel='stylesheet' type='text/css'> -->

	<?php

	if ($_SERVER['HTTP_HOST'] != 'localhost') {
		// add css files
		$this->minify->css(array('reset.css', 'telepath.css', 'listitem.css', 'infoblock.css', "icons.css", "flags.css", "overlay.css", "jquery.contextmenu.css", "slider.css", "tipsy.css"));

		// bool argument for rebuild css (false means skip rebuilding).
		echo $this->minify->deploy_css(true);
	}
	else{
	?>
			<link rel="stylesheet" href="css/reset.css">
			<link rel="stylesheet" href="css/telepath.css">
			<link rel="stylesheet" href="css/listitem.css">
			<link rel="stylesheet" href="css/infoblock.css">
			<link rel="stylesheet" href="css/icons.css">
			<link rel="stylesheet" href="css/flags.css">
			<link rel="stylesheet" href="css/overlay.css">
			<link rel="stylesheet" href="css/jquery.contextmenu.css">
			<link rel="stylesheet" href="css/slider.css">
			<link rel="stylesheet" href="css/tipsy.css">
	<?php }?>

	<link rel="stylesheet" href="css/ui-lightness/jquery-ui-1.10.4.custom.min.css">


	<script src="js/lib/jquery-1.11.0.min.js"></script>
	<script src="js/lib/jquery-ui-1.10.4.custom.min.js"></script>
	<script src="js/lib/yepnope.1.5.4-min.js"></script>
	<script src="js/lib/jquery.contextmenu.js"></script>


	<script>
		var telepath = { 
			basePath: "<?php echo dirname($_SERVER['PHP_SELF']) != '/' ? dirname($_SERVER['PHP_SELF']) : ''; ?>",
			controllerPath: "<?php echo $_SERVER['PHP_SELF']; ?>",
			licenseValid: "VALID",
			access: <?php echo json_encode(array('admin' => $is_admin, 'perm' => $perms)) ?>
		};
	</script>
	
	<?php
		
		
		
		$autoload = array(
			"js/lib/jquery.fileupload.js",
			"js/lib/jquery.iframe-transport.js",

			"js/lib/jquery.flot.min.js", 
			"js/lib/jquery.flot.resize.min.js", 
			"js/lib/jquery.flot.pie.min.js",
			"js/lib/jquery.flot.selection.min.js",
			"js/lib/jquery.flot.time.min.js",
			"js/lib/jquery.flot.axislabels.js",
			"js/lib/bootstrap-slider.js",
			"js/lib/jquery.flot.symbol.min.js",
			"js/lib/jquery.flot.tooltip.min.js",
			"js/lib/jquery.tipsy.js"
		);

		foreach($autoload as $src) {
			echo '<script src="' . $src . '"></script>';
		}
	

	if ($_SERVER['HTTP_HOST'] != 'localhost') {
		// add js files
		$this->minify->js(array("telepath.js", "telepath.header.js", "telepath.utils.js", "telepath.ds.js", "telepath.infoblock.js", "telepath.popup.js", "telepath.countries.js", "telepath.dropdown.js", "telepath.radios.js", "telepath.button.js", "telepath.checkbox.js", "telepath.search.js", "telepath.listitem.js", "telepath.listitem.generic.js", "telepath.toggle.js", "telepath.daterange.js", "telepath.graph.js", "telepath.vectormap.js", "telepath.anomalyscore.js", "telepath.anomalyscore.js", "telepath.anomalyscore.js", "telepath.notifications.js", "telepath.notifications.js", "telepath.overlay.js", "telepath.pagination.js", "telepath.config.js", "telepath.dashboard.js", "telepath.case.js", "telepath.cases.js", "telepath.alert.js", "telepath.alerts.js", "telepath.suspects.js", "telepath.reports.js"));

		// rebuild js (false means skip rebuilding).
		echo $this->minify->deploy_js(true);
	}
	else{
		?>
			<script src="js/telepath.js"></script>
			<script src="js/telepath.header.js"></script>

			<script src="js/telepath.utils.js"></script>
			<script src="js/telepath.ds.js"></script>
			<script src="js/telepath.infoblock.js"></script>
			<script src="js/telepath.popup.js"></script>
			<script src="js/telepath.countries.js"></script>
			<script src="js/telepath.dropdown.js"></script>
			<script src="js/telepath.radios.js"></script>
			<script src="js/telepath.button.js"></script>
			<script src="js/telepath.checkbox.js"></script>
			<script src="js/telepath.search.js"></script>
			<script src="js/telepath.listitem.js"></script>
			<script src="js/telepath.listitem.generic.js"></script>
			<script src="js/telepath.toggle.js"></script>
			<script src="js/telepath.daterange.js"></script>
			<script src="js/telepath.graph.js"></script>
			<script src="js/telepath.vectormap.js"></script>
			<script src="js/telepath.anomalyscore.js"></script>
			<script src="js/telepath.notifications.js"></script>
			<script src="js/telepath.overlay.js"></script>
			<script src="js/telepath.pagination.js"></script>

			<script src="js/telepath.config.js"></script>

			<script src="js/telepath.dashboard.js"></script>
			<script src="js/telepath.case.js"></script>
			<script src="js/telepath.cases.js"></script>
			<script src="js/telepath.alert.js"></script>
			<script src="js/telepath.alerts.js"></script>
			<script src="js/telepath.suspects.js"></script>
			<script src="js/telepath.reports.js"></script>
	<?php 	}
	?>
	

</head>

<body>

</body>
</html>
