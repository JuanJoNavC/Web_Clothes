document.getElementById('myForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Capturar los valores del formulario
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const dob = document.getElementById('dob').value;
    const gender = document.getElementById('gender').value;
    const size = document.getElementById('size').value;
    const cedula = document.getElementById('cedula').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // Enviar los datos al servidor
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
