console.log("A script.js fájl sikeresen betöltődött.");


// Elementek lekérése
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
let isSpeaking = false; // Azt jelzi, hogy a szöveg felolvasása folyamatban van
let currentUtterance = null; // Aktuális felolvasás tárolása
let speechSpeed = 1.0; // Alapértelmezett sebesség

function updateSpeed() {
    speechSpeed = parseFloat(speedControl.value);
    speedValueDisplay.textContent = `${speechSpeed}x`; // Csak a sebesség érték kiírása "x" jellel
}

// CSV fájl betöltése
async function fetchCSV() {
    const response = await fetch('https://raw.githubusercontent.com/hajnuska/presentation-math1/main/data.csv');
    const text = await response.text();
    const rows = text.split('\n').slice(1); // Az első sor a fejléc
    images = rows.map(row => {
        const [index, src, text] = row.split(',').map(value => value ? value.trim().replace(/^"|"$/g, '') : '');
        return { index: parseInt(index, 10), src: `https://raw.githubusercontent.com/hajnuska/presentation-math1/main/images/${src}.pdf`, text };
    }).filter(image => image.index); // Eltávolítjuk az üres sorokat
    generateThumbnails();
    showSlide(currentIndex);
}

async function generateThumbnails() {
    thumbnailsContainer.innerHTML = ''; // Tisztítjuk a tartalmat

    for (const [index, image] of images.entries()) {
        const thumb = document.createElement('img');
        thumb.src = await generatePDFThumbnail(image.src, 1); // Első oldal miniatűr

        thumb.dataset.index = index; // Tároljuk az indexet a thumbnailen
        thumb.addEventListener('click', () => {
            handleNavigation(index);
        });

        thumbnailsContainer.appendChild(thumb);
    }
}

async function generatePDFThumbnail(pdfUrl, pageNumber) {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);

    const scale = 0.2; 
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    return canvas.toDataURL(); // Visszaadja a canvas mintadat URL-t
}

function centerThumbnail(index) {
    const thumbnails = document.querySelectorAll('#thumbnails img');
    const thumbnailWidth = thumbnails[0].clientWidth;
    const thumbnailsWidth = thumbnailsContainer.clientWidth;
    const thumbnailPosition = thumbnails[index].offsetLeft;

    // A thumbnail sávot úgy görgetjük, hogy a kiválasztott thumbnail középen legyen
    thumbnailsContainer.scrollLeft = thumbnailPosition - (thumbnailsWidth / 2) + (thumbnailWidth / 2);
}

function showSlide(index) {
    currentIndex = index;
    currentImage.src = images[currentIndex].src; // Az aktuális kép URL-jét használjuk
    updateThumbnails();
    if (!isPaused) {
        speakText(images[currentIndex].text);
    }
}

async function speakText(text) {
    if (isSpeaking && currentUtterance) {
        // Ha már beszélünk, állítsuk le az aktuális felolvasást
        speechSynthesis.cancel(); // Megakadályozzuk a szöveg további felolvasását
    }

    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '')); // eltávolítjuk a HTML tageket
    utterance.lang = 'hu-HU';
    utterance.rate = speechSpeed; // Sebesség beállítása

    const voices = await getVoice();
    const maleVoice = voices.find(voice => voice.lang === 'hu-HU' && voice.name.toLowerCase().includes('male'));

    if (maleVoice) {
        utterance.voice = maleVoice; // Férfi hang kiválasztása
    }

    utterance.onend = () => {
        isSpeaking = false; // Szöveg befejeződött
        if (!isPaused) {
            nextSlide(); // Amint végez a felolvasással, lépjen a következő slide-ra
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
    // Navigáljunk a kezdő oldalra, vagy végezzünk el bármilyen más szükséges műveletet
    location.href = 'index.html'; // Példa az aktuális oldal frissítésére
}

function updateSpeed() {
    speechSpeed = parseFloat(speedControl.value);
    speedValueDisplay.textContent = `${(speechSpeed * 100).toFixed(0)}%`;
}

// Event listeners
document.addEventListener('DOMContentLoaded', fetchCSV);
pauseButton.addEventListener('click', togglePause);
resumeButton.addEventListener('click', togglePause);
resetButton.addEventListener('click', resetSlideshow);
nextButton.addEventListener('click', nextSlide);
previousButton.addEventListener('click', previousSlide);
homeButton.addEventListener('click', goHome);
speedControl.addEventListener('change', updateSpeed);
speedControl.dispatchEvent(new Event('change')); // Initialize the speed display
