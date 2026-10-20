# Proyecto Integrador de Ingeniería en Software y Bases de Datos


## Descripción del proyecto

Este proyecto es una página web de acceso a través de internet, consiste en un sistema de gestión para una cadena de cines que requiere administrar a sus empleados, productos de dulcería, cartelera, salas y proyecciones, para que los clientes puedan comprar boletos o dulces de forma remota para que tenga una experiencia más organizada. Además el sistema contará registro de cuentas para brindar un servicio más personalizado y los administradores tendrán la posibilidad de observar las métricas de su cine asignado para mejor planificación del negocio.


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
 
- Node.js, en una versión LTS reciente, y npm.

- Un usuario y esquema propio en la base de datos Oracle del proyecto.

- La Wallet de la base de datos, junto con la contraseña con la que fue descargado.


## Configuración de la base de datos
 
Cada integrante desarrolla sobre su propio esquema, para que las pruebas y los errores no afecten al esquema oficial del cine.
 
1. Entra a Database Actions con **tú** usuario y abre una hoja de trabajo SQL.

2. Ejecuta el contenido de `sistema-web/servidor/baseDatos/esquema.sql` con **Ejecutar script** (F5). Crea las tablas, las llaves foráneas y los triggers.

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

### Configuración local (cada integrante)

Cada integrante usa su **propia** llave de API. Las llaves no se comparten.

1. **Acceso.** Pedile al administrador de la tenancy un usuario y permisos sobre el bucket de desarrollo.

2. **Generar tu llave de API.** En la consola de OCI: ícono de perfil → *My profile* → *API keys* → *Add API key* → *Generate API key pair*. Descargá la llave privada (solo se puede descargar en ese momento) y copiá el *Configuration file preview* antes de cerrar la ventana.

3. **Guardar la llave fuera del proyecto:**
```bash
   mkdir -p ~/.oci
   mv ~/Descargas/<archivo>.pem ~/.oci/nid_api_key.pem
   chmod 600 ~/.oci/nid_api_key.pem
```

4. **Crear `~/.oci/config`** con lo que copiaste, ajustando `key_file`:
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
| `200` | Devuelve `{ "url": "..." }` con la URL pública |
| `400` | Id o tipo inválido, no se envió archivo, o el archivo no es una imagen JPEG/PNG/WebP válida |
| `404` | La película no existe |
| `413` | La imagen supera los 5 MB |

### Nunca subir al repositorio

- La llave privada (`.pem`) y `~/.oci/config`
- Imágenes de prueba



## Cómo ejecutar el proyecto
 
Desde la carpeta `sistema-web/`:

- Primero hay que instalar las dependencias en la terminal con el comando `npm run instalar-todo`.

- Abre una terminal a `cd ./sistemaGestionCines/sistema-web/servidor/src` y ahí se levanta el servidor luego con `node src/index.js`.

- Abre otra terminal a `cd ./sistemaGestionCines/sistema-web/cliente` y ahí se levanta el cliente con `npm run dev`

- Ahora se dirige al navegador y pega el link `http://localhost:5173`.