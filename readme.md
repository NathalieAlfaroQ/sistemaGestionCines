# Proyecto Integrador de Ingeniería en Software y Bases de Datos


## Descripción del proyecto

Este proyecto es una página web de acceso a través de internet, consiste en un sistema de gestión para una cadena de cines llamada Cines Aurora, esta requiere administrar a sus empleados, productos de dulcería, cartelera, salas y proyecciones, para que los clientes puedan comprar boletos o dulces de forma remota para ofrecerles una experiencia organizada. Además el sistema contará con el registro de cuentas para brindar un servicio personalizado y los administradores tendrán la posibilidad de observar las métricas de su cine asignado para mejor planificación del negocio.


## Integrantes del grupo 4 llamado NID

Universidad de Costa Rica - II Ciclo 2026

- Nathalie Alfaro, B90221.
- Isaías Alberto Alfaro Ugalde, C20261.
- Rair Darío Gómez Bernal, C33243.


## Pila del producto en Jira

https://pinid.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog?atlOrigin=eyJpIjoiYjYzZmIxMjhhOWY3NDBmMjhlZjEzZjEyZjVlNTI4YTYiLCJwIjoiaiJ9


## Prototipo en Figma

https://www.figma.com/design/zvC2S2bIoiGgl8rrNnKPOt/Prototipo-baja-fidelidad-NID?node-id=0-1&t=AB4ugd05wKud1FHw-1


## Tecnologías utilizadas
 
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

- La Wallet de la base de datos junto con la contraseña con la que fue descargado.

- Proyecto de google para autenticación de terceros


## Configuración de la base de datos
 
Cada integrante desarrolla sobre su propio esquema, para que las pruebas y los errores no afecten al esquema oficial del cine.
 
1. Entra a Database Actions con **tu** usuario y abre una hoja de trabajo SQL.

2. Ejecuta el contenido de `sistema-web/servidor/baseDatos/esquema.sql`.

3. Los ID's se generan automáticamente (`IDENTITY`), por lo que **no** se envían en los `INSERT`. Las únicas excepciones son `PROVINCIAS` y `CANTONES`, donde el ID puede indicarse manualmente.
El script solo crea la estructura, no incluye datos.


## Configuración del servidor
 
1. **Wallet:** Descárgala desde la consola de OCI o solicitarlo a un integrante por un canal privado. Descomprímelo fuera de `sistema-web`.

2. **Variables de entorno:** Copia la plantilla y completa tus datos:

```bash
   cp sistema-web/servidor/.env.example sistema-web/servidor/.env
```
 
Cada variable está explicada en `.env.example`. Usa siempre el usuario de **tú** esquema, nunca `ADMIN` ni el esquema oficial.
 
La wallet y el archivo `.env` contienen credenciales: **nunca deben subirse al repositorio**. Ambos están incluidos en `.gitignore`.


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


### Nunca subir al repositorio

- La llave privada (`.pem`) y `~/.oci/config`.
- El ID del proyecto de Google
- Imágenes de prueba.


## Cómo ejecutar el proyecto
 
Desde la carpeta `sistema-web/`:

- Primero hay que instalar las dependencias en la terminal con el comando `npm run instalar-todo`.

- Abre una terminal a `cd ./sistemaGestionCines/sistema-web/servidor` y ahí se levanta el servidor luego con `node src/index.js`.

- Abre otra terminal a `cd ./sistemaGestionCines/sistema-web/cliente` y ahí se levanta el cliente con `npm run dev`.

- Ahora se dirige al navegador y pega el link `http://localhost:5173`.

- Tambien se puede ejecutar desde la carpeta `sistema-web/` el comando `npm run dev`, este levantara en una sola terminal el servidor y el cliente.