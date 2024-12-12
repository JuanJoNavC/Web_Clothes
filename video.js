document.addEventListener('DOMContentLoaded', () => {
    const video = document.querySelector('.vid-player__video');
    const videoWrapper = document.querySelector('.vid-wrapper');
    const playPauseBtn = document.getElementById('play-pause');
    const forwardBtn = document.getElementById('forward');
    const backwardBtn = document.getElementById('backward');
    const muteUnmuteBtn = document.getElementById('mute-unmute');
    const fullscreenToggle = document.getElementById('fullscreen-toggle'); // Botón de pantalla completa
    const videoButtons = document.querySelectorAll('.vid-btn');
    const vidControls = document.querySelector('.vid-controls');
    let hideControlsTimeout;

    // Configuración inicial
    video.volume = 0.1; // Inicia con 10% del volumen
    video.load();

    // Ajustar el tamaño del contenedor basado en la orientación del video
    function adjustAspectRatio() {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        if (videoHeight > videoWidth) {
            // Video es vertical
            videoWrapper.classList.add('vertical');
            video.style.objectFit = 'contain'; // Ajustar contenido en vertical
        } else {
            // Video es horizontal
            videoWrapper.classList.remove('vertical');
            video.style.objectFit = 'cover'; // Rellenar en horizontal
        }
    }

    // Detectar cambios de video y ajustar el tamaño
    video.addEventListener('loadedmetadata', adjustAspectRatio);

    // Play/Pause button
    playPauseBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    // Forward button
    forwardBtn.addEventListener('click', () => {
        video.currentTime += 5;
    });

    // Backward button
    backwardBtn.addEventListener('click', () => {
        video.currentTime = Math.max(video.currentTime - 5, 0);
    });

    // Mute/Unmute button
    muteUnmuteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        muteUnmuteBtn.innerHTML = video.muted 
            ? '<i class="fas fa-volume-mute"></i>' 
            : '<i class="fas fa-volume-up"></i>';
    });

    // Fullscreen toggle
    fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            videoWrapper.requestFullscreen().then(() => {
                // Asegurar que el video no haga zoom
                if (videoWrapper.classList.contains('vertical')) {
                    video.style.objectFit = 'contain';
                }
            }).catch(err => {
                console.error(`Error al entrar en pantalla completa: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                // Restaurar el estilo predeterminado
                adjustAspectRatio();
            }).catch(err => {
                console.error(`Error al salir de pantalla completa: ${err.message}`);
            });
        }
    });

    // Mostrar los controles y reiniciar el temporizador
    function showControls() {
        vidControls.classList.remove('hide-controls');
        clearTimeout(hideControlsTimeout); // Reinicia el temporizador
        hideControlsTimeout = setTimeout(hideControls, 5000); // Ocultar tras 5 segundos
    }

    // Ocultar los controles
    function hideControls() {
        vidControls.classList.add('hide-controls');
    }

    // Mostrar controles al mover el mouse sobre el video
    videoWrapper.addEventListener('mousemove', showControls);

    // Ocultar controles tras 3 segundos cuando el mouse sale del video
    videoWrapper.addEventListener('mouseleave', () => {
        clearTimeout(hideControlsTimeout); // Limpia cualquier temporizador previo
        hideControlsTimeout = setTimeout(hideControls, 3000); // Ocultar tras 3 segundos
    });

    // También mostrar controles al tocar la pantalla (para dispositivos táctiles)
    videoWrapper.addEventListener('touchstart', showControls);

    // Video selector buttons
    videoButtons.forEach(button => {
        button.addEventListener('click', () => {
            videoButtons.forEach(btn => btn.classList.remove('vid-btn-selected'));
            button.classList.add('vid-btn-selected');

            const newVideoSrc = button.getAttribute('data-video');
            video.querySelector('source').src = newVideoSrc;
            video.load();
            video.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });
    });
});
