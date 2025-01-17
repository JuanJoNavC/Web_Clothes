let productoActual = '';
let descripcionActual = '';
let imagenesActuales = [];
let imagenPrincipal = '';
let precioActual = 0;

/*Funcion para cargar los productos desde la bd*/
async function cargarProductos(categoria) {
    try {
        const response = await fetch(`/productos?categoria=${categoria}`);
        if (!response.ok) throw new Error('Error al obtener los productos');

        const productos = await response.json();

        const contenedorProductos = document.querySelector('.cat-products');
        contenedorProductos.innerHTML = ''; // Limpia el contenedor

        productos.forEach(producto => {
            const imagenes = Array.isArray(producto.imagenes) ? producto.imagenes : [];
            const primeraImagen = imagenes[0] || '/path/to/default-image.webp'; // Imagen por defecto si no hay imágenes

            const descripcionEscapada = escaparTexto(producto.descripcion);

            const imagenesCodificadas = JSON.stringify(imagenes)
                .replace(/"/g, '&quot;') // Escapa comillas dobles
                .replace(/'/g, "\\'"); // Escapa comillas simples

            const tarjetaProducto = document.createElement('div');
            tarjetaProducto.className = 'cat-product-card';

            tarjetaProducto.innerHTML = `
                <img src="${primeraImagen}" alt="${producto.nombre}" 
                     onclick="abrirModal('${producto.nombre}', '${descripcionEscapada}', ${imagenesCodificadas}, ${producto.precio_venta})">
                <h2>${producto.nombre}</h2>
                <p>$${producto.precio_venta ? parseFloat(producto.precio_venta).toFixed(2) : 'N/A'}</p>
            `;

            contenedorProductos.appendChild(tarjetaProducto);
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}


function escaparTexto(texto) {
    return texto
        .replace(/'/g, "\\'") // Escapa comillas simples
        .replace(/"/g, '\\"'); // Escapa comillas dobles
}






/*Final de carga de productos*/


function abrirModal(nombreProducto, descripcion, imagenes = [], precio) {
    productoActual = nombreProducto;
    descripcionActual = descripcion;
    imagenesActuales = imagenes;
    precioActual = precio;

    console.log("Modal abierto con:", { nombreProducto, descripcion, imagenes, precio });

    document.getElementById("modal").style.display = "flex";

    // Establecer la primera imagen como principal
    const mainImg = document.getElementById("main-img");
    imagenPrincipal = imagenes.length > 0 ? imagenes[0] : '../../Images/logo1-nb-white.png'; // Inicializa imagenPrincipal
    mainImg.src = imagenPrincipal; // Mostrar la primera imagen como principal

    // Mostrar el nombre del producto
    document.getElementById("modal-product-name").textContent = nombreProducto;

    // Mostrar la descripción del producto
    document.getElementById("modal-product-description").textContent = descripcion;

    // Mostrar el precio
    const modalPrice = document.getElementById("modal-price");
    modalPrice.textContent = `Precio: $${precio ? parseFloat(precio).toFixed(2) : 'N/A'}`;

    // Generar miniaturas dinámicamente
    const contenedorMiniaturas = document.getElementById("modal-img-container");
    contenedorMiniaturas.innerHTML = ''; // Limpia las miniaturas previas
    imagenes.forEach((imgSrc, index) => {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = "modal-img" + (index === 0 ? " active" : ""); // Primera imagen activa
        img.onclick = () => seleccionarImagenPrincipal(imgSrc); // Vincula la función
        contenedorMiniaturas.appendChild(img);
    });
}
      
window.abrirModal = abrirModal;


function seleccionarImagenPrincipal(src) {
    imagenPrincipal = src;
    document.getElementById("main-img").src = src;

    // Actualizar la clase activa en las miniaturas
    const miniaturas = document.querySelectorAll(".modal-img");
    miniaturas.forEach(img => img.classList.remove("active"));
    document.querySelector(`.modal-img[src="${src}"]`).classList.add("active");
}
window.seleccionarImagenPrincipal=seleccionarImagenPrincipal;

function seleccionarTalla(elemento) {
const tallas = document.querySelectorAll('.talla-option');
tallas.forEach(talla => talla.classList.remove('active'));
elemento.classList.add('active');
// Puedes usar el atributo data-talla para obtener el valor seleccionado
const tallaSeleccionada = elemento.getAttribute('data-talla');
console.log('Talla seleccionada:', tallaSeleccionada);
}
window.seleccionarTalla = seleccionarTalla;

function cerrarModal() {
    document.getElementById("modal").style.display = "none";
}

window.cerrarModal = cerrarModal;


/*Control Carrito */


let carrito = [];

        document.addEventListener("DOMContentLoaded", cargarCarrito);

        function cargarCarrito() {
            const carritoGuardado = localStorage.getItem("carrito");
            if (carritoGuardado) {
                carrito = JSON.parse(carritoGuardado); // Convertir el JSON en un array
            } else {
                carrito = []; // Inicializar como vacío si no existe
            }
            actualizarCarrito(); // Actualiza la visualización del carrito
        }
        window.cargarCarrito = cargarCarrito;

        // Función para agregar productos al carrito
        function comprarProducto() {
            const cantidad = parseInt(document.getElementById("cantidad").value);
            const tallaBotonSeleccionado = document.querySelector(".talla-option.active");
        
            if (!tallaBotonSeleccionado) {
                alert("Por favor, selecciona una talla.");
                return;
            }
        
            if (!cantidad || cantidad <= 0) {
                alert("Por favor, selecciona una cantidad válida.");
                return;
            }
        
            const talla = tallaBotonSeleccionado.getAttribute("data-talla");
        
            if (!imagenPrincipal) {
                alert("Ocurrió un error con la imagen del producto. Intenta nuevamente.");
                return;
            }
        
            // Datos del producto
            const producto = {
                nombre: productoActual,
                descripcion: descripcionActual,
                imagen: imagenPrincipal, // Asegúrate de que imagenPrincipal tiene un valor
                cantidad: cantidad,
                talla: talla,
                precio: precioActual, // Usar precioActual definido en abrirModal
            };
        
            alert(`Has comprado ${cantidad} unidad(es) de ${productoActual} en talla ${talla} :)`);
        
            carrito.push(producto); // Agregar producto al carrito
            cerrarModal(); // Cierra el modal
            actualizarCarrito(); // Actualiza el carrito visualmente
            guardarCarrito(); // Guarda el carrito en localStorage
        }
        
        
        window.comprarProducto = comprarProducto;

        const envioFijo = 5;
        const envioGratisLimite = 100;
        const ivaPorcentaje = 0.15;

        function toggleCart() {
            const cart = document.getElementById("cart-off-canvas");
            cart.classList.toggle("open");
            actualizarCarrito();
        }
        window.toggleCart = toggleCart;

        function agregarProducto(nombre, precio, imagen) {
            const productoExistente = carrito.find(p => p.nombre === nombre);
            if (productoExistente) {
                productoExistente.cantidad++;
            } else {
                carrito.push({ nombre, precio, imagen, cantidad: 1 });
            }
            actualizarCarrito();
        }
        window.agregarProducto = agregarProducto

        function eliminarProducto(nombre) {
            carrito = carrito.filter(p => p.nombre !== nombre);
            actualizarCarrito();
            guardarCarrito(); // Guarda los cambios en localStorage
        }
        window.eliminarProducto = eliminarProducto;

        function guardarCarrito() {
            console.log("Guardando carrito en localStorage:", carrito);
            localStorage.setItem("carrito", JSON.stringify(carrito));
        }
        window.guardarCarrito = guardarCarrito;

        function actualizarCarrito() {
            const contenido = document.querySelector(".off-canvas-content");
            const resumen = document.querySelector(".cart-summary");

            // Vaciar el contenido del carrito
            contenido.innerHTML = "";

            if (carrito.length === 0) {
                // Mostrar mensaje de carrito vacío
                contenido.innerHTML = `
                    <div class="empty-cart">
                        <img src="/Images/empty-bag.svg" alt="Carrito Vacío">
                        <h3>Tu carrito está vacío</h3>
                        <p>No has añadido ningún producto.</p>
                        <a href="pages/catalogo/catalogo.html">
                            <button class="shop-button">Catálogo</button>
                        </a>
                    </div>`;
                resumen.style.display = "none";
                return;
            }

            // Mostrar productos en el carrito
            let subtotal = 0;
            carrito.forEach(producto => {
                subtotal += producto.precio * producto.cantidad;

                const item = document.createElement("div");
                item.className = "cart-item";
                item.innerHTML = `
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                    <div class="cart-item-details">
                        <h4>${producto.nombre}</h4>
                        <p>Cantidad: X${producto.cantidad}</p>
                        <p>Precio: $${(producto.precio * producto.cantidad).toFixed(2)}</p>
                    </div>
                    <div class="cart-item-actions">
                        <button onclick="eliminarProducto('${producto.nombre}')">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>`;
                contenido.appendChild(item);
            });

            // Calcular totales
            const iva = subtotal * ivaPorcentaje; // IVA es 15% (variable global)
            const envio = subtotal >= envioGratisLimite ? 0 : envioFijo; // Envío gratis si supera el límite
            const total = subtotal + iva + envio;

            // Actualizar los totales en el resumen
            document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById("iva").textContent = `$${iva.toFixed(2)}`;
            document.getElementById("envio").textContent = `$${envio.toFixed(2)}`;
            document.getElementById("total").textContent = `$${total.toFixed(2)}`;

            resumen.style.display = "block"; // Mostrar el resumen si hay productos
        }
        window.actualizarCarrito = actualizarCarrito;

        window.addEventListener("storage", function(event) {
            if (event.key === "carrito") {
                console.log("Evento storage detectado:", event.newValue);
                carrito = JSON.parse(event.newValue || "[]");
                actualizarCarrito();
            }
        });