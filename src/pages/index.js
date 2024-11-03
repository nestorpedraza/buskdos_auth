import React from 'react';

const HomePage = () => {
    return (
        <div>
            <h1>Bienvenido al Directorio Activo</h1>
            <p>Utiliza el sistema de autenticación para acceder a las aplicaciones de la empresa.</p>
            <a href="/api/auth/login">Iniciar sesión</a>
            <br />
            <a href="/api/auth/register">Registrarse</a>
        </div>
    );
};

export default HomePage;