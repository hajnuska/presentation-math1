console.log("A script.js fájl sikeresen betöltődött.");

// Képek és szövegek betöltése a CSV fájlból
const images = [
    { src: 'images/image1.png', text: "Most megnézzük, mit jelentenek ezek . <span class='highlight'>az aláhúzott kifejezések.</span>" },
    { src: 'images/image2.png', text: "Ez most lehet, <span class='highlight'>bonyolultnak</span> tünik" },
    { src: 'images/image3.png', text: "de elképzelhető, hogy <span class='highlight'>könnyen</span> megérted" },
    { src: 'images/image4.png', text: "hogy ez csupán <span class='highlight'>egy próba</span>" },
    { src: 'images/image5.png', text: "amit szeretnék <span class='highlight'>a legjobban megcsinálni,</span> hogy később minden" },
    { src: 'images/image6.png', text: "<span class='highlight'>tökéletesen</span> sikerülhessen" },
    { src: 'images/image7.png', text: "<span class='highlight'>ez igeeeeeeeeen!</span>" },
    { src: 'images/image8.png', text: "<span class='highlight'>hurrrrráááá!</span>" },
    { src: 'images/image9.png', text: "<span class='highlight'>juhúúúúúú juhúú a birkatánc</span>" },
    { src: 'images/image10.png', text: "ez aztán <span class='highlight'>nem semmmmmmi</span>" }
    // További képek és szövegek itt adhatók hozzá
];

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

// Thumbnails generálása
images.forEach((image, index) => {
    const thumb = document.createElement('img');
    thumb.src = image.src; // Kép forrása
    thumb.dataset.index = index; // Tároljuk az indexet a thumbnailen
    thumb.addEventListener('click', () => {
        handleNavigation(index);
    });
    thumbnailsContainer.appendChild(thumb);
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
    currentImage.src = images[currentIndex].src; // Kép frissítése
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
            speechSynthesis.addEventListener('voiceschanged', () => {
                resolve(speechSynthesis.getVoices());
            });
        }
    });
}

function handleNavigation(index) {
    showSlide(index);
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % images.length;
    showSlide(currentIndex);
}

function previousSlide() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showSlide(currentIndex);
}

function pauseSlideshow() {
    isPaused = true;
    pauseButton.style.display = 'none';
    resumeButton.style.display = 'inline-block';
}

function resumeSlideshow() {
    isPaused = false;
    resumeButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
    nextSlide();
}

function resetSlideshow() {
    isPaused = false;
    currentIndex = 0;
    showSlide(currentIndex);
}

function goHome() {
    window.location.href = '/'; // Visszavisz a kezdőlapra (ez módosítható)
}

nextButton.addEventListener('click', nextSlide);
previousButton.addEventListener('click', previousSlide);
pauseButton.addEventListener('click', pauseSlideshow);
resumeButton.addEventListener('click', resumeSlideshow);
resetButton.addEventListener('click', resetSlideshow);
homeButton.addEventListener('click', goHome);

// Induló diavetítés
showSlide(currentIndex);
