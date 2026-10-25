const form = document.getElementById('formLogin');
const mensaje = document.getElementById('mensaje');
form.addEventListener('submit', async (event) => {
 event.preventDefault();
 mensaje.textContent='Verificando credenciales...'; mensaje.className='mensaje';
 const correo=document.getElementById('correo').value.trim();
 const password=document.getElementById('password').value;
 const boton=form.querySelector('button[type="submit"]');boton.disabled=true;
 try {
  const respuesta=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({correo,password})});
  const datos=await respuesta.json();
  if(!respuesta.ok || !datos.token)throw new Error(datos.mensaje||'Error al iniciar sesión');
  const perfilRespuesta=await fetch('/api/auth/perfil',{headers:{Authorization:'Bearer '+datos.token}});
  const perfil=await perfilRespuesta.json().catch(()=>({}));
  if(!perfilRespuesta.ok || !perfil.usuario)throw new Error('No se pudo verificar el rol de la cuenta');
  sessionStorage.setItem('token',datos.token);
  window.location.replace(perfil.usuario.rol==='Administrador'?'/dashboard.html':'/');
 }catch(error){mensaje.textContent=error.message;mensaje.className='mensaje error';boton.disabled=false;}
});
