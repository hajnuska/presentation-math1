console.log("A script.js fájl sikeresen betöltődött.");

document.addEventListener('DOMContentLoaded', () => {
    fetch('https://github.com/hajnus/presentation-with-image-text/blob/main/data.csv')
        .then(response => response.text())
        .then(text => Papa.parse(text, {
            header: true,
            complete: (results) => {
                const images = results.data.map(row => ({
                    src: `https://github.com/hajnus/presentation-with-image-text/raw/main/images/${row.src}`, // Frissítve a helyes URL
                    text: row.text
                }));

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

                // Thumbnails generálása
                images.forEach((image, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = image.src;
                    thumb.dataset.index = index;
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
                    currentImage.src = images[currentIndex].src;
                    currentText.innerHTML = images[currentIndex].text;
                    updateThumbnails();
                    if (!isPaused) {
                        speakText(images[currentIndex].text);
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
                    if (!isPaused) {
                        speakText(images[index].text);
                    }
                }

                pauseButton.addEventListener('click', () => {
                    isPaused = true;
                    pauseButton.classList.add('disabled');
                    resumeButton.classList.remove('disabled');
                    resetButton.classList.add('disabled');
                    if (isSpeaking && currentUtterance) {
                        speechSynthesis.pause();
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
                    if (!isPaused) {
                        speakText(images[currentIndex].text);
                    }
                });

                previousButton.addEventListener('click', () => {
                    if (isSpeaking && currentUtterance) {
                        speechSynthesis.cancel();
                    }
                    previousSlide();
                    if (!isPaused) {
                        speakText(images[currentIndex].text);
                    }
                });

                homeButton.addEventListener('click', () => {
                    if (isSpeaking && currentUtterance) {
                        speechSynthesis.cancel();
                    }
                    window.location.href = 'index.html';
                });

                showSlide(0);
            }
        });
});
