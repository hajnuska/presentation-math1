<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MATEK - arányosítás</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        #slideshow {
            text-align: center;
        }
        .image-container img {
            width: 85vw;
            max-width: 1000px;
            height: auto;
        }
        .thumbnails-wrapper {
            width: 85vw;
            overflow-x: auto;
            margin: 0 auto;
            white-space: nowrap;
            background-color: #f0f0f0;
        }
        .thumbnails {
            display: inline-flex;
            align-items: center;
            margin-top: 10px;
            position: relative;
        }
        .thumbnails div {
            width: 50px;
            height: 60px;
            background-color: cyan;
            margin: 0 5px;
            cursor: pointer;
            border-radius: 5px;
            position: relative;
        }
        .thumbnails div.active::after {
            content: "";
            display: block;
            width: 100%;
            height: 10px;
            background-color: black;
            position: absolute;
            bottom: 0;
            left: 0;
            border-radius: 0 0 5px 5px;
        }
        .custom-dropdown select {
            padding: 10px;
            font-size: 16px;
            border: 4px solid #a8a8a8;
            border-radius: 15px;
            background-color: #f0f0f0;
            color: black;
            appearance: none;
            outline: none;
        }
        button {
            border: none;
            border-radius: 15px;
            padding: 10px 20px;
            font-size: 16px;
            text-transform: uppercase;
            vertical-align: middle;
            display: inline-block;
            margin: 5px;
            background-color: lightgreen;
            color: black;
        }
        button:hover {
            transform: scale(1.1);
            font-weight: bold;
        }
        .small-text {
            font-size: 0.8em;
            font-weight: normal;
        }
    </style>
</head>
<body>
    <div id="slideshow">
        <div class="image-container">
            <img id="currentImage" src="" alt="Slideshow Image">
        </div>
        <div class="thumbnails-wrapper">
            <div class="thumbnails" id="thumbnails">
                <!-- Thumbnails will be inserted here -->
            </div>
        </div>
        <div class="controls">
            <label for="speedControl">Speed Control:</label>
            <div class="custom-dropdown" style="display: inline-block; margin-left: 10px;">
                <select id="speedControl">
                    <option value="0.2">0.25x</option>
                    <option value="0.4">0.5x</option>
                    <option value="0.6">0.75x</option>
                    <option value="0.8" selected>1x</option>
                    <option value="1">1.25x</option>
                    <option value="1.2">1.5x</option>
                    <option value="1.3">1.75x</option>
                    <option value="1.4">2x</option>
                </select>
            </div> 
        </div>
        <div class="controls">
            <button id="previousImage">Previous</button>
            <button id="nextImage">Next</button>
            <button id="pause">Pause</button>
            <button id="resume"><span class="small-text">Resume</span> Play</button>
            <button id="reset"><span class="small-text">Restart</span> Start</button>
            <button id="home">Home</button>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <script src="script.js"></script>
</body>
</html>
