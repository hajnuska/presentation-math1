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

if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

// Fetch CSV data and initialize the slideshow
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
        populateVoiceList(); // Hangok betöltése
        showSlide(currentIndex);
    } catch (error) {
        console.error("Hiba a CSV betöltésekor:", error);
    }
}

// Populate the voice select dropdown
function populateVoiceList() {
    let voices = speechSynthesis.getVoices();

    // Ellenőrizzük, hogy legalább 5 hang van-e
    if (voices.length >= 5) {
        selectedVoices = voices.slice(0, 5); // Az első 5 hangot választjuk ki
    } else {
        selectedVoices = voices; // Ha nincs 5 hang, az elérhető hangokat használjuk
    }

    voiceSelect.innerHTML = ''; // Legördülő lista törlése

    // A hangok hozzáadása a legördülő menühöz
    selectedVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

// Show the current slide and start speaking the text
async function showSlide(index) {
    if (images[index]) {
        currentIndex = index;
        const pdfUrl = images[currentIndex].src;
        const pdfText = images[currentIndex].text;
        try {
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            const pageIndex = 1; // Page number to render
            if (pageIndex <= pdf.numPages) {
                const page = await pdf.getPage(pageIndex);
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                document.querySelector('.image-container').innerHTML = '';
                document.querySelector('.image-container').appendChild(canvas);
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await page.render(renderContext).promise;
                currentImage.src = canvas.toDataURL();
                if (pdfText && !isSpeaking) {
                    await speakText(pdfText);
                }
            } else {
                console.error("A megadott oldal indexe nem létezik:", pageIndex);
            }
        } catch (error) {
            console.error("Hiba a PDF betöltésekor:", error);
        }
    } else {
        console.error("Nincs kép az indexen:", index);
    }
}

// Speak the text and wait for the speech to end before moving to the next slide
async function speakText(text) {
    if (isSpeaking && currentUtterance) {
        speechSynthesis.cancel();
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'hu-HU';

    const selectedVoice = voiceSelect.value;
    const voices = speechSynthesis.getVoices();
    currentUtterance.voice = voices.find(voice => voice.name === selectedVoice);

    currentUtterance.onend = () => {
        isSpeaking = false;
        if (!isPaused) {
            nextSlide();
        }
    };
    
    currentUtterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        isSpeaking = false;
    };

    speechSynthesis.speak(currentUtterance);
    isSpeaking = true;
}

// Handle navigation between slides
function handleNavigation(index) {
    if (index >= 0 && index < images.length) {
        showSlide(index);
    }
}

// Move to the next slide after the speech ends
function nextSlide() {
    if (currentIndex < images.length - 1) {
        showSlide(currentIndex + 1);
    }
}

// Move to the previous slide
function previousSlide() {
    if (currentIndex > 0) {
        showSlide(currentIndex - 1);
    }
}

// Add event listeners to control buttons
pauseButton.addEventListener('click', () => {
    if (isSpeaking) {
        speechSynthesis.pause();
        isPaused = true;
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'inline';
    }
});

resumeButton.addEventListener('click', () => {
    if (isPaused) {
        speechSynthesis.resume();
        isPaused = false;
        resumeButton.style.display = 'none';
        pauseButton.style.display = 'inline';
    }
});

resetButton.addEventListener('click', () => {
    showSlide(0);
    if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
    }
});

nextButton.addEventListener('click', nextSlide);
previousButton.addEventListener('click', previousSlide);
homeButton.addEventListener('click', () => showSlide(0));

// Initialize the presentation
fetchCSV();

// Re-populate voice list when voices are loaded
if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}
