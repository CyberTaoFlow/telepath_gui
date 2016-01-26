<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Loading</title>

<!--    <meta http-equiv="refresh" content="4">-->

    <style>

        body{
            overflow: hidden;
            /*background-color: black;*/
            background-image: radial-gradient(circle farthest-corner at center, #718da4 30%, #1C262B 100%);
        }

        #container {

            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%)
        }

         #logo {
            width: 100%;
            margin: 1% auto;
        }

        #loader {
            width: 50px;;
            margin: 10% auto;
        }

        #text-loader {
            width: 20px;
            margin: 10% auto;
        }
        .loader {
            /*position: absolute;*/
            /*margin: 10% auto;*/
            top: calc(50% - 32px);
            left: calc(50% - 32px);
            width: 90px;
            height: 90px;
            border-radius: 50%;
            perspective: 800px;
            float: left;
        }

        img{
            margin-left: auto;
            width: 200px;
        }
        .inner {
            position: absolute;
            box-sizing: border-box;
            width: 120%;
            height: 120%;
            border-radius: 50%;
        }

        .inner.one {
            left: 0%;
            top: 0%;
            animation: rotate-one 1s linear infinite;
            border-style: solid;
            border-color: #244f9d;
            border-width: 4px 4px 0px 0px;
        }


        .inner.three {
            right: 0%;
            bottom: 0%;
            animation: rotate-three 1s linear infinite;
            border-style: solid;
            border-color: #5e5e62;
            border-width: 4px 6px 4px 0px;
        }

        @keyframes rotate-one {
            0% {
                transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg);
            }
            100% {
                transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg);
            }
        }


        @keyframes rotate-three {
            0% {
                transform: rotateX(45deg) rotateY(25deg) rotateZ(0deg);
            }
            100% {
                transform: rotateX(45deg) rotateY(25deg) rotateZ(360deg);
            }
        }

        @media only screen and (max-width: 600px) {
            /* For mobile phones: */
            img {
                width: 60%;
            }
            .loader {
                width: 50px;
                height: 50px;
            }
        }
    </style>
</head>
<body>

<div id="container">
    <div id="logo">.
        <div class="loader">
            <div class="inner one"></div>
            <div class="inner three"></div>
        </div>
            <img src="img/loading-logo.png">

    </div>




    <div id="text-loader">
        Loading..
    </div>

</div>



</body>
</html>