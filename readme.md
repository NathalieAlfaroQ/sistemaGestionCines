# Proyecto Integrador de Ingeniería en Software y Bases de Datos



## Descripción del proyecto

Este proyecto es una página web de acceso a través de internet, consiste en un sistema de gestión para una cadena de cines llamada Cines Aurora, esta requiere administrar a sus empleados, productos de dulcería, cartelera, salas y proyecciones, para que los clientes puedan comprar boletos o dulces de forma remota para ofrecerles una experiencia organizada. Además el sistema contará con el registro de cuentas para brindar un servicio personalizado y los administradores tendrán la posibilidad de observar las métricas de su cine asignado para mejor planificación del negocio.



## Integrantes del grupo 4 llamado NID

- Nathalie Alfaro, B90221.
- Isaías Alberto Alfaro Ugalde, C20261.
- Rair Darío Gómez Bernal, C33243.



## Pila del producto en Jira

https://pinid.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog?atlOrigin=eyJpIjoiYjYzZmIxMjhhOWY3NDBmMjhlZjEzZjEyZjVlNTI4YTYiLCJwIjoiaiJ9



## Prototipo de baja fidelidad en Figma

https://www.figma.com/design/zvC2S2bIoiGgl8rrNnKPOt/Prototipo-baja-fidelidad-NID?node-id=0-1&t=AB4ugd05wKud1FHw-1



## Tecnologías
 
- **Cliente:** Vite, React y Tailwind CSS v4.
- **Servidor:** Node.js con Express (módulos ESM) y el driver `oracledb`.
- **Base de datos:** Oracle Autonomous Database en Oracle Cloud Infrastructure (OCI), conectada mediante Wallet.



## Estructura del proyecto
 
El código vive dentro de la carpeta `sistema-web/`, que es un monorepo con un `package.json` en la raíz que orquesta el cliente y el servidor.
 
```
sistema-web/
├── cliente/            Interfaz web (Vite + React + Tailwind)
├── servidor/           API con Express
└── package.json        Scripts para instalar y ejecutar todo
```



## Requisitos previos
 
- Node.js en una versión LTS reciente y npm.

- Un usuario y esquema propio en la base de datos Oracle del proyecto.
- El Wallet de la base de datos, junto con la contraseña con la que fue descargado.
- Proyecto de google para autenticación de terceros
- Llaves de prueba de la cuenta de ONVO del equipo (pago con tarjeta).
- Credenciales de la app de sandbox de PayPal del equipo y su cuenta de comprador de prueba.
- Datos de una cuenta de correo SMTP para enviar correos (contraseña temporal y comprobantes de compra).


## Configuración de la base de datos
 
Cada integrante desarrolla sobre su propio esquema, para que las pruebas y los errores no afecten al esquema oficial del cine.
 
1. Entra a Database Actions con **tu** usuario y abre una hoja de trabajo SQL.

2. Ejecuta el contenido de `sistema-web/servidor/baseDatos/esquema.sql`.

3. Los ID's se generan automáticamente (`IDENTITY`), por lo que **no** se envían en los `INSERT`. Las únicas excepciones son `PROVINCIAS` y `CANTONES`, donde el ID puede indicarse manualmente.
El script solo crea la estructura, no incluye datos.

4. Ejecuta `sistema-web/servidor/baseDatos/cambios_pago.sql` (ver [Pago con tarjeta](#pago-con-tarjeta-onvo)). Se puede ejecutar varias veces: solo aplica lo que falta.



## Configuración del servidor
 
1. **Wallet.** Descárgalo desde la consola de OCI o pedirlo a un integrante por un canal privado. Descomprímelo dentro de `sistema-web/servidor/wallet/`.
2. **Variables de entorno.** Copia la plantilla y completa tus datos:

```bash
   cp sistema-web/servidor/.env.example sistema-web/servidor/.env
```
 
Cada variable está explicada en `.env.example`. Usa siempre el usuario de **tu** esquema, nunca `ADMIN` ni el esquema oficial.
 
El wallet y el archivo `.env` contienen credenciales: **nunca deben subirse al repositorio**. Ambos están incluidos en `.gitignore`.



## Imágenes de películas (OCI Object Storage)

Los pósters y banners no se guardan en la base de datos ni en el repositorio. Las imágenes viven en un bucket de OCI Object Storage, y la base de datos solo guarda la **clave** del objeto (columnas `CLAVE_POSTER` y `CLAVE_BANNER` de `PELICULAS`). La URL pública se arma con la URL base del bucket más esa clave.

El bucket es público para lectura, pero **no permite listar su contenido**: una imagen solo se puede ver si se conoce su URL exacta. Subir y borrar requiere credenciales, y solo las tiene el servidor.


### Configuración local OCI Object Storage(cada integrante)

Cada integrante usa su **propia** llave de API. Las llaves no se comparten.

1. **Acceso.** Pide al administrador de la tenancy un usuario y permisos sobre el bucket de desarrollo.

2. **Generar tu llave de API.** En la consola de OCI ve al ícono del perfil → *My profile* → *API keys* → *Add API key* → *Generate API key pair*. Descarga la llave privada (solo se puede descargar en ese momento) y copia el *Configuration file preview* antes de cerrar la ventana.

3. **Guardar la llave fuera del proyecto:**

```bash
   mkdir -p ~/.oci
   mv ~/Descargas/<archivo>.pem ~/.oci/nid_api_key.pem
   chmod 600 ~/.oci/nid_api_key.pem
```

4. **Crear `~/.oci/config`** con lo que copió, ajustando `key_file`:

```ini
   [DEFAULT]
   user=ocid1.user.oc1..<...>
   fingerprint=<...>
   tenancy=ocid1.tenancy.oc1..<...>
   region=us-ashburn-1
   key_file=~/.oci/nid_api_key.pem
```

   Después: `chmod 600 ~/.oci/config`. En Windows la carpeta es `C:\Users\<usuario>\.oci\` y conviene escribir la ruta completa en `key_file`.

5. **Variables en `servidor/.env`** (el modelo está en `servidor/.env.example`):

```env
   OCI_CONFIG_PROFILE=DEFAULT
   OCI_REGION=us-ashburn-1
   OCI_NAMESPACE=<pedirlo al equipo>
   OCI_BUCKET=<pedirlo al equipo>
```

6. **Probar.** Al arrancar el servidor, si falta alguna variable `OCI_*`, se detiene con un mensaje que dice cuáles son.

| Código | Cuándo |
|---|---|
| `200` | Devuelve `{ "url": "..." }` con la URL pública. |
| `400` | Id o tipo inválido, no se envió archivo o el archivo no es una imagen JPEG/PNG/WebP válida. |
| `404` | La película no existe. |
| `413` | La imagen supera los 5 MB. |

## Inicio de sesión con Google

El inicio de sesión con Google es **solo para clientes**. Empleados y administradores siguen entrando con correo y contraseña. El botón de Google entrega al cliente un token firmado por Google, el servidor lo verifica y, si es válido, responde con el mismo JWT que usa el resto del sistema.

Las cuentas de Google se guardan en la tabla `CREDENCIALES_GOOGLE`, aparte de `CREDENCIALES`, porque esa tabla exige hash y salt de contraseña y estas cuentas no tienen contraseña.

### Configuración local Google(cada integrante)

1. **Client ID.** Pídelo al equipo por un canal privado. Es el mismo para todos y no es un secreto, pero tampoco se sube al repositorio.

2. **Usuario de prueba.** Mientras la app de Google esté en modo "Pruebas", solo pueden iniciar sesión las cuentas agregadas como *usuarios de prueba* en la pantalla de consentimiento de OAuth. Pide que agreguen tu Gmail.

3. **Variables de entorno.** Agrega el mismo valor en ambos archivos (los modelos están en los `.env.example`):

```env
   # servidor/.env
   GOOGLE_ID_CLIENTE=<client-id>.apps.googleusercontent.com

   # cliente/.env
   VITE_GOOGLE_ID_CLIENTE=<client-id>.apps.googleusercontent.com
```

   Si no coinciden, el servidor rechaza los tokens. Después de cambiar `cliente/.env` hay que **reiniciar** `npm run dev`, porque Vite solo lee ese archivo al arrancar.

4. **Probar.** Al arrancar el servidor, viaja a la página de inicio de sesión y presiona el botón de Google. Luego digita el correo previamente ingresado en *usuarios de prueba*.

Google solo acepta como origen autorizado `http://localhost` o un dominio con HTTPS (no acepta IPs). Por eso el inicio de sesión con Google funciona en local, en la máquina virtual requerirá un dominio con certificado válido.

| Código | Cuándo |
|---|---|
| `200` | Devuelve `{ mensaje, token, usuario }`, con la misma forma que el inicio de sesión normal. |
| `400` | No se envió la credencial de Google. |
| `401` | La credencial no es válida, expiró, es de otra aplicación o el correo no está verificado. |


## Pago con tarjeta (ONVO)

Los clientes pagan sus boletos con tarjeta de crédito o débito a través de [ONVO](https://docs.onvopay.com), una pasarela de pagos costarricense. El proyecto usa la cuenta del equipo en **modo de prueba**: los pagos son reales a nivel técnico, pero no se mueve dinero.

El flujo de una compra es:

1. El navegador registra la tarjeta **directo en ONVO** con la llave publicable y recibe un id de método de pago. El número y el CVV **nunca** pasan por nuestro servidor.
2. El cliente envía ese id al servidor (`POST /api/compras`), que vuelve a validar la selección y calcula el total.
3. El servidor guarda la factura y sus boletos **sin confirmar** la transacción, cobra en ONVO y solo entonces confirma. Si el asiento ya se vendió, la compra se detiene **antes** de cobrar. Si algo falla después de cobrar, se reembolsa.
4. Con la compra guardada, se envía el comprobante por correo: un PDF con un código QR por boleto. Si el correo falla, la compra sigue siendo válida y el cliente puede descargar los boletos en pantalla.

Solo los **clientes** pueden comprar. Si el cliente lo pide, la tarjeta se guarda para compras futuras (en `METODOS_PAGO_CLIENTE` se guarda el id que da ONVO, la marca y los últimos 4 dígitos, nunca el número completo).

### Configuración local del pago (cada integrante)

1. **Llaves de ONVO.** Pídelas al equipo por un canal privado. Usa solo llaves de prueba (empiezan con `onvo_test_`); nunca las `onvo_live_`.

2. **Correo.** El servidor necesita las variables `SMTP_*` para enviar los comprobantes (son las mismas del correo de la contraseña temporal).

3. **Variables de entorno** (los modelos están en los `.env.example`):

```env
   # servidor/.env
   ONVO_LLAVE_SECRETA=onvo_test_secret_key_...
   SMTP_HOST=<servidor SMTP>
   SMTP_PORT=587
   SMTP_USER=<usuario>
   SMTP_PASS=<contraseña>
   SMTP_FROM="Cines Aurora <correo@ejemplo.com>"

   # cliente/.env
   VITE_ONVO_LLAVE_PUBLICA=onvo_test_publishable_key_...
```

   La llave **secreta** solo va en el servidor: con ella se puede cobrar y reembolsar. La **publicable** puede ir en el cliente.

   Al arrancar, si falta `ONVO_LLAVE_SECRETA` o alguna `SMTP_*`, el servidor se detiene con un mensaje que dice cuál. Después de cambiar `cliente/.env` hay que **reiniciar** `npm run dev`.

5. **Dependencias.** El servidor usa `qrcode`, `pdfkit` y `dejavu-fonts-ttf` (la fuente del PDF, porque las fuentes estándar no tienen el símbolo ₡). Se instalan con `npm run instalar-todo`.

6. **Probar.** Inicia sesión con una cuenta de **cliente** (si ya tenías sesión abierta, cierra sesión y vuelve a entrar), elige una función, selecciona asientos y boletos, y paga con una tarjeta de prueba.

### Tarjetas de prueba

Cualquier nombre, cualquier fecha de vencimiento futura y cualquier CVV válido para la marca (3 dígitos; 4 en Amex).

| Número | Marca | Resultado |
|---|---|---|
| `4242 4242 4242 4242` | Visa | Pago aprobado |
| `5555 5555 5555 4444` | Mastercard | Pago aprobado |
| `3782 822463 10005` | American Express | Pago aprobado |
| `4000 0000 0000 0002` | Visa | Pago rechazado |
| `4000 0000 0000 0127` | Visa | ONVO rechaza la tarjeta al registrarla |
| `4000 0000 0000 0119` | Visa | Error del procesador |
| `4000 0000 0000 3220` | Visa | Pide autenticación 3DS (se trata como rechazada) |

Los pagos aparecen en el panel de ONVO, en modo de prueba.

### Rutas

Todas exigen sesión con rol `CLIENTE`.

| Ruta | Qué hace |
|---|---|
| `POST /api/compras` | Compra los boletos. Recibe `{ idProyeccion, asientos, boletos }` y además `{ idMetodoPago, guardarMetodo }` para una tarjeta nueva, o `{ usarTarjetaGuardada: true }`. |
| `GET /api/compras/metodo-pago` | Tarjeta guardada del cliente (`{ metodoPago: null }` si no tiene). |
| `GET /api/compras/:idFactura/boletos` | PDF de los boletos de una compra del cliente. |

| Código | Cuándo |
|---|---|
| `201` | Compra realizada. Devuelve `{ idFactura, total, referencia, correoEnviado, metodoGuardado }`. |
| `400` | Datos inválidos, no hay tarjeta guardada o la tarjeta guardada está vencida. |
| `401` | Sin sesión, o la sesión se inició antes de este cambio (vuelve a iniciar sesión). |
| `402` | La tarjeta fue rechazada. |
| `403` | La cuenta no es de cliente. |
| `404` | La función o la compra no existe, o la compra es de otro cliente. |
| `409` | Algún asiento ya se vendió. No se cobra nada. |
| `502` | No se pudo comunicar con ONVO. |

### Problemas comunes

- **El pago falla sin llegar al servidor.** Revisa `VITE_ONVO_LLAVE_PUBLICA` y reinicia `npm run dev`. En las herramientas del navegador (pestaña *Network*), la petición a `api.onvopay.com` debe responder `200`.
- **`401` de ONVO.** La llave está mal copiada o es de modo en vivo.
- **"Tu sesión no es válida para comprar".** El token es anterior al cambio que agregó `idCliente`: cierra sesión y vuelve a entrar.
- **La compra se hace, pero no llega el correo.** Revisa las variables `SMTP_*` y la terminal del servidor. La compra igual es válida y los boletos se descargan en pantalla.


## Pago con PayPal

Los clientes también pueden pagar con su cuenta de PayPal. El proyecto usa el **sandbox** de PayPal: las cuentas, el dinero y los pagos son de prueba.

PayPal **no acepta colones**, así que se cobra en dólares con un tipo de cambio fijo (`TIPO_CAMBIO_DOLAR`). La factura se guarda en colones, igual que con tarjeta.

El flujo de una compra es:

1. Al presionar el botón de PayPal, el servidor valida la selección, convierte el total a dólares y crea una **orden** en PayPal (`POST /api/compras/paypal/ordenes`). Todavía no se guarda nada en la base de datos.
2. Se abre la ventana de PayPal y el cliente **aprueba** el pago. Aprobar no mueve dinero.
3. El servidor consulta la orden y verifica que esté aprobada, que el monto sea el esperado y que corresponda a la misma selección (en la orden se guarda una huella de la selección). Después guarda la factura sin confirmar, **captura** la orden (aquí se cobra) y confirma (`POST /api/compras/paypal/ordenes/:idOrden/captura`). Si algún asiento se vendió mientras el cliente estaba en PayPal, la compra se detiene **antes** de capturar.
4. Se envía el comprobante por correo, igual que con tarjeta.

Si el cliente cierra la ventana de PayPal, cancela o PayPal rechaza el pago, vuelve a la pantalla de pago con el mensaje "La transacción fue cancelada o no pudo completarse." y no se cobra nada.

### Configuración local de PayPal (cada integrante)

1. **Credenciales.** Pide al equipo, por un canal privado, el *Client ID* y el *Secret* de la app de sandbox, y el correo y la contraseña de la **cuenta Personal de prueba** (`...@personal.example.com`). Con esa cuenta se inicia sesión en la ventana de PayPal para "pagar"; nunca uses una cuenta real.

2. **Variables de entorno** (los modelos están en los `.env.example`):

```env
   # servidor/.env
   PAYPAL_ID_CLIENTE=<client-id>
   PAYPAL_SECRETO_CLIENTE=<secret>
   TIPO_CAMBIO_DOLAR=505

   # cliente/.env
   VITE_PAYPAL_ID_CLIENTE=<client-id>
```

   El *Client ID* es el mismo en los dos archivos y no es un secreto. El *Secret* solo va en el servidor. `TIPO_CAMBIO_DOLAR` son los colones por dólar; actualízalo cuando haga falta.

   Al arrancar, si falta alguna de las tres variables del servidor, se detiene con un mensaje que dice cuál. Después de cambiar `cliente/.env` hay que **reiniciar** `npm run dev`.

3. **Dependencias.** El cliente usa `@paypal/react-paypal-js`. Se instala con `npm run instalar-todo`.

4. **Probar.** Inicia sesión con una cuenta de **cliente**, elige una función y asientos, selecciona **PayPal** y presiona el botón amarillo. En la ventana de PayPal entra con la cuenta Personal de prueba y aprueba. Para probar la cancelación, cierra la ventana sin aprobar.

### Rutas

Exigen sesión con rol `CLIENTE`. Las dos reciben `{ idProyeccion, asientos, boletos }`.

| Ruta | Qué hace |
|---|---|
| `POST /api/compras/paypal/ordenes` | Crea la orden en PayPal. Devuelve `{ idOrden }`. |
| `POST /api/compras/paypal/ordenes/:idOrden/captura` | Verifica la orden y hace la compra. Devuelve `{ idFactura, total, referencia, correoEnviado }`. |

| Código | Cuándo |
|---|---|
| `201` | Orden creada o compra realizada. |
| `400` | Datos inválidos, o la orden no corresponde a la selección (otro monto u otros asientos). |
| `402` | El pago se canceló, no se aprobó o PayPal lo rechazó. |
| `409` | Algún asiento ya se vendió. No se cobra nada. |
| `502` | No se pudo comunicar con PayPal. |

### Problemas comunes

- **No aparece el botón de PayPal.** Revisa `VITE_PAYPAL_ID_CLIENTE` y reinicia `npm run dev`; la consola del navegador avisa si falta.
- **La ventana de PayPal no abre.** El navegador puede estar bloqueando ventanas emergentes para `localhost`.
- **"La orden de PayPal no corresponde a esta compra".** Cambió el tipo de cambio o la selección entre crear la orden y capturarla. Vuelve a presionar el botón de PayPal.
- **El pago se ve en dólares en PayPal.** Es lo esperado: PayPal no acepta colones.


## Nunca subir al repositorio

- La llave privada (`.pem`) y `~/.oci/config`.
- El ID del proyecto de Google
- Las llaves de ONVO, sobre todo la secreta.
- El *Secret* de PayPal y las credenciales de las cuentas de prueba.
- Imágenes de prueba.


## Cómo ejecutar el proyecto
 
Desde la carpeta `sistema-web/`:
 
```bash
npm run instalar-todo   # instala las dependencias de la raíz, del cliente y del servidor
npm run dev             # levanta el cliente y el servidor al mismo tiempo
```
 
Por defecto, el cliente corre en `http://localhost:5173` y el servidor en el puerto `5000`. Vite redirige las peticiones de la API al servidor mediante un proxy.


- Abre una terminal a `cd ./sistemaGestionCines/sistema-web/servidor` y ahí se levanta el servidor luego con `node src/index.js`.

- Abre otra terminal a `cd ./sistemaGestionCines/sistema-web/cliente` y ahí se levanta el cliente con `npm run dev`.

- Ahora se dirige al navegador y pega el link `http://localhost:5173`.

- Tambien se puede ejecutar desde la carpeta `sistema-web/` el comando `npm run dev`, este levantara en una sola terminal el servidor y el cliente.

II Ciclo 2026

## Créditos
 
- **Plantilla de los correos** (`servidor/src/plantillas/plantillaCorreo.js`): basada en [Free Responsive HTML Email Template](https://github.com/leemunroe/responsive-html-email-template) de Lee Munroe, con licencia MIT. Se le agregó el encabezado con la marca del cine y se quitaron el botón de llamada a la acción y el enlace para darse de baja. El aviso de la licencia está al inicio del archivo.
