// Add event listener to the form
document.getElementById('myForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    // Capture the form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const repeatPassword = document.getElementById('repeat-password').value.trim();
    const dob = document.getElementById('dob').value;
    const gender = document.getElementById('gender').value;
    const size = document.getElementById('size').value;
    const cedula = document.getElementById('cedula').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // Validate the fields
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

    if (!phone || !validatePhone(phone)) {
        alert("Por favor, ingrese un número de teléfono válido (10 dígitos).");
        return;
    }

    // If all validations pass, submit the data
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, dob, gender, size, cedula, phone })
    })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error('Error: ', error));
});

// Load saved form data from sessionStorage when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('myForm');
    const inputs = form.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
        const savedValue = sessionStorage.getItem(input.id); // Retrieve saved value by input's id
        if (savedValue) {
            input.value = savedValue; // Set the value in the field
        }
    });
});

// Save form data to sessionStorage when fields are changed
document.querySelectorAll("#myForm input, #myForm select, #myForm textarea").forEach((field) => {
    field.addEventListener("input", (event) => {
        sessionStorage.setItem(event.target.id, event.target.value); // Save field value
    });
});

// Validation functions
function validateName(name) {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚ\s]+$/; // Allow letters (uppercase, lowercase) and spaces, with accents
    return regex.test(name);
}

function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/; // Basic email format
    return regex.test(email);
}

function validatePhone(phone) {
    const regex = /^[0-9]{10}$/; // Only 10 numeric digits
    return regex.test(phone);
}

function validateCedula(cedula) {
    const regex = /^[0-9]{1,10}$/; // Only numbers, max 10 characters
    return regex.test(cedula);
}
