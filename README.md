# Nodejemplo — Sistema Web de Gestión de Usuarios

Nodejemplo es una aplicación web desarrollada con **Node.js, Express, MySQL y Sequelize**. Su objetivo es gestionar usuarios mediante un sistema de autenticación con diferentes roles, permitiendo administrar cuentas, consultar estadísticas y registrar actividades.

El proyecto también incluye **NodeShop**, una tienda de demostración que funciona como página principal y permite acceder al sistema según el tipo de usuario.

## Funcionalidades principales

- Registro e inicio de sesión con autenticación JWT.
- Roles de administrador y usuario.
- Dashboard con estadísticas de usuarios.
- Administración de cuentas: registro, edición, eliminación y desactivación.
- Edición del perfil y fotografía personal.
- Cambio de contraseña.
- Historial de actividades del sistema.
- Tienda principal con productos demostrativos.
- Interfaz adaptable con modo claro, oscuro y automático.

## Tecnologías utilizadas

- **Backend:** Node.js y Express.
- **Base de datos:** MySQL.
- **ORM:** Sequelize.
- **Frontend:** HTML, CSS y JavaScript.
- **Seguridad:** JWT, bcrypt y Helmet.
- **Herramientas:** Visual Studio Code, MySQL Workbench y Git.

## Instalación y ejecución

El proyecto puede ejecutarse tanto en **Windows como en Linux**, siempre que se instalen y configuren las herramientas necesarias.

### 1. Requisitos previos

Es necesario tener instalados:

- Node.js y npm.
- MySQL Server.
- Git.
- MySQL Workbench (opcional).
- Visual Studio Code (opcional).

Comprobar las versiones desde la terminal:

```bash
node -v
npm -v
mysql --version
git --version
```

Estos comandos funcionan tanto en Windows como en Linux, siempre que las herramientas estén agregadas al PATH.

### 2. Clonar el repositorio

En Windows se puede utilizar PowerShell, CMD o Git Bash. En Linux, la terminal del sistema.

```bash
git clone https://github.com/sanchezhinostrozaedwardoswaldo-cloud/nodejemplo.git
```

Ingresar a la carpeta del proyecto:

```bash
cd nodejemplo
```

### 3. Instalar las dependencias

Ejecutar:

```bash
npm install
```

Este comando funciona en ambos sistemas operativos e instala las dependencias registradas en `package.json`.

### 4. Configurar MySQL

Antes de iniciar Nodejemplo, es necesario tener MySQL funcionando.

**En Fedora Linux:**

Iniciar el servicio:

```bash
sudo systemctl start mysqld
```

Comprobar su estado:

```bash
sudo systemctl status mysqld
```

Acceder a MySQL:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p
```

**En Windows:**

Si MySQL se instaló como servicio con el nombre predeterminado `MySQL80`, abrir PowerShell como administrador y ejecutar:

```powershell
Start-Service MySQL80
```

Comprobar su estado:

```powershell
Get-Service MySQL80
```

El nombre del servicio puede variar según la versión y la instalación. Para localizarlo:

```powershell
Get-Service *mysql*
```

Acceder a MySQL desde PowerShell o CMD:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p
```

Si Windows no reconoce el comando `mysql`, se debe agregar la carpeta `bin` de MySQL al PATH o utilizar MySQL Workbench.

**Crear la base de datos (ambos sistemas):**

Una vez dentro de MySQL, ejecutar:

```sql
CREATE DATABASE nodejemplo
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Salir de MySQL:

```sql
EXIT;
```

La base de datos también puede crearse desde MySQL Workbench.

### 5. Configurar las variables de entorno

En la carpeta principal del proyecto se debe crear un archivo llamado `.env`.

**En Fedora Linux:**

```bash
touch .env
```

**En Windows (PowerShell):**

```powershell
New-Item -Path .env -ItemType File
```

También se puede crear directamente desde Visual Studio Code.

Agregar la configuración de conexión y autenticación, utilizando los nombres de variables que espera el proyecto:

```env
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA
DB_NAME=nodejemplo

JWT_SECRET=REEMPLAZAR_POR_UNA_CLAVE_SECRETA_LARGA_Y_ALEATORIA
```

Reemplazar `TU_CONTRASEÑA` por la contraseña local de MySQL y establecer una clave secreta segura para JWT.

**Importante:** el archivo `.env` contiene información privada y no debe publicarse en GitHub. Los nombres de las variables deben coincidir con los utilizados en los archivos de configuración del proyecto.

### 6. Crear las tablas con Sequelize

Ejecutar las migraciones:

```bash
npx sequelize-cli db:migrate
```

Este comando funciona tanto en Windows como en Linux.

Las migraciones permiten crear las tablas necesarias para gestionar los usuarios y registrar las actividades del sistema.

Para comprobar que fueron aplicadas:

```bash
npx sequelize-cli db:migrate:status
```

Las migraciones ejecutadas correctamente aparecerán con el estado `up`.

### 7. Iniciar el servidor

Para ejecutar el proyecto en modo desarrollo:

```bash
npm run dev
```

También se puede iniciar directamente mediante:

```bash
node index.js
```

Ambos comandos funcionan en Windows y Linux.

Si la conexión con MySQL es correcta, la terminal mostrará un mensaje similar a:

```text
Conexión a MySQL mediante Sequelize exitosa
Servidor activo en http://localhost:3000
```

### 8. Abrir el proyecto

Desde el navegador, ingresar a:

**http://localhost:3000**

La página principal permite explorar la tienda demostrativa, registrarse e iniciar sesión.

El comportamiento depende del rol:

- **Administrador:** accede al dashboard con estadísticas, gestión de usuarios e historial de actividades.
- **Usuario:** regresa a la tienda principal y puede ingresar a su panel personal.

Las cuentas nuevas se registran como usuarios normales. Para utilizar las funciones administrativas, es necesario disponer de una cuenta autorizada con el rol `Administrador`.

## Estructura principal del proyecto

```text
nodejemplo/
├── config/          # Configuración de Sequelize
├── controllers/     # Lógica de las funcionalidades
├── middlewares/     # Autenticación y validaciones
├── migrations/      # Creación y modificación de tablas
├── models/          # Modelos de la base de datos
├── public/          # HTML, CSS y JavaScript del frontend
├── routes/          # Rutas de la API
├── .gitignore       # Archivos excluidos de Git
├── index.js         # Archivo principal del servidor
└── package.json     # Dependencias y comandos npm
```

## Consideraciones importantes

- MySQL debe estar iniciado antes de ejecutar el servidor.
- La configuración de conexión debe coincidir con la instalación local.
- Las contraseñas de los usuarios se almacenan mediante hash.
- Las fotografías de perfil se almacenan localmente y no se incluyen en el repositorio.
- Los productos de NodeShop son demostrativos; no se implementaron pagos ni ventas reales.
- El proyecto fue desarrollado con fines académicos.

## Repositorio

Código fuente disponible en:

https://github.com/sanchezhinostrozaedwardoswaldo-cloud/nodejemplo
