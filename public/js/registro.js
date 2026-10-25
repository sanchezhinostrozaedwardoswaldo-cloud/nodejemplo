
const form = document.getElementById('formRegistro');
const mensaje = document.getElementById('mensaje');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;

    try {
        const respuesta = await fetch('/api/auth/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, correo, password })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'Error al registrarse');
        }

        mensaje.textContent = 'Cuenta creada. Redirigiendo...';
        mensaje.className = 'mensaje exito';

        window.location.href = '/login.html';

    } catch (error) {
        mensaje.textContent = error.message;
        mensaje.className = 'mensaje error';
    }
});
