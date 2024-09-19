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

let images = [];
let currentIndex = 0;
let isPaused = false;
let isSpeaking = false;
let currentUtterance = null;
let speechSpeed = 1.0;

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
        generateThumbnails();
        showSlide(currentIndex);
    } catch (error) {
        console.error("Hiba a CSV betöltésekor:", error);
    }
}

// Generate thumbnails for navigation
function generateThumbnails() {
    thumbnailsContainer.innerHTML = '';
    images.forEach((image, index) => {
        const thumb = document.createElement('div');
        thumb.dataset.index = index;
        thumb.style.backgroundColor = 'lightgray';
        thumb.style.width = '30px';
        thumb.style.height = '60px';
        thumb.style.cursor = 'pointer';
        thumb.addEventListener('click', () => handleNavigation(index));
        thumbnailsContainer.appendChild(thumb);
    });
    updateThumbnailSelection();
}

// Update the visual selection of the current thumbnail
function updateThumbnailSelection() {
    const thumbnails = document.querySelectorAll('#thumbnails div');
    thumbnails.forEach((thumb, idx) => {
        thumb.classList.toggle('active', idx === currentIndex);
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
            const pageIndex = 1; // Here you can set the page number you want to render
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
                currentImage.src = canvas.toDataURL(); // Convert canvas to image data URL
                updateThumbnailSelection();
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
    currentUtterance.rate = speechSpeed;
    
    // Wait for the speech to finish before proceeding
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

    // Speak the text
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

// Update speech rate from the speed control input
function updateSpeed() {
    speechSpeed = parseFloat(speedControl.value);
    if (isSpeaking && currentUtterance) {
        currentUtterance.rate = speechSpeed;
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
speedControl.addEventListener('change', updateSpeed);

// Initialize the presentation
fetchCSV();
