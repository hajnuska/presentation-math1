console.log("A script.js fájl sikeresen betöltődött.");

// A képek és szövegek betöltése
async function loadSlides() {
    const response = await fetch('slides-data.csv'); // CSV fájl elérési útja
    const text = await response.text();
    const lines = text.split('\n');

    return lines.slice(1).map(line => {
        const [index, src, text] = line.split(',');
        return {
            src: `images/${src.trim()}`, // Képek elérési útja
            text: text ? text.trim() : `Ez a(z) ${index} kép.` // Alapértelmezett szöveg
        };
    });
}

let images = [];
let currentIndex = 0;
let isPaused = false;
let isSpeaking = false; // Azt jelzi, hogy a szöveg felolvasása folyamatban van
let currentUtterance = null; // Aktuális felolvasás tárolása

const currentImage = document.getElementById('currentImage');
const currentText = document.getElementById('currentText');
const thumbnailsContainer = document.getElementById('thumbnails');
const pauseButton = document.getElementById('pause');
const resumeButton = document.getElementById('resume');
const resetButton = document.getElementById('reset');
const nextButton = document.getElementById('nextImage');
const previousButton = document.getElementById('previousImage');
const homeButton = document.getElementById('home');

// Induláskor a diák betöltése és az első kép megjelenítése
loadSlides().then(loadedImages => {
    images = loadedImages;

    // Thumbnails generálása
    images.forEach((image, index) => {
        const thumb = document.createElement('img');
        thumb.src = image.src;
        thumb.dataset.index = index; // Tároljuk az indexet a thumbnailen
        thumb.addEventListener('click', () => {
            handleNavigation(index);
        });
        thumbnailsContainer.appendChild(thumb);
    });

    showSlide(0); // Első kép megjelenítése
});

function updateThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnails img');
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentIndex);
    });
    centerThumbnail(currentIndex); // Thumbnail sáv középre igazítása
}

function centerThumbnail(index) {
    const thumbnails = document.querySelectorAll('.thumbnails img');
    const thumbnailWidth = thumbnails[0].clientWidth;
    const thumbnailsWidth = thumbnailsContainer.clientWidth;
    const thumbnailPosition = thumbnails[index].offsetLeft;

    // A thumbnail sávot úgy görgetjük, hogy a kiválasztott thumbnail középen legyen
    thumbnailsContainer.scrollLeft = thumbnailPosition - (thumbnailsWidth / 2) + (thumbnailWidth / 2);
}

// Diavetítés frissítése
function showSlide(index) {
    currentIndex = index;
    currentImage.src = images[currentIndex].src;
    currentText.innerHTML = images[currentIndex].text;
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

    const voices = await getVoice();
    const maleVoice = voices.find(voice => voice.lang === 'hu-HU' && voice.name.toLowerCase().includes('male'));

    if (maleVoice) {
        utterance.voice = maleVoice; // Férfi hang kiválasztása
    }

    utterance.onend = () => {
        isSpeaking = false; // Szöveg befejeződött
        if (!isPaused) {
            nextSlide(); // Amint végez a felolvasással, automatikusan megy a következőre
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
        currentIndex = (currentIndex + 1) % images.length;
        showSlide(currentIndex);
    }
}

function previousSlide() {
    if (!isPaused) {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showSlide(currentIndex);
    }
}

function handleNavigation(index) {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel(); // Megakadályozzuk a szöveg további felolvasását
    }
    currentIndex = index;
    showSlide(currentIndex);
}

pauseButton.addEventListener('click', () => {
    isPaused = true;
    if (isSpeaking && currentUtterance) {
        speechSynthesis.pause(); // Felolvasás megállítása
    }
});

resumeButton.addEventListener('click', () => {
    isPaused = false;
    if (isSpeaking && currentUtterance) {
        speechSynthesis.resume(); // Felolvasás folytatása
    } else {
        nextSlide(); // Ha nem volt felolvasás, ugorjunk a következőre
    }
});

resetButton.addEventListener('click', () => {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel(); // Megakadályozzuk a szöveg további felolvasását
    }
    currentIndex = 0;
    showSlide(currentIndex);
});

nextButton.addEventListener('click', nextSlide);
previousButton.addEventListener('click', previousSlide);
homeButton.addEventListener('click', () => {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel(); // Megakadályozzuk a szöveg további felolvasását
    }
    window.location.href = 'index.html'; // Visszatérés a kezdőlapra
});
