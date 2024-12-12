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
    host: 'localhost',
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
        // Verificar si el correo o la cédula ya existen
        const [existingUser] = await connection.execute(
            `SELECT * FROM usuario WHERE email = ? OR cedula = ?`,
            [email, cedula]
        );

        if (existingUser.length > 0) {
            res.status(400).send({ message: 'El correo o la cédula ya están registrados' });
            return;
        }
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

// Endpoint para validar credenciales
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Conectar a la base de datos
        const connection = await mysql.createConnection(dbConfig);

        // Verificar si el correo existe
        const [userRows] = await connection.execute(
            `SELECT * FROM usuario WHERE email = ?`,
            [email]
        );

        if (userRows.length === 0) {
            // Si no hay resultados, el correo no está registrado
            res.status(404).send({ message: 'El correo no está registrado' });
            return;
        }

        // Si el correo existe, verificar la contraseña
        const user = userRows[0]; // Usuario encontrado
        if (user.password !== password) {
            // Contraseña incorrecta
            res.status(401).send({ message: 'La contraseña es incorrecta' });
            return;
        }

        // Si todo es correcto, iniciar sesión exitoso
        res.status(200).send({ message: 'Inicio de sesión exitoso', user });

        await connection.end();
    } catch (err) {
        console.error('Error al validar las credenciales:', err);
        res.status(500).send({ message: 'Error en el servidor', error: err.message });
    }
});



app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});