document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const logo = document.querySelector('.nav-logo'); // Selector para el logo

    // Cargar el estado del modo desde localStorage
    const currentMode = localStorage.getItem('theme'); 
    if (currentMode) {
        body.classList.add(currentMode); // Añadir el modo almacenado (dark-mode o light-mode)
        if (currentMode === 'dark-mode') {
            logo.src = getLogoPath('white'); // Logo para modo oscuro
        } else {
            logo.src = getLogoPath('default'); // Logo para modo claro
        }
    } else {
        // Si no hay un modo guardado, establecer el modo claro por defecto
        body.classList.add('light-mode');
        logo.src = getLogoPath('default'); // Logo para modo claro
    }

    toggleButton.addEventListener('click', () => {
        // Alternar las clases de modo en el body
        body.classList.toggle('dark-mode');
        body.classList.toggle('light-mode');

        // Cambiar el logo según el modo
        if (body.classList.contains('dark-mode')) {
            logo.src = getLogoPath('white'); // Logo para modo oscuro
            localStorage.setItem('theme', 'dark-mode'); // Guardar el modo en localStorage
        } else {
            logo.src = getLogoPath('default'); // Logo para modo claro
            localStorage.setItem('theme', 'light-mode'); // Guardar el modo en localStorage
        }
    });

    // Función para obtener la ruta correcta del logo según el modo
    function getLogoPath(mode) {
        const currentPath = window.location.pathname.split('/').slice(0, -1).join('/'); // Obtener la ruta actual
        if (mode === 'white') {
            return `${currentPath}/Images/logo1-nb-white.png`; // Ruta al logo blanco para modo oscuro
        } else {
            return `${currentPath}/Images/logo1-nb.png`; // Ruta al logo original para modo claro
        }
    }
});
