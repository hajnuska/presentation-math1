console.log("A script.js fájl sikeresen betöltődött.");

// CSV fájl beolvasása és adatok feldolgozása
async function loadCSV() {
    const response = await fetch('https://github.com/hajnus/presentation-with-image-text/raw/main/data.csv'); // CSV fájl helye
    const data = await response.text();
    return data;
}

function parseCSV(data) {
    const lines = data.split('\n');
    const result = [];
    
    // Az első sor a fejléc, így azt kihagyjuk
    for (let i = 1; i < lines.length; i++) {
        const [index, text] = lines[i].split(',');
        if (index && text) {
            if (index == 3 || index == 8) {
                // Ha az index 3 vagy 8, szöveget tartalmaz
                result.push({
                    src: null, // Kép nem szükséges
                    text: text.replace(/"/g, '').trim(), // Eltávolítjuk az idézőjeleket
                    isText: true // Jelöljük, hogy szöveget tartalmaz
                });
            } else {
                // Egyébként kép URL
                result.push({
                    src: `https://github.com/hajnus/presentation-with-image-text/raw/main/images/image${index}.png`,
                    text: text.replace(/"/g, '').trim(),
                    isText: false // Kép
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
    let isSpeaking = false; // Azt jelzi, hogy a szöveg felolvasása folyamatban van
    let currentUtterance = null; // Aktuális felolvasás tárolása

    const imageContainer = document.getElementById('currentImage');
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
        if (image.isText) {
            thumb.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="#ddd"/><text x="50" y="30" font-size="12" text-anchor="middle" fill="#333">PRÓBA</text></svg>';
        } else {
            thumb.src = image.src; // Kép forrása
        }
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
        const image = images[currentIndex];
        
        if (image.isText) {
            imageContainer.style.backgroundImage = ''; // Háttérkép eltávolítása
            imageContainer.style.backgroundColor = '#ddd'; // Háttér színe
            imageContainer.innerHTML = '<div style="font-size: 30px; font-weight: bold; color: #333; text-align: center; padding-top: 20px;">PRÓBA</div>'; // Szöveg beállítása
            currentText.innerHTML = ''; // Szöveg eltávolítása
        } else {
            imageContainer.style.backgroundImage = `url(${image.src})`; // Háttérkép beállítása
            imageContainer.style.backgroundColor = ''; // Háttér színének eltávolítása
            imageContainer.innerHTML = ''; // Szöveg eltávolítása
            currentText.innerHTML = image.text; // Diavetítés szövege
        }
        updateThumbnails();
        if (!isPaused) {
            speakText(image.text);
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
            speechSynthesis.cancel(); // A felolvasás azonnali leállítása
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
        window.location.reload(); // Az oldal újratöltése
    });

    // Kezdődia
    showSlide(currentIndex);
}

// Inicializálás
initialize();
