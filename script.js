console.log("A script.js fájl sikeresen betöltődött.");

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let selectedVoices = [];
const currentImage = document.getElementById('currentImage');
const pauseButton = document.getElementById('pause');
const resumeButton = document.getElementById('resume');
const resetButton = document.getElementById('reset');
const nextButton = document.getElementById('nextImage');
const previousButton = document.getElementById('previousImage');
const homeButton = document.getElementById('home');
const voiceSelect = document.getElementById('voiceSelect');

let images = [];
let currentIndex = 0;
let isPaused = false;
let isSpeaking = false;
let currentUtterance = null;
let thumbnails = []; // Thumbnail elemek eltárolása

// Hangok betöltése
function loadVoices() {
    let voices = speechSynthesis.getVoices();

    // Ha a hangok nem töltődtek be, próbáljuk újra
    if (voices.length === 0) {
        speechSynthesis.onvoiceschanged = loadVoices;
        return;
    }

    let hungarianVoices = voices.filter(voice => voice.lang === 'hu-HU');

    if (hungarianVoices.length >= 5) {
        selectedVoices = hungarianVoices.slice(0, 5);
    } else {
        selectedVoices = hungarianVoices;
    }

    voiceSelect.innerHTML = '';
    selectedVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

// Inicializáljuk a hangokat
loadVoices();

// Fetch CSV data and initialize the slideshow
async function fetchCSV() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/hajnuska/presentation-math1/main/data.csv');
        const text = await response.text();
        const rows = text.split('\n').slice(1);  // Töröljük az első sort (fejléc)
        
        // Képek URL generálása a fájlnév alapján
        images = rows.map(row => {
            const [index, filename, text] = row.split(',').map(value => value ? value.trim().replace(/^"|"$/g, '') : '');
            const imageURL = `https://raw.githubusercontent.com/hajnuska/presentation-math1/main/images/${filename}`;  // Kép URL generálása
            return { index: parseInt(index, 10), src: imageURL, text };
        }).filter(image => image.index);

        console.log("Images:", images);
        showSlide(currentIndex);
        generateThumbnails(); // Thumbnail-ek generálása
    } catch (error) {
        console.error("Hiba a CSV betöltésekor:", error);
    }
}

// Generate thumbnails
function generateThumbnails() {
    const thumbnailContainer = document.getElementById('thumbnails');
    thumbnailContainer.innerHTML = ''; // Töröljük a korábbi elemeket
    images.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.classList.add('thumbnail');
        
        // Thumbnail-re kattintás
        thumbnail.addEventListener('click', () => {
            setSelectedThumbnail(index);
        });

        thumbnailContainer.appendChild(thumbnail);
        thumbnails.push(thumbnail);
    });

    // Alapértelmezett thumbnail kijelölése
    setSelectedThumbnail(currentIndex);
}

// Kiválasztott thumbnail beállítása
function setSelectedThumbnail(index) {
    thumbnails.forEach(thumbnail => {
        thumbnail.classList.remove('selected');
        thumbnail.classList.remove('active');
    });

    thumbnails[index].classList.add('selected');
    thumbnails[index].classList.add('active');
}

// Show the current slide and start speaking the text
async function showSlide(index) {
    if (images[index]) {
        currentIndex = index;
        const imageURL = images[currentIndex].src;
        const pdfText = images[currentIndex].text;

        // Kép betöltése
        currentImage.src = imageURL;

        // Ha van szöveg, beszéltetés
        if (pdfText && !isSpeaking) {
            await speakText(pdfText);
        }
    } else {
        console.error("Nincs kép az indexen:", index);
    }
}

// Speak the text using the SpeechSynthesis API
async function speakText(text) {
    if (!text || isSpeaking) return;
    isSpeaking = true;

    // Ellenőrizzük, hogy a választott hang elérhető-e
    const selectedVoice = speechSynthesis.getVoices().find(voice => voice.name === voiceSelect.value);

    if (!selectedVoice) {
        console.error("Nincs kiválasztott megfelelő hang.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;

    // A beszéd végén folytatjuk a következő diával, ha nincs szünet
    utterance.onend = () => {
        isSpeaking = false;
        if (!isPaused) {
            nextSlide();
        }
    };

    speechSynthesis.speak(utterance);
}

// Go to the next slide
function nextSlide() {
    currentIndex = (currentIndex + 1) % images.length;
    showSlide(currentIndex);
}

// Go to the previous slide
function previousSlide() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showSlide(currentIndex);
}

// Pause the speech
function pauseSpeech() {
    if (isSpeaking) {
        speechSynthesis.pause();
        isPaused = true;
        resumeButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
    }
}

// Resume the speech
function resumeSpeech() {
    if (isSpeaking) {
        speechSynthesis.resume();
        isPaused = false;
        resumeButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
    }
}

// Reset the slideshow
function resetSlideshow() {
    currentIndex = 0;
    showSlide(currentIndex);
    isPaused = false;
    resumeButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
}

// Event listeners for buttons
nextButton.addEventListener('click', nextSlide);
previousButton.addEventListener('click', previousSlide);
pauseButton.addEventListener('click', pauseSpeech);
resumeButton.addEventListener('click', resumeSpeech);
resetButton.addEventListener('click', resetSlideshow);

// Fetch CSV when page loads
fetchCSV();
