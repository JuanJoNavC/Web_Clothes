const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise'); // Usamos mysql2 para trabajar con MySQL
const app = express();
const PORT = 3006;
const fs = require('fs');
const caCertificatePath = 'ca.pem'; // Asegúrate de que esta ruta sea correcta
const bcrypt = require('bcrypt');

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
    host: 'mysql-23717d46-athlex.c.aivencloud.com',
    user: 'sysjuan',
    password: 'sysjuan',
    database: 'defaultdb',
    port: 27073,
    ssl: {
        ca: process.env.caCertificatePath, // Lee el certificado desde el archivo
    },
};

(async function connectToDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to the database!');
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
})();

// Endpoint para manejar solicitudes POST de Registro
app.post('/submit', async (req, res) => {
    const { name, email, password, dob, gender, size, cedula, address, phone } = req.body;

    try {
        // Conectar a la base de datos
        const connection = await mysql.createConnection(dbConfig);

        // Encriptar la contraseña antes de almacenarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buscar el id del rol 'Usuario'
        const [roleResult] = await connection.execute(
            `SELECT id_rol FROM roles WHERE codigo = 'USER'`
        );

        if (roleResult.length === 0) {
            res.status(500).send({ message: 'El rol de usuario no existe en la base de datos.' });
            await connection.end();
            return;
        }

        const idRolUsuario = roleResult[0].id_rol;

        // Verificar si el correo ya existe en la tabla usuarios
        const [existingUser] = await connection.execute(
            `SELECT * FROM usuarios WHERE correo = ?`,
            [email]
        );

        if (existingUser.length > 0) {
            res.status(400).send({ message: 'El correo ya está registrado' });
            await connection.end();
            return;
        }

        // Insertar datos en la tabla usuarios
        const [userResult] = await connection.execute(
            `INSERT INTO usuarios (id_rol, correo, password) VALUES (?, ?, ?)`,
            [idRolUsuario, email, hashedPassword]
        );

        // Insertar datos en la tabla clientes
        const [clientResult] = await connection.execute(
            `INSERT INTO clientes (id_usuario, nombre, cedula, genero, talla_favorita, telefono, fecha_nacimiento) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userResult.insertId, name, cedula, gender, size, phone, dob]
        );

        await connection.end();

        res.status(200).send({
            message: 'Datos guardados exitosamente',
            userId: userResult.insertId,
            clientId: clientResult.insertId,
        });
    } catch (err) {
        console.error('Error al guardar en la base de datos:', err);
        res.status(500).send({ message: 'Error al guardar los datos', error: err.message });
    }
});


// Endpoint para validar credenciales
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Conectar a la base de datos
        const connection = await mysql.createConnection(dbConfig);

        // Verificar si el correo existe en la tabla usuarios
        const [userRows] = await connection.execute(
            `SELECT * FROM usuarios WHERE correo = ?`,
            [email]
        );

        if (userRows.length === 0) {
            // Si no hay resultados, el correo no está registrado
            res.status(404).send({ message: 'El correo no está registrado' });
            await connection.end();
            return;
        }

        // Si el correo existe, verificar la contraseña
        const user = userRows[0]; // Usuario encontrado
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            // Contraseña incorrecta
            res.status(401).send({ message: 'La contraseña es incorrecta' });
            await connection.end();
            return;
        }

        // Si todo es correcto, iniciar sesión exitoso
        res.status(200).send({
            message: 'Inicio de sesión exitoso',
            user: { id_usuario: user.id_usuario, correo: user.correo, id_rol: user.id_rol },
        });

        await connection.end();
    } catch (err) {
        console.error('Error al validar las credenciales:', err);
        res.status(500).send({ message: 'Error en el servidor', error: err.message });
    }
});




app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});