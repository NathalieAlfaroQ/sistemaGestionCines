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


## Cómo ejecutar el proyecto
 
Desde la carpeta `sistema-web/`:

- Primero hay que instalar las dependencias en la terminal con el comando `npm run instalar-todo`.

- Abre una terminal a `cd ./sistemaGestionCines/sistema-web/servidor/src` y ahí se levanta el servidor luego con `node src/index.js`.

- Abre otra terminal a `cd ./sistemaGestionCines/sistema-web/cliente` y ahí se levanta el cliente con `npm run dev`

- Ahora se dirige al navegador y pega el link `http://localhost:5173`.