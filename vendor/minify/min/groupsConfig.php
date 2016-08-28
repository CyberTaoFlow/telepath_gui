<?php
/**
 * Groups configuration for default Minify implementation
 * @package Minify
 */

/**
 * You may wish to use the Minify URI Builder app to suggest
 * changes. http://yourdomain/min/builder/
 *
 * See http://code.google.com/p/minify/wiki/CustomSource for other ideas
 **/

$js_path = __DIR__ .'/../../../js/';
$css_path =  __DIR__ .'/../../../css/';


$js_lib_array = [
    $js_path . "lib/jquery-1.11.0.min.js",
    $js_path . "lib/jquery-ui-1.10.4.custom.min.js",
//    $js_path . "lib/yepnope.1.5.4-min.js",
    $js_path . "lib/jquery.contextmenu.min.js",
    $js_path . "lib/jquery.fileupload.min.js",
    $js_path . "lib/jquery.iframe-transport.min.js",
    $js_path . "lib/jquery.flot.min.js",
    $js_path . "lib/jquery.flot.resize.min.js",
    $js_path . "lib/jquery.flot.pie.min.js",
    $js_path . "lib/jquery.flot.selection.min.js",
    $js_path . "lib/jquery.flot.time.min.js",
    $js_path . "lib/jquery.flot.axislabels.min.js",
    $js_path . "lib/bootstrap-slider.min.js",
    $js_path . "lib/jquery.flot.symbol.min.js",
    $js_path . "lib/jquery.flot.tooltip.min.js",
    $js_path . "lib/jquery.tipsy.min.js",
    $js_path. "lib/jquery.dropdown.js",
    $js_path. "lib/bootstrap.min.js",
    $js_path. "lib/jquery.pnotify.min.js",
    $js_path. "lib/jquery.mousewheel.js",
    $js_path. "lib/jquery.mCustomScrollbar.js",
    $js_path. "lib/jquery.vmap.min.js",
    $js_path. "lib/jquery.vmap.world.js",
    $js_path. "lib/jquery.vmap.sampledata.js",
    $js_path. "lib/jquery.weekcalendar.js",
    $js_path. "lib/jstree.min.js",
    $js_path. "lib/jstreegrid.js",
];


$js_array = [
    $js_path . "telepath.js",
    $js_path . "telepath.header.js",
    $js_path . "telepath.utils.js",
    $js_path . "telepath.ds.js",
    $js_path . "telepath.infoblock.js",
    $js_path . "telepath.popup.js",
    $js_path . "telepath.countries.js",
    $js_path . "telepath.dropdown.js",
    $js_path . "telepath.radios.js",
    $js_path . "telepath.button.js",
    $js_path . "telepath.checkbox.js",
    $js_path . "telepath.search.js",
    $js_path . "telepath.listitem.js",
    $js_path . "telepath.listitem.generic.js",
    $js_path . "telepath.toggle.js",
    $js_path . "telepath.daterange.js",
    $js_path . "telepath.graph.js",
    $js_path . "telepath.vectormap.js",
    $js_path . "telepath.anomalyscore.js",
    $js_path . "telepath.anomalyscore.js",
    $js_path . "telepath.anomalyscore.js",
    $js_path . "telepath.notifications.js",
    $js_path . "telepath.notifications.js",
    $js_path . "telepath.overlay.js",
    $js_path . "telepath.pagination.js",
    $js_path . "telepath.config.js",
    $js_path . "telepath.dashboard.js",
    $js_path . "telepath.case.js",
    $js_path . "telepath.cases.js",
    $js_path . "telepath.alert.js",
    $js_path . "telepath.alerts.js",
    $js_path . "telepath.suspects.js",
    $js_path . "telepath.reports.js",
    $js_path . "widgets/teleAppSelect.js",
    $js_path . "widgets/teleInput.js",
    $js_path . "widgets/telePassword.js",
    $js_path . "widgets/teleCheckbox.js",
    $js_path . "widgets/teleList.js",
    $js_path . "widgets/teleForm.js",
    $js_path . "widgets/teleTree.js",
    $js_path . "widgets/teleRule.js",
    $js_path . "widgets/teleRadios.js",
    $js_path . "widgets/teleBrowse.js",
    $js_path . "widgets/teleBrowser.js",
    $js_path . "widgets/teleSelect.js",
    $js_path . "widgets/teleMulti.js",
    $js_path . "widgets/teleRange.js",
    $js_path . "widgets/teleFile.js",
    $js_path . "widgets/teleSearch.js",
    $js_path . "widgets/teleRequest.js",
    $js_path . "widgets/teleCountry.js",
    $js_path . "telepath.sessionflow.js",
    $js_path . "telepath.handlers.js",
    $js_path . "telepath.rule.js",
    $js_path . "telepath.dialog.js",
    $js_path . "telepath.ipaddress.js",
    $js_path . "telepath.condition.js",
    $js_path . "telepath.condition.select.js",
    $js_path . "telepath.contextmenu.js",
    $js_path . "telepath.logmode.js",
    $js_path . "telepath.config.account.js",
    $js_path . "telepath.config.accounts.js",
    $js_path . "telepath.config.action.js",
    $js_path . "telepath.config.actions.js",
    $js_path . "telepath.config.application.js",
    $js_path . "telepath.config.applications.js",
    $js_path . "telepath.config.notifications.js",
    $js_path . "telepath.config.rule.js",
    $js_path . "telepath.config.rules.js",
    $js_path . "telepath.config.user.js",
    $js_path . "telepath.config.users.js",
    $js_path . "telepath.config.groups.js",
    $js_path . "telepath.config.system.js"
];

$css_array = [
    $css_path . 'reset.css',
    $css_path . 'ui-lightness/jquery-ui-1.10.4.custom.min.css',
    $css_path . 'telepath.css',
    $css_path . 'listitem.css',
    $css_path . 'infoblock.css',
    $css_path . "icons.css",
    $css_path . "flags.css",
    $css_path . "overlay.css",
    $css_path . "jquery.contextmenu.css",
    $css_path . "slider.css",
    $css_path . "tipsy.css",
    $css_path . "widgets.css",
    $css_path . "jquery.dropdown.css",
    $css_path . "jquery.mCustomScrollbar.css",
    $css_path . "bootstrap.css",
    $css_path . "jqvmap.css",
    $css_path . "config.css",
    $css_path . "jquery.weekcalendar.css",
    $css_path . "tree.css",
];

return array(
    'js_lib' => $js_lib_array,
    'js' => $js_array,
    'css' => $css_array,
);