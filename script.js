console.log("A script.js fájl sikeresen betöltődött.");

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const currentImage = document.getElementById('currentImage');
const thumbnailsContainer = document.getElementById('thumbnails');
const pauseButton = document.getElementById('pause');
const resumeButton = document.getElementById('resume');
const resetButton = document.getElementById('reset');
const nextButton = document.getElementById('nextImage');
const previousButton = document.getElementById('previousImage');
const homeButton = document.getElementById('home');
const speedControl = document.getElementById('speedControl');
const speedValueDisplay = document.getElementById('speedValue');

let images = [];
let currentIndex = 0;
let isPaused = false;
let isSpeaking = false;
let currentUtterance = null;
let speechSpeed = 1.0;

async function fetchCSV() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/hajnuska/presentation-math1/main/data.csv');
        const text = await response.text();
        const rows = text.split('\n').slice(1);
        images = rows.map(row => {
            const [index, src, text] = row.split(',').map(value => value ? value.trim().replace(/^"|"$/g, '') : '');
            return { index: parseInt(index, 10), src: `https://raw.githubusercontent.com/hajnuska/presentation-math1/main/images/${src}`, text };
        }).filter(image => image.index);
        console.log("Images:", images);
        generateThumbnails();
        showSlide(currentIndex);
    } catch (error) {
        console.error("Hiba a CSV betöltésekor:", error);
    }
}

async function generateThumbnails() {
    thumbnailsContainer.innerHTML = '';
    for (const [index] of images.entries()) {
        const thumb = document.createElement('div');
        thumb.dataset.index = index;
        thumb.style.width = '100px';
        thumb.style.height = '60px';
        thumb.style.backgroundColor = 'lightgray';
        thumb.style.margin = '0 5px';
        thumb.style.cursor = 'pointer';
        thumb.style.borderRadius = '5px';
        if (index === currentIndex) {
            thumb.style.border = '3px solid blue';
        } else {
            thumb.style.border = '1px solid gray';
        }
        thumb.addEventListener('click', () => handleNavigation(index));
        thumbnailsContainer.appendChild(thumb);
    }
}

function centerThumbnail(index) {
    const thumbnails = document.querySelectorAll('#thumbnails div');
    const thumbnailWidth = thumbnails[0].clientWidth;
    const thumbnailsWidth = thumbnailsContainer.clientWidth;
    const thumbnailPosition = thumbnails[index].offsetLeft;
    thumbnailsContainer.scrollLeft = thumbnailPosition - (thumbnailsWidth / 2) + (thumbnailWidth / 2);
}

function showSlide(index) {
    console.log("Show Slide Index:", index);
    if (images[index]) {
        currentIndex = index;
        currentImage.src = images[currentIndex].src;
        console.log("Current Image URL:", currentImage.src);
        generateThumbnails();
        if (!isPaused) {
            speakText(images[currentIndex].text);
        }
    } else {
        console.error("Nincs kép az indexen:", index);
    }
}

async function showSlide(index) {
    if (images[index]) {
        currentIndex = index;
        const pdfUrl = images[currentIndex].src;
        try {
            // PDF betöltése
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);  // Az első oldal betöltése
            const scale = 1.5;
            const viewport = page.getViewport({ scale });

            // Canvas létrehozása és beállítása
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            document.querySelector('.image-container').innerHTML = ''; // Ürítse ki a container-t
            document.querySelector('.image-container').appendChild(canvas);

            // PDF renderelése a canvas-ra
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;

            // Canvas adat URL beállítása
            currentImage.src = canvas.toDataURL();

        } catch (error) {
            console.error("Hiba a PDF betöltésekor:", error);
        }
    } else {
        console.error("Nincs kép az indexen:", index);
    }
}

async function speakText(text) {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
    utterance.lang = 'hu-HU';
    utterance.rate = speechSpeed;
    const voices = await getVoice();
    const maleVoice = voices.find(voice => voice.lang === 'hu-HU' && voice.name.toLowerCase().includes('male'));
    if (maleVoice) {
        utterance.voice = maleVoice;
    }
    utterance.onend = () => {
        isSpeaking = false;
        if (!isPaused) {
            nextSlide();  // Amikor vége a felolvasásnak, automatikusan lép a következő diára
        }
    };
    speechSynthesis.speak(utterance);
    currentUtterance = utterance;
    isSpeaking = true;
}

async function getVoice() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const voices = speechSynthesis.getVoices();
            if (voices.length) {
                clearInterval(interval);
                resolve(voices);
            }
        }, 100);
    });
}

function handleNavigation(index) {
    if (index >= 0 && index < images.length) {
        showSlide(index);
    }
}

function nextSlide() {
    if (currentIndex < images.length - 1) {
        showSlide(currentIndex + 1);
    }
}

function previousSlide() {
    if (currentIndex > 0) {
        showSlide(currentIndex - 1);
    }
}

function togglePause() {
    isPaused = !isPaused;
    pauseButton.style.display = isPaused ? 'none' : 'inline-block';
    resumeButton.style.display = isPaused ? 'inline-block' : 'none';
    if (isPaused) {
        speechSynthesis.pause();
    } else {
        speechSynthesis.resume();
    }
}

function resetSlideshow() {
    currentIndex = 0;
    showSlide(currentIndex);
}

function goHome() {
    location.href = 'index.html';
}

function updateSpeed() {
    speechSpeed = parseFloat(speedControl.value);
}

document.addEventListener('DOMContentLoaded', fetchCSV);
pauseButton.addEventListener('click', togglePause);
resumeButton.addEventListener('click', togglePause);
resetButton.addEventListener('click', resetSlideshow);
nextButton.addEventListener('click', nextSlide);
previousButton.addEventListener('click', previousSlide);
homeButton.addEventListener('click', goHome);
speedControl.addEventListener('change', updateSpeed);
speedControl.dispatchEvent(new Event('change'));
