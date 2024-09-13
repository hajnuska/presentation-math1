console.log("A script.js fájl sikeresen betöltődött.");

let currentIndex = 0;
let isPaused = false;
let isSpeaking = false;
let currentUtterance = null;

const currentImage = document.getElementById('currentImage');
const currentText = document.getElementById('currentText');
const thumbnailsContainer = document.getElementById('thumbnails');
const pauseButton = document.getElementById('pause');
const resumeButton = document.getElementById('resume');
const resetButton = document.getElementById('reset');
const nextButton = document.getElementById('nextImage');
const previousButton = document.getElementById('previousImage');
const homeButton = document.getElementById('home');

// Képek és szövegek listája (CSV-ből beolvasva)
let slides = [];

// CSV beolvasás
Papa.parse("data.csv", {
    download: true,
    header: true,
    complete: function(results) {
        slides = results.data.map(row => ({
            src: `images/image${i + 1}.png`, // Kép elérési útja
            text: `Ez a(z) ${i + 1}. kép. <span class="highlight">Ez kiemelt szöveg.</span>`
        }));
        generateThumbnails();
        showSlide(0); // Első kép megjelenítése
    }
});

// Thumbnails generálása
function generateThumbnails() {
    slides.forEach((slide, index) => {
        const thumb = document.createElement('img');
        thumb.src = slide.src;
        thumb.dataset.index = index; // Tároljuk az indexet a thumbnailen
        thumb.addEventListener('click', () => {
            handleNavigation(index);
        });
        thumbnailsContainer.appendChild(thumb);
    });
}

function updateThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnails img');
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentIndex);
    });
    centerThumbnail(currentIndex);
}

function centerThumbnail(index) {
    const thumbnails = document.querySelectorAll('.thumbnails img');
    const thumbnailWidth = thumbnails[0].clientWidth;
    const thumbnailsWidth = thumbnailsContainer.clientWidth;
    const thumbnailPosition = thumbnails[index].offsetLeft;
    thumbnailsContainer.scrollLeft = thumbnailPosition - (thumbnailsWidth / 2) + (thumbnailWidth / 2);
}

function showSlide(index) {
    currentIndex = index;
    currentImage.src = slides[currentIndex].src;
    currentText.innerHTML = slides[currentIndex].text;
    updateThumbnails();
    if (!isPaused) {
        speakText(slides[currentIndex].text);
    }
}

async function speakText(text) {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
    utterance.lang = 'hu-HU';

    const voices = await getVoice();
    const maleVoice = voices.find(voice => voice.lang === 'hu-HU' && voice.name.toLowerCase().includes('male'));

    if (maleVoice) {
        utterance.voice = maleVoice;
    }

    utterance.onend = () => {
        isSpeaking = false;
        if (!isPaused) {
            nextSlide();
        }
    };

    isSpeaking = true;
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

function getVoice() {
    return new Promise(resolve => {
        const voices = speechSynthesis.getVoices();
        if (voices.length) {
            resolve(voices);
        } else {
            speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
        }
    });
}

function nextSlide() {
    if (!isPaused) {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }
}

function previousSlide() {
    if (!isPaused) {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex);
    }
}

function handleNavigation(index) {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel();
    }
    showSlide(index);
    if (!isPaused) {
        speakText(slides[index].text);
    }
}

pauseButton.addEventListener('click', () => {
    isPaused = true;
    if (isSpeaking && currentUtterance) {
        speechSynthesis.pause();
    }
});

resumeButton.addEventListener('click', () => {
    isPaused = false;
    if (!isSpeaking) {
        speakText(slides[currentIndex].text);
    } else if (currentUtterance) {
        speechSynthesis.resume();
    }
});

resetButton.addEventListener('click', () => {
    isPaused = false;
    currentIndex = 0;
    showSlide(currentIndex);
});

nextButton.addEventListener('click', () => {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel();
    }
    nextSlide();
});

previousButton.addEventListener('click', () => {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel();
    }
    previousSlide();
});

homeButton.addEventListener('click', () => {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel();
    }
    window.location.href = 'index.html';
});

// Első diánál kezdés
showSlide(0);
