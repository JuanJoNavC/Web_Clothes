const form = document.getElementById('myForm');

form.addEventListener('submit', function(event) {
    event.preventDefault(); // Evitar el comportamiento predeterminado de enviar el formulario

    // Acceder a los valores de los elementos del formulario
    const name = domcument.getElementById('name').value.trim();
    const email = domcument.getElementById('email').value.trim();

    // Enviar datos a través de la API Fetch
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email }) // Convertir los datos a formato JSON
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error('Error:', error));
});