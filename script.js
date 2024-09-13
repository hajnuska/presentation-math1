console.log("A script.js fájl sikeresen betöltődött.");

async function loadCSV() {
    const response = await fetch('https://github.com/hajnus/presentation-with-image-text/raw/main/data.csv');
    const data = await response.text();
    return data;
}

function parseCSV(data) {
    const lines = data.split('\n');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const [index, text] = lines[i].split(',');
        if (index && text) {
            if (index >= 3 && index <= 8) {
                result.push({
                    src: null,
                    text: text.replace(/"/g, '').trim(),
                    isText: true
                });
            } else {
                result.push({
                    src: `https://github.com/hajnus/presentation-with-image-text/raw/main/images/image${index}.png`,
                    text: text.replace(/"/g, '').trim(),
                    isText: false
                });
            }
        }
    }
    return result;
}

async function initialize() {
    const csvData = await loadCSV();
    const images = parseCSV(csvData);

    let currentIndex = 0;
    let isPaused = false;
    let isSpeaking = false;
    let currentUtterance = null;

    const imageContainer = document.getElementById('imageContainer');
    const thumbnailsContainer = document.getElementById('thumbnails');
    const pauseButton = document.getElementById('pause');
    const resumeButton = document.getElementById('resume');
    const resetButton = document.getElementById('reset');
    const nextButton = document.getElementById('nextImage');
    const previousButton = document.getElementById('previousImage');
    const homeButton = document.getElementById('home');

    images.forEach((image, index) => {
        const thumb = document.createElement('img');
        thumb.src = image.isText
            ? 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="#ddd"/><text x="50" y="30" font-size="12" text-anchor="middle" fill="#333">PRÓBA</text></svg>'
            : image.src;
        thumb.dataset.index = index;
        thumb.addEventListener('click', () => handleNavigation(index));
        thumbnailsContainer.appendChild(thumb);
    });

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
        const image = images[currentIndex];

        if (image.isText) {
            imageContainer.style.backgroundImage = ''; 
            imageContainer.style.backgroundColor = '#ddd'; 
            imageContainer.innerHTML = `<div style="font-size: 30px; font-weight: bold; color: #333; text-align: center; padding-top: 20px;">${image.text}</div>`; 
        } else {
            imageContainer.style.backgroundImage = `url(${image.src})`; 
            imageContainer.style.backgroundColor = '#fff';  
            imageContainer.innerHTML = ''; 
        }
        updateThumbnails();
        if (!isPaused && !image.isText) {
            speakText(image.text);
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
            speechSynthesis.cancel(); 
        }
        showSlide(index);
        if (!isPaused && !images[index].isText) {
            speakText(images[index].text); 
        }
    }

    pauseButton.addEventListener('click', () => {
        isPaused = true;
        pauseButton.classList.add('disabled'); 
        resumeButton.classList.remove('disabled'); 
        resetButton.classList.add('disabled'); 
        if (isSpeaking && currentUtterance) {
            speechSynthesis.cancel(); 
        }
    });

    resumeButton.addEventListener('click', () => {
        isPaused = false;
        pauseButton.classList.remove('disabled'); 
        resumeButton.classList.add('disabled'); 
        resetButton.classList.remove('disabled'); 
        if (!isSpeaking) {
            speakText(images[currentIndex].text); 
        } else if (currentUtterance) {
            speechSynthesis.resume(); 
        }
    });

    resetButton.addEventListener('click', () => {
        isPaused = false;
        currentIndex = 0;
        showSlide(currentIndex);
        pauseButton.classList.remove('disabled'); 
        resumeButton.classList.add('disabled'); 
        resetButton.classList.add('disabled'); 
        if (!isSpeaking) {
            nextSlide(); 
        }
    });

    nextButton.addEventListener('click', () => {
        if (isSpeaking && currentUtterance) {
            speechSynthesis.cancel(); 
        }
        nextSlide();
        if (!isPaused && !images[currentIndex].isText) {
            speakText(images[currentIndex].text); 
        }
    });

    previousButton.addEventListener('click', () => {
        if (isSpeaking && currentUtterance) {
            speechSynthesis.cancel(); 
        }
        previousSlide();
        if (!isPaused && !images[currentIndex].isText) {
            speakText(images[currentIndex].text); 
        }
    });

    homeButton.addEventListener('click', () => {
        window.location.reload(); 
    });

    showSlide(currentIndex);
}

initialize();
