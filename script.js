console.log("A script.js fájl sikeresen betöltődött.");

// A képek és szövegek betöltése
async function loadSlides() {
    // Képek és szövegek betöltése a táblázatból
    const response = await fetch('slides-data.csv'); // vagy a táblázat URL-je
    const text = await response.text();
    const lines = text.split('\n');
    
    return lines.slice(1).map(line => {
        const [index, src, text] = line.split(',');
        return {
            src: `images/${src}`, // Az "images" mappából töltjük be a képeket
            text: text || `Ez a(z) ${index} kép.` // Alapértelmezett szöveg
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
    showSlide(index);
    if (!isPaused) {
        speakText(images[index].text); // Az új kép szövegének felolvasása
    }
}

// Pause funkció
pauseButton.addEventListener('click', () => {
    isPaused = true;
    pauseButton.classList.add('disabled'); // Pause gomb állapotának módosítása
    resumeButton.classList.remove('disabled'); // Resume gomb engedélyezése
    resetButton.classList.add('disabled'); // Reset gomb letiltása
    if (isSpeaking && currentUtterance) {
        speechSynthesis.pause(); // A felolvasás megállítása
    }
});

// Resume funkció
resumeButton.addEventListener('click', () => {
    isPaused = false;
    pauseButton.classList.remove('disabled'); // Pause gomb engedélyezése
    resumeButton.classList.add('disabled'); // Resume gomb letiltása
    resetButton.classList.remove('disabled'); // Reset gomb engedélyezése
    if (!isSpeaking) {
        speakText(images[currentIndex].text); // Az aktuális kép szövegének felolvasása
    } else if (currentUtterance) {
        speechSynthesis.resume(); // A felolvasás folytatása
    }
});

// Reset funkció
resetButton.addEventListener('click', () => {
    isPaused = false;
    currentIndex = 0;
    showSlide(currentIndex);
    pauseButton.classList.remove('disabled'); // Pause gomb engedélyezése
    resumeButton.classList.add('disabled'); // Resume gomb letiltása
    resetButton.classList.add('disabled'); // Reset gomb állapotának módosítása
    if (!isSpeaking) {
        nextSlide(); // Folytatás a következő képpel a reset után
    }
});

nextButton.addEventListener('click', () => {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel(); // Megakadályozzuk a szöveg további felolvasását
    }
    nextSlide();
    if (!isPaused) {
        speakText(images[currentIndex].text); // Az aktuális kép szövegének felolvasása
    }
});

previousButton.addEventListener('click', () => {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel(); // Megakadályozzuk a szöveg további felolvasását
    }
    previousSlide();
    if (!isPaused) {
        speakText(images[currentIndex].text); // Az aktuális kép szövegének felolvasása
    }
});

homeButton.addEventListener('click', () => {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel(); // Megakadályozzuk a szöveg további felolvasását
    }
    window.location.href = 'index.html';
});
