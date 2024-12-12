document.addEventListener('DOMContentLoaded', function () {
    const loginSection = document.getElementById('loginSection');
    const sessionSection = document.getElementById('sessionSection');
    const userEmailDisplay = document.getElementById('userEmail').querySelector('strong');

    // Verificar si hay un usuario en localStorage
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        // Si hay un usuario, mostrar la sección de sesión iniciada
        loginSection.style.display = 'none';
        sessionSection.style.display = 'block';
        userEmailDisplay.textContent = loggedInUser;
    }

    // Manejar el formulario de inicio de sesión
    document.getElementById('loginForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !validateEmail(email)) {
            alert("Por favor, ingrese un correo electrónico válido.");
            return;
        }

        if (!password || password.length < 6) {
            alert("Por favor, ingrese una contraseña válida.");
            return;
        }

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })
            .then(async response => {
                const data = await response.json();

                if (response.ok) {
                    // Guardar usuario en localStorage y mostrar sesión iniciada
                    localStorage.setItem('loggedInUser', email);
                    loginSection.style.display = 'none';
                    sessionSection.style.display = 'block';
                    userEmailDisplay.textContent = email;
                } else {
                    // Mostrar mensaje de error según el caso
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error: ', error);
                alert('Hubo un problema al intentar iniciar sesión. Intente nuevamente.');
            });
    });

    // Manejar el botón de cerrar sesión
    document.getElementById('logoutButton').addEventListener('click', function () {
        // Borrar el estado de sesión en localStorage
        localStorage.removeItem('loggedInUser');

        // Volver a la vista de inicio de sesión
        loginSection.style.display = 'block';
        sessionSection.style.display = 'none';

        // Limpiar campos del formulario
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    });

    // Función para validar el correo electrónico
    function validateEmail(email) {
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/; // Formato básico de correo
        return regex.test(email);
    }
});

document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordField = document.getElementById('password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash'); // Cambia el ícono
});