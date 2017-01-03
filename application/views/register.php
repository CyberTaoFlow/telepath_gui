<?php
defined('BASEPATH') OR exit('No direct script access allowed');
?>
<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="utf-8">
    <title>Telepath 3.0</title>

    <link rel="stylesheet" href="css/reset.css">
    <link rel="stylesheet" href="css/login.css">

    <script src="js/lib/jquery-1.11.0.min.js"></script>
    <script src="js/lib/jquery-ui-1.10.4.custom.min.js"></script>

    <script>
        var telepath = {
            basePath: "<?php echo dirname($_SERVER['PHP_SELF']) != '/' ? dirname($_SERVER['PHP_SELF']) : ''; ?>",
            controllerPath: "<?php echo $_SERVER['PHP_SELF']; ?>",
        };
    </script>

    <script src="js/telepath.checkbox.js"></script>
    <script src="js/telepath.register.js"></script>

</head>

<body>
<div class="tele-container">
    <img class="tele-logo" src="img/CyKickLogo.png" alt="CyKickLabs" />
    <div class="tele-registration">

        <h1>Registration</h1>

        <div class="tele-error" id="registration-error"></div>

        <div class="tele-field">
            <label class="tele-label" for="registration-username">Username:</label>
            <input type="text" class="tele-input" id="registration-username" name="registration-username">
        </div>

        <div class="tele-field">
            <label class="tele-label" for="registration-password">Password:</label>
            <input type="password" class="tele-input" id="registration-password" name="registration-password">
        </div>

        <div class="tele-field">
            <label class="tele-label" for="registration-confirm">Confirm Password:</label>
            <input type="password" class="tele-input" id="registration-confirm" name="confirm-password">
        </div>

        <br>


        <center>
            <div class="tele-button" id="registration-button">Register</div>
        </center>

    </div>
</div>
</body>
</html>
