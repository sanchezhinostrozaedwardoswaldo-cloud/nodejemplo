const productosDemo = [
  {nombre:'Audífonos inalámbricos',categoria:'Audio',precio:129,icono:'🎧',tono:'violeta'},
  {nombre:'Teclado mecánico',categoria:'Accesorios',precio:189,icono:'⌨️',tono:'azul'},
  {nombre:'Mouse ergonómico',categoria:'Accesorios',precio:79,icono:'🖱️',tono:'rosa'},
  {nombre:'Monitor Full HD',categoria:'Pantallas',precio:649,icono:'🖥️',tono:'verde'},
  {nombre:'Cámara web HD',categoria:'Video',precio:149,icono:'📷',tono:'naranja'},
  {nombre:'Altavoz portátil',categoria:'Audio',precio:119,icono:'🔊',tono:'cian'}
];
const grid = document.getElementById('cuadriculaProductos');
const buscar = document.getElementById('buscarProducto');
const sinResultados = document.getElementById('sinResultados');
const modal = document.getElementById('modalTienda');
function aviso(texto) { document.getElementById('tituloModalTienda').textContent='Próximamente'; document.getElementById('textoModalTienda').textContent=texto; modal.hidden=false; document.getElementById('cerrarModalTienda').focus(); }
document.getElementById('cerrarModalTienda').addEventListener('click',()=>modal.hidden=true);
modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.hidden=true;});
function pintarProductos() {
 const termino=buscar.value.trim().toLocaleLowerCase('es');
 const visibles=productosDemo.filter(p=>(p.nombre+' '+p.categoria).toLocaleLowerCase('es').includes(termino));
 grid.replaceChildren(); sinResultados.hidden=visibles.length>0;
 for(const p of visibles) {
  const articulo=document.createElement('article');articulo.className='producto-card';
  const visual=document.createElement('div');visual.className='producto-visual tono-'+p.tono;visual.textContent=p.icono;
  const cuerpo=document.createElement('div');cuerpo.className='producto-cuerpo';
  const categoria=document.createElement('span');categoria.className='producto-categoria';categoria.textContent=p.categoria;
  const titulo=document.createElement('h3');titulo.textContent=p.nombre;
  const pie=document.createElement('div');pie.className='producto-pie';
  const precio=document.createElement('strong');precio.textContent='S/ '+p.precio.toFixed(2);
  const boton=document.createElement('button');boton.type='button';boton.textContent='Ver producto';boton.addEventListener('click',()=>aviso('En la siguiente etapa conectaremos los productos a MySQL y añadiremos sus detalles.'));
  pie.append(precio,boton);cuerpo.append(categoria,titulo,pie);articulo.append(visual,cuerpo);grid.append(articulo);
 }
}
buscar.addEventListener('input',pintarProductos);pintarProductos();
const token=sessionStorage.getItem('token');
const zona=document.getElementById('zonaCuenta'), login=document.getElementById('enlaceLogin'), menu=document.getElementById('menuCuenta'), cuenta=document.getElementById('botonCuenta');
function mostrarVisitante(){zona.hidden=true;login.hidden=false;menu.hidden=true;cuenta.setAttribute('aria-expanded','false');}
async function comprobarSesion(){
 if(!token){mostrarVisitante();return;}
 try{
  const r=await fetch('/api/auth/perfil',{headers:{Authorization:'Bearer '+token}});
  if(!r.ok)throw Error('Sesión no válida');
  const datos=await r.json();const usuario=datos.usuario;
  if(!usuario || !['Administrador','Usuario'].includes(usuario.rol))throw Error('Perfil no válido');
  document.getElementById('nombreCuenta').textContent=usuario.nombre;
  document.getElementById('correoCuenta').textContent=usuario.correo;
  const avatar=document.getElementById('avatarCuenta');avatar.textContent=(usuario.nombre||'U').charAt(0).toUpperCase();
  if(usuario.fotoPerfil && typeof usuario.fotoPerfil==='string'){
   const foto=usuario.fotoPerfil;
   if(foto.startsWith('/uploads/perfiles/') && !foto.includes('..')){const img=document.createElement('img');img.alt='';img.src=foto;img.onerror=()=>img.remove();avatar.append(img);}
  }
  const panel=menu.querySelector('a');panel.textContent=usuario.rol==='Administrador'?'Panel de administración':'Panel de usuario';
  login.hidden=true;zona.hidden=false;
 }catch{sessionStorage.removeItem('token');mostrarVisitante();}
}
cuenta.addEventListener('click',()=>{menu.hidden=!menu.hidden;cuenta.setAttribute('aria-expanded',String(!menu.hidden));});
document.addEventListener('click',e=>{if(!zona.contains(e.target)){menu.hidden=true;cuenta.setAttribute('aria-expanded','false');}});
document.getElementById('botonCerrarTienda').addEventListener('click',()=>{sessionStorage.removeItem('token');mostrarVisitante();});
comprobarSesion();
