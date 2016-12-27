<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Loading</title>

        <meta http-equiv="refresh" content="4">

    <style>

        #container {

            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            height: 136px;
            width: 640px;
        }

        img {
            position: absolute;
        }

        @-moz-keyframes spin {
            100% {
                -moz-transform: rotate(360deg);
            }
        }

        @-webkit-keyframes spin {
            100% {
                -webkit-transform: rotate(360deg);
            }
        }

        @keyframes spin {
            100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
            }
        }

        #logo-animation {
            -webkit-animation: spin 4s linear infinite;
            -moz-animation: spin 4s linear infinite;
            animation: spin 4s linear infinite;
        }

        #logo-text {
            margin-left: 150px;
        }
    </style>
</head>
<body>

<div id="container">

    <img id="logo-text" src="img/CyKickText.png">
    <img id="logo-animation" src="img/CyKickLogoAnimation.png">

</div>



</body>
</html>