const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise'); // Usamos mysql2 para trabajar con MySQL
const app = express();
const PORT = 3006;
const fs = require('fs');
const caCertificatePath = path.join(__dirname, 'ca.pem'); // Asegúrate de que esta ruta sea correcta
const bcrypt = require('bcrypt');

// Middleware para parsear JSON
app.use(bodyParser.json());

//Contenido enviado en el cuerpo de una solicitud como json
app.use(express.json());

// Configuración de archivos estáticos para servir contenido de `pages`
app.use(express.static(path.join(__dirname, 'pages')));

// Configuración de archivos estáticos globales (styles.css, app.js)
app.use(express.static(__dirname));

// Servir `index.html` como página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});



// Configuración de la base de datos
const pool = mysql.createPool({
    host: 'mysql-23717d46-athlex.c.aivencloud.com',
    user: 'sysjuan',
    password: 'sysjuan',
    database: 'defaultdb',
    port: 27073,
    ssl: {
        ca: fs.readFileSync(caCertificatePath)
        //ca: process.env.caCertificatePath, // Lee el certificado desde el archivo
    },
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to database!');
        connection.release(); // Libera la conexión al pool
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
})();


// Endpoint para manejar solicitudes POST de Registro
app.post('/submit', async (req, res) => {
    const { name, email, password, dob, gender, size, cedula, phone } = req.body;

    try {
        // Encripta la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Busca el ID del rol 'USER'
        const [roleResult] = await pool.execute(
            `SELECT id_rol FROM roles WHERE codigo = 'USER'`
        );

        if (roleResult.length === 0) {
            res.status(500).send({ message: 'El rol de usuario no existe en la base de datos.' });
            return;
        }

        const idRolUsuario = roleResult[0].id_rol;

        // Verifica si el correo ya está registrado
        const [existingUser] = await pool.execute(
            `SELECT * FROM usuarios WHERE correo = ?`,
            [email]
        );

        if (existingUser.length > 0) {
            res.status(400).send({ message: 'El correo ya está registrado' });
            return;
        }

        // Inserta en la tabla usuarios
        const [userResult] = await pool.execute(
            `INSERT INTO usuarios (id_rol, correo, password) VALUES (?, ?, ?)`,
            [idRolUsuario, email, hashedPassword]
        );

        // Inserta en la tabla clientes
        const [clientResult] = await pool.execute(
            `INSERT INTO clientes (id_usuario, nombre, cedula, genero, talla_favorita, telefono, fecha_nacimiento) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userResult.insertId, name, cedula, gender, size, phone, dob]
        );

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
        // Verificar si el correo existe en la tabla usuarios
        const [userRows] = await pool.execute(
            `SELECT * FROM usuarios WHERE correo = ?`,
            [email]
        );

        if (userRows.length === 0) {
            // Si no hay resultados, el correo no está registrado
            res.status(404).send({ message: 'El correo no está registrado' });
            return;
        }

        // Si el correo existe, verificar la contraseña
        const user = userRows[0]; // Usuario encontrado
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            // Contraseña incorrecta
            res.status(401).send({ message: 'La contraseña es incorrecta' });
            return;
        }

        // Si todo es correcto, iniciar sesión exitoso
        res.status(200).send({
            message: 'Inicio de sesión exitoso',
            user: { id_usuario: user.id_usuario, correo: user.correo, id_rol: user.id_rol },
        });

    } catch (err) {
        console.error('Error al validar las credenciales:', err);
        res.status(500).send({ message: 'Error en el servidor', error: err.message });
    }
});


// Endpoint para obtener los productos con sus imágenes
app.get("/productos", async (req, res) => {
    console.log("Solicitud recibida para obtener los productos");

    try {
        const { categoria } = req.query; // Obtener el parámetro de categoría

        const query = `
            SELECT 
                p.id_producto, 
                p.nombre, 
                p.descripcion, 
                p.precio_venta, 
                p.id_categoria,
                GROUP_CONCAT(i.url_imagen ORDER BY i.orden ASC) AS imagenes
            FROM 
                productos p
            LEFT JOIN 
                imagenes_productos i 
            ON 
                p.id_producto = i.id_producto
            WHERE 
                p.eliminacion_logica = 0
                ${categoria ? "AND p.id_categoria = ?" : ""} -- Filtro opcional por categoría
            GROUP BY 
                p.id_producto;
        `;

        const [rows] = categoria 
            ? await pool.execute(query, [categoria]) 
            : await pool.execute(query);

        if (rows.length > 0) {
            const productos = rows.map(row => ({
                id_producto: row.id_producto,
                nombre: row.nombre,
                descripcion: row.descripcion,
                precio_venta: row.precio_venta,
                id_categoria: row.id_categoria,
                imagenes: row.imagenes ? row.imagenes.split(",") : [] // Divide las imágenes en un array
            }));

            res.json(productos);
        } else {
            res.status(404).json({ mensaje: "No se encontraron productos." });
        }
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});





//Endpoint para validar el codigo de descuento
app.post("/validate-discount-code", async (req, res) => {
    const { code } = req.body;
    console.log("Código recibido en el servidor:", code);

    try {
        // Ejecuta la consulta usando el pool
        const query = `
            SELECT porcentaje, estado, fecha_expiracion
            FROM discount_codes 
            WHERE code = ? AND estado = 'ACT' AND fecha_expiracion > NOW();
        `;
        const [rows] = await pool.execute(query, [code]);

        if (rows.length > 0) {
            const { porcentaje } = rows[0];
            res.json({ valido: true, porcentaje });
        } else {
            res.json({ valido: false, mensaje: "El código no es válido o ha expirado." });
        }
    } catch (error) {
        console.error("Error al validar el código:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});


//Endpoint para obtener los paises
app.get("/paises", async (req, res) => {
    console.log("Solicitud recibida para obtener la lista de países");

    try {
        const query = `SELECT id_pais AS id, nombre FROM paises;`;
        const [rows] = await pool.execute(query);

        if (rows.length > 0) {
            res.json(rows); // Enviar la lista de países como respuesta
        } else {
            res.status(404).json({ mensaje: "No se encontraron países." });
        }
    } catch (error) {
        console.error("Error al obtener los países:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});


// Endpoint para obtener las ciudades de un país
app.get("/ciudades/:id_pais", async (req, res) => {
    const { id_pais } = req.params;
    console.log("Solicitud recibida para obtener la lista de ciudades del pais " + id_pais);

    try {
        const query = `SELECT id_ciudad AS id, nombre FROM ciudades WHERE id_pais = ?`;
        const [rows] = await pool.execute(query, [id_pais]);

        if (rows.length > 0) {
            res.json(rows); // Devuelve las ciudades como respuesta
        } else {
            res.status(404).json({ mensaje: "No se encontraron ciudades para este país." });
        }
    } catch (error) {
        console.error("Error al obtener las ciudades:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});



// Endpoint para obtener el nombre y teléfono del usuario según su correo
app.get("/usuarios/datos", async (req, res) => {
    const { correo } = req.query;
    console.log("Solicitud recibida para obtener los datos del usuario con correo: " + correo);

    try {
        const query = `
            SELECT c.nombre, c.telefono 
            FROM clientes c
            JOIN usuarios u ON c.id_usuario = u.id_usuario
            WHERE u.correo = ?
        `;
        const [rows] = await pool.execute(query, [correo]);

        if (rows.length > 0) {
            res.json({ 
                nombre: rows[0].nombre,
                telefono: rows[0].telefono
            });
        } else {
            res.status(404).json({ mensaje: "No se encontraron datos para este correo." });
        }
    } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});


// Endpoint para obtener la información del usuario por correo
app.get("/usuario/:email", async (req, res) => {
    const { email } = req.params;
    console.log("Solicitud recibida para obtener datos del usuario con email:", email);

    try {
        const query = `
            SELECT 
                u.id_usuario, 
                u.correo, 
                u.id_rol, 
                c.nombre AS nombre_cliente,
                c.cedula,
                c.genero,
                c.talla_favorita,
                c.telefono,
                c.fecha_nacimiento
            FROM usuarios u
            LEFT JOIN clientes c ON u.id_usuario = c.id_usuario
            WHERE u.correo = ? AND u.eliminacion_logica = 0;
        `;
        const [rows] = await pool.execute(query, [email]);

        if (rows.length > 0) {
            res.json(rows[0]); // Devuelve el primer usuario encontrado con sus datos de cliente
        } else {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
        }
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});







/*Manejo de facturas*/

// Endpoint para guardar la dirección
app.post("/api/direcciones", async (req, res) => {
    const { id_usuario, id_ciudad, direccion, codigo_postal } = req.body;

    console.log("Solicitud recibida para guardar dirección:", req.body);
    if (!id_usuario || !id_ciudad || !direccion || !codigo_postal) {
        console.error("Faltan datos obligatorios para guardar la dirección.");
        return res.status(400).json({ mensaje: "Datos incompletos para guardar la dirección." });
    }

    try {
        const query = `
            INSERT INTO direcciones (id_usuario, id_ciudad, direccion, codigo_postal)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [id_usuario, id_ciudad, direccion, codigo_postal]);

        res.status(201).json({ id_direccion: result.insertId });
    } catch (error) {
        console.error("Error al guardar la dirección:", error);
        res.status(500).json({ mensaje: "Error interno del servidor al guardar la dirección." });
    }
});


// Endpoint para crear una factura
app.post("/api/facturas", async (req, res) => {
    const { id_usuario, id_direccion, id_metodo_pago, fecha, subtotal, iva, total, estado } = req.body;

    console.log("Solicitud recibida para crear factura:", req.body);

    if (!id_usuario || !id_direccion || !id_metodo_pago || !subtotal || !iva || !total || !estado) {
        return res.status(400).json({ mensaje: "Datos incompletos para crear la factura." });
    }

    try {
        const query = `
            INSERT INTO facturas (id_usuario, id_direccion, id_metodo_pago, fecha, subtotal, iva, total, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [id_usuario, id_direccion, id_metodo_pago, fecha, subtotal, iva, total, estado]);

        res.status(201).json({ id_factura: result.insertId });
    } catch (error) {
        console.error("Error al crear la factura:", error);
        res.status(500).json({ mensaje: "Error interno del servidor al crear la factura." });
    }
});


// Endpoint para relacionar cliente y factura
app.post("/api/cliente_factura", async (req, res) => {
    const { id_cliente, id_factura } = req.body;

    console.log("Solicitud recibida para crear relación cliente-factura:", req.body);

    try {
        const query = `
            INSERT INTO cliente_factura (id_cliente, id_factura)
            VALUES (?, ?)
        `;
        await pool.execute(query, [id_cliente, id_factura]);

        res.status(201).json({ mensaje: "Relación cliente-factura creada con éxito." });
    } catch (error) {
        console.error("Error al relacionar cliente y factura:", error);
        res.status(500).json({ mensaje: "Error interno del servidor al relacionar cliente y factura." });
    }
});


// Endpoint para agregar detalles de la factura
app.post("/api/detalles_factura", async (req, res) => {
    const { id_factura, id_producto, cantidad, precio_unitario, subtotal } = req.body;

    console.log("Solicitud recibida para agregar detalles de factura:", req.body);

    if (!id_factura || !id_producto || !cantidad || !precio_unitario || !subtotal) {
        console.error("Datos incompletos para agregar el detalle de la factura:", req.body);
        return res.status(400).json({ mensaje: "Datos incompletos para agregar el detalle de la factura." });
    }

    try {
        const query = `
            INSERT INTO detalles_factura (id_factura, id_producto, cantidad, precio_unitario, subtotal)
            VALUES (?, ?, ?, ?, ?)
        `;
        await pool.execute(query, [id_factura, id_producto, cantidad, precio_unitario, subtotal]);

        res.status(201).json({ mensaje: "Detalle de factura agregado con éxito." });
    } catch (error) {
        console.error("Error al agregar detalles de la factura:", error);
        res.status(500).json({ mensaje: "Error interno del servidor al agregar detalles de la factura." });
    }
});


app.get("/api/cliente/:id_usuario", async (req, res) => {
    const { id_usuario } = req.params;

    console.log(`Solicitud recibida para obtener cliente con id_usuario: ${id_usuario}`);

    if (!id_usuario) {
        return res.status(400).json({ mensaje: "El id_usuario es requerido." });
    }

    try {
        const queryCliente = `
            SELECT id_cliente FROM clientes WHERE id_usuario = ?
        `;
        const [rows] = await pool.execute(queryCliente, [id_usuario]);

        if (rows.length === 0) {
            console.error("No se encontró un cliente para el usuario:", id_usuario);
            return res.status(404).json({ mensaje: "Cliente no encontrado." });
        }

        console.log("Cliente encontrado:", rows[0]);
        res.status(200).json({ id_cliente: rows[0].id_cliente });
    } catch (error) {
        console.error("Error al obtener el cliente:", error);
        res.status(500).json({ mensaje: "Error interno del servidor al obtener el cliente." });
    }
});


app.get("/api/producto", async (req, res) => {
    const { nombre } = req.query;

    console.log(`Solicitud recibida para obtener id_producto del producto con nombre: ${nombre}`);

    if (!nombre) {
        return res.status(400).json({ mensaje: "El nombre del producto es requerido." });
    }

    try {
        const query = `SELECT id_producto FROM productos WHERE nombre = ?`;
        const [rows] = await pool.execute(query, [nombre]);

        if (rows.length === 0) {
            console.error(`No se encontró producto con el nombre: ${nombre}`);
            return res.status(404).json({ mensaje: "Producto no encontrado." });
        }

        console.log("Producto encontrado:", rows[0]);
        res.status(200).json({ id_producto: rows[0].id_producto });
    } catch (error) {
        console.error("Error al obtener el producto:", error);
        res.status(500).json({ mensaje: "Error interno del servidor al obtener el producto." });
    }
});


app.get("/api/stock", async (req, res) => {
    const { id_producto, id_talla } = req.query;

    try {
        const query = `SELECT stock FROM stock WHERE id_producto = ? AND id_talla = ?`;
        const [rows] = await pool.execute(query, [id_producto, id_talla]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: "Stock no encontrado para el producto y talla especificados." });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error al consultar el stock:", error);
        res.status(500).json({ mensaje: "Error interno al consultar el stock." });
    }
});

app.put("/api/stock", async (req, res) => {
    const { id_producto, id_talla, cantidad } = req.body;

    // Verificar si los datos necesarios están presentes
    if (!id_producto || !id_talla || !cantidad) {
        console.error("Datos incompletos recibidos para actualizar el stock:", req.body);
        return res.status(400).json({ mensaje: "id_producto, id_talla y cantidad son requeridos." });
    }

    try {
        const query = `
            UPDATE stock
            SET stock = stock - ?
            WHERE id_producto = ? AND id_talla = ? AND stock >= ?
        `;
        const [result] = await pool.execute(query, [cantidad, id_producto, id_talla, cantidad]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ mensaje: "Stock insuficiente o producto/talla no encontrados." });
        }

        res.status(200).json({ mensaje: "Stock actualizado con éxito." });
    } catch (error) {
        console.error("Error al actualizar el stock:", error);
        res.status(500).json({ mensaje: "Error interno al actualizar el stock." });
    }
});




app.get("/api/productos/buscar", async (req, res) => {
    const { nombre, talla } = req.query;

    if (!nombre || !talla) {
        return res.status(400).json({ mensaje: "El nombre del producto y la talla son requeridos." });
    }

    try {
        const query = `
            SELECT p.id_producto, t.id_talla
            FROM productos p
            JOIN stock s ON p.id_producto = s.id_producto
            JOIN tallas t ON s.id_talla = t.id_talla
            WHERE p.nombre = ? AND t.talla = ?
            LIMIT 1
        `;
        const [rows] = await pool.execute(query, [nombre, talla]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: `No se encontró el producto "${nombre}" con la talla "${talla}".` });
        }

        res.json(rows[0]); // Devuelve el id_producto e id_talla correctos
    } catch (error) {
        console.error("Error al obtener el producto y la talla:", error);
        res.status(500).json({ mensaje: "Error interno al obtener el producto y la talla." });
    }
});







app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});