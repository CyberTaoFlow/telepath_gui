<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Loading</title>

    <meta http-equiv="refresh" content="4">

    <style>

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
            border-width: 3px 3px 0px 0px;
        }


        .inner.three {
            right: 0%;
            bottom: 0%;
            animation: rotate-three 1s linear infinite;
            border-style: solid;
            border-color: #5e5e62;
            border-width: 3px 5px 3px 0px;
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

        #fountainTextG{
            width: 350px;
            margin: 50% 6%;
        }

        .fountainTextG{
            color:rgb(0,0,0);
            font-family:Arial;
            font-size:97px;
            text-decoration:none;
            font-weight:normal;
            font-style:normal;
            float:left;
            animation-name:bounce_fountainTextG;
            -o-animation-name:bounce_fountainTextG;
            -ms-animation-name:bounce_fountainTextG;
            -webkit-animation-name:bounce_fountainTextG;
            -moz-animation-name:bounce_fountainTextG;
            animation-duration:2.09s;
            -o-animation-duration:2.09s;
            -ms-animation-duration:2.09s;
            -webkit-animation-duration:2.09s;
            -moz-animation-duration:2.09s;
            animation-iteration-count:infinite;
            -o-animation-iteration-count:infinite;
            -ms-animation-iteration-count:infinite;
            -webkit-animation-iteration-count:infinite;
            -moz-animation-iteration-count:infinite;
            animation-direction:normal;
            -o-animation-direction:normal;
            -ms-animation-direction:normal;
            -webkit-animation-direction:normal;
            -moz-animation-direction:normal;
            transform:scale(.5);
            -o-transform:scale(.5);
            -ms-transform:scale(.5);
            -webkit-transform:scale(.5);
            -moz-transform:scale(.5);
        }#fountainTextG_1{
             animation-delay:0.75s;
             -o-animation-delay:0.75s;
             -ms-animation-delay:0.75s;
             -webkit-animation-delay:0.75s;
             -moz-animation-delay:0.75s;
         }
        #fountainTextG_2{
            animation-delay:0.9s;
            -o-animation-delay:0.9s;
            -ms-animation-delay:0.9s;
            -webkit-animation-delay:0.9s;
            -moz-animation-delay:0.9s;
        }
        #fountainTextG_3{
            animation-delay:1.05s;
            -o-animation-delay:1.05s;
            -ms-animation-delay:1.05s;
            -webkit-animation-delay:1.05s;
            -moz-animation-delay:1.05s;
        }
        #fountainTextG_4{
            animation-delay:1.2s;
            -o-animation-delay:1.2s;
            -ms-animation-delay:1.2s;
            -webkit-animation-delay:1.2s;
            -moz-animation-delay:1.2s;
        }
        #fountainTextG_5{
            animation-delay:1.35s;
            -o-animation-delay:1.35s;
            -ms-animation-delay:1.35s;
            -webkit-animation-delay:1.35s;
            -moz-animation-delay:1.35s;
        }
        #fountainTextG_6{
            animation-delay:1.5s;
            -o-animation-delay:1.5s;
            -ms-animation-delay:1.5s;
            -webkit-animation-delay:1.5s;
            -moz-animation-delay:1.5s;
        }
        #fountainTextG_7{
            animation-delay:1.64s;
            -o-animation-delay:1.64s;
            -ms-animation-delay:1.64s;
            -webkit-animation-delay:1.64s;
            -moz-animation-delay:1.64s;
        }




        @keyframes bounce_fountainTextG{
            0%{
                transform:scale(1);
                color:rgb(0,0,0);
            }

            100%{
                transform:scale(.5);
                color:rgba(255,255,255,0);
            }
        }

        @-o-keyframes bounce_fountainTextG{
            0%{
                -o-transform:scale(1);
                color:rgb(0,0,0);
            }

            100%{
                -o-transform:scale(.5);
                color:rgba(255,255,255,0);
            }
        }

        @-ms-keyframes bounce_fountainTextG{
            0%{
                -ms-transform:scale(1);
                color:rgb(0,0,0);
            }

            100%{
                -ms-transform:scale(.5);
                color:rgba(255,255,255,0);
            }
        }

        @-webkit-keyframes bounce_fountainTextG{
            0%{
                -webkit-transform:scale(1);
                color:rgb(0,0,0);
            }

            100%{
                -webkit-transform:scale(.5);
                color:rgba(255,255,255,0);
            }
        }

        @-moz-keyframes bounce_fountainTextG{
            0%{
                -moz-transform:scale(1);
                color:rgb(0,0,0);
            }

            100%{
                -moz-transform:scale(.5);
                color:rgba(255,255,255,0);
            }
        }

        @media only screen and (max-width: 600px) {
            /* For mobile phones: */
            img {
                /*width: 60%;*/
            }

            .loader {
                width: 50px;
                height: 50px;
            }

            #fountainTextG {
                width: 350px;
                margin: 30% 30%;
            }

            .fountainTextG {
                font-size: 35px;
            }
        }
        body{
            /*overflow: hidden;*/
            /*position: relative;*/
            background-image: radial-gradient(circle farthest-corner at center, #718da4 30%, #1C262B 100%);
        }

        #container {

            /*position: relative;
            height: 200px;
            width: 60%;
            margin: 0 auto;
            padding: 20px;*/

            /*background-color: red;*/
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            height: 200px;
            width: 390px;
        }

        #logo {
            position: relative;
            margin: 0px 100px;
        }

        #loader {
            width: 50px;;
            margin: 10% auto;
        }

        #text-loader {
            position: absolute;
            /*width: 60%;*/
            /*margin: 0 auto;*/
            /*padding: 20px;*/

        }
        .loader {
            position: absolute;
            margin: 4% auto;
            /*top: calc(50% - 32px);*/
            /*left: calc(50% - 32px);*/
            width: 55px;
            height: 55px;
            border-radius: 50%;
            perspective: 800px;
            float: left;
        }

        img{
            margin-left: 60px;
            position: absolute;
            /*float: right;*/

            /*width: 200px;*/
        }
    </style>
</head>
<body>

<div id="container">
    <div id="logo">
        <div class="loader">
            <div class="inner one"></div>
            <div class="inner three"></div>
        </div>
            <img src="img/loading-logo.png">

    </div>




    <div id="text-loader">
        <div id="fountainTextG"><div id="fountainTextG_1" class="fountainTextG">L</div><div id="fountainTextG_2" class="fountainTextG">o</div><div id="fountainTextG_3" class="fountainTextG">a</div><div id="fountainTextG_4" class="fountainTextG">d</div><div id="fountainTextG_5" class="fountainTextG">i</div><div id="fountainTextG_6" class="fountainTextG">n</div><div id="fountainTextG_7" class="fountainTextG">g</div></div>
    </div>

</div>



</body>
</html>