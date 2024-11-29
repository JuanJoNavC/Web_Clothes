const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise'); // Usamos mysql2 para trabajar con MySQL
const app = express();
const PORT = 3006;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Configuración de archivos estáticos para servir contenido de `pages`
app.use(express.static(path.join(__dirname, 'pages')));

// Configuración de archivos estáticos globales (styles.css, app.js)
app.use(express.static(__dirname));

// Servir `index.html` como página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configuración de la base de datos
const dbConfig = {
    host: '127.0.0.1',
    user: 'admin', // Usuario creado anteriormente
    password: 'admin', // Contraseña
    database: 'SportShop'
};

// Endpoint para manejar solicitudes POST
app.post('/submit', async (req, res) => {
    const { name, email, password, dob, gender, size, cedula, address, phone } = req.body;

    try {
        // Conectar a la base de datos
        const connection = await mysql.createConnection(dbConfig);
        console.log({ name, email, password, dob, gender, size, cedula, address, phone });
        console.log(size)
        // Insertar datos en la tabla usuario
        const [result] = await connection.execute(
            `INSERT INTO usuario (name, email, password, dob, gender, size, cedula, address, phone) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, password, dob, gender, size, cedula, address, phone]
        );

        await connection.end();

        res.status(200).send({ message: 'Datos guardados exitosamente', result });
    } catch (err) {
        console.error('Error al guardar en la base de datos:', err);
        res.status(500).send({ message: 'Error al guardar los datos', error: err.message });
        console.error(err.message, err.stack);
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
