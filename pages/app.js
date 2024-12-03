document.getElementById('myForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevenir el envío del formulario

    // Capturar los valores del formulario
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const repeatPassword = document.getElementById('repeat-password').value.trim();
    const dob = document.getElementById('dob').value;
    const gender = document.getElementById('gender').value;
    const size = document.getElementById('size').value;
    const cedula = document.getElementById('cedula').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // Validar los campos
    if (!name || !validateName(name)) {
        alert("Por favor, ingrese un nombre válido (sin números ni caracteres especiales).");
        return;
    }

    if (!email || !validateEmail(email)) {
        alert("Por favor, ingrese un correo electrónico válido (debe contener texto, @ y dominio).");
        return;
    }

    if (!password || password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    if (password !== repeatPassword) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    if (!dob) {
        alert("Por favor, ingrese su fecha de nacimiento.");
        return;
    }

    if (!gender) {
        alert("Por favor, seleccione su género.");
        return;
    }

    if (!size) {
        alert("Por favor, seleccione su talla favorita.");
        return;
    }

    if (!cedula || !validateCedula(cedula)) {
        alert("Por favor, ingrese un número de cédula válido (máximo 10 dígitos numéricos).");
        return;
    }

    if (!address) {
        alert("Por favor, ingrese su dirección de envío.");
        return;
    }

    if (!phone || !validatePhone(phone)) {
        alert("Por favor, ingrese un número de teléfono válido (10 dígitos).");
        return;
    }

    // Si todas las validaciones son correctas, enviar los datos
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, dob, gender, size, cedula, address, phone })
    })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error('Error: ', error));
});

// Función para validar el nombre (solo letras y espacios)
function validateName(name) {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚ\s]+$/; // Permite letras (mayúsculas, minúsculas) y espacios, con tildes
    return regex.test(name);
}


// Función para validar el correo electrónico
function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/; // Formato básico de correo
    return regex.test(email);
}

// Función para validar el teléfono (10 dígitos)
function validatePhone(phone) {
    const regex = /^[0-9]{10}$/; // Solo 10 dígitos numéricos
    return regex.test(phone);
}

// Función para validar la cédula (máximo 10 caracteres numéricos)
function validateCedula(cedula) {
    const regex = /^[0-9]{1,10}$/; // Solo números, máximo 10 caracteres
    return regex.test(cedula);
}
