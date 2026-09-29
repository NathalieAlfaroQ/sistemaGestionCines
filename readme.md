# Proyecto Integrador de Ingeniería en Software y Bases de Datos



## Descripción del proyecto

Este proyecto es una página web de acceso a través de internet, consiste en un sistema de gestión para una cadena de cines que requiere administrar a sus empleados, productos de dulcería, cartelera, salas y proyecciones, para que los clientes puedan comprar boletos o dulces de forma remota para que tenga una experiencia más organizada. Además el sistema contará registro de cuentas para brindar un servicio más personalizado y los administradores tendrán la posibilidad de observar las métricas de su cine asignado para mejor planificación del negocio.



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
 
- Node.js, en una versión LTS reciente, y npm.
- Un usuario y esquema propio en la base de datos Oracle del proyecto.
- El Wallet de la base de datos, junto con la contraseña con la que fue descargado.



## Configuración de la base de datos
 
Cada integrante desarrolla sobre su propio esquema, para que las pruebas y los errores no afecten al esquema oficial del cine.
 
1. Entra a Database Actions con **tu** usuario y abre una hoja de trabajo SQL.
2. Ejecuta el contenido de `sistema-web/servidor/baseDatos/esquema.sql` con **Ejecutar script** (F5). Crea las tablas, las llaves foráneas y los triggers.
3. Los IDs se generan automáticamente (`IDENTITY`), por lo que **no** se envían en los `INSERT`. Las únicas excepciones son `PROVINCIAS` y `CANTONES`, donde el ID puede indicarse manualmente.
El script solo crea la estructura, no incluye datos.



## Configuración del servidor
 
1. **Wallet.** Descárgalo desde la consola de OCI o pedirlo a un integrante por un canal privado. Descomprímelo dentro de `sistema-web/servidor/wallet/`.
2. **Variables de entorno.** Copia la plantilla y completa tus datos:

```bash
   cp sistema-web/servidor/.env.example sistema-web/servidor/.env
```
 
Cada variable está explicada en `.env.example`. Usa siempre el usuario de **tu** esquema, nunca `ADMIN` ni el esquema oficial.
 
El wallet y el archivo `.env` contienen credenciales: **nunca deben subirse al repositorio**. Ambos están incluidos en `.gitignore`.



## Cómo ejecutar el proyecto
 
Desde la carpeta `sistema-web/`:
 
```bash
npm run instalar-todo   # instala las dependencias de la raíz, del cliente y del servidor
npm run dev             # levanta el cliente y el servidor al mismo tiempo
```
 
Por defecto, el cliente corre en `http://localhost:5173` y el servidor en el puerto `5000`. Vite redirige las peticiones de la API al servidor mediante un proxy.



Universidad de Costa Rica

II Ciclo 2026