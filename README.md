# Proyecto Directorio Activo

Este proyecto es una aplicación de autenticación construida con Node.js, Next.js, JWT y PostgreSQL. Está diseñado para funcionar como un directorio activo que gestiona accesos a diferentes aplicaciones dentro de una empresa.

## Estructura del Proyecto

```
directorio-activo
├── src
│   ├── controllers
│   │   └── authController.js
│   ├── models
│   │   └── userModel.js
│   ├── routes
│   │   └── authRoutes.js
│   ├── middleware
│   │   └── authMiddleware.js
│   ├── config
│   │   └── database.js
│   ├── pages
│   │   ├── api
│   │   │   └── auth.js
│   │   └── index.js
│   └── app.js
├── .env
├── package.json
├── next.config.js
└── README.md
```

## Requisitos

- Node.js
- PostgreSQL

## Instalación

1. Clona el repositorio:
   ```
   git clone <URL_DEL_REPOSITORIO>
   cd directorio-activo
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura las variables de entorno en el archivo `.env`:
   ```
   DATABASE_URL=postgres://usuario:contraseña@localhost:5432/nombre_base_datos
   JWT_SECRET=tu_clave_secreta
   ```

4. Inicia la aplicación:
   ```
   npm run dev
   ```

## Uso

- Accede a la aplicación en `http://localhost:3000`.
- Utiliza las rutas de la API para gestionar el registro e inicio de sesión de usuarios.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request para discutir cambios.

## Licencia

Este proyecto está bajo la Licencia MIT.