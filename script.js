// Animación suave on-scroll
const faders = document.querySelectorAll('.fade-in');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
faders.forEach(el => io.observe(el));

// Smooth scroll para links internos
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const hash = a.getAttribute('href');
    if(hash.length>1 && document.querySelector(hash)){
      e.preventDefault();
      document.querySelector(hash).scrollIntoView({behavior:'smooth', block:'start'});
      history.replaceState(null, '', hash);
    }
  });
});

// Fallback simple para imágenes que fallan
document.querySelectorAll('img').forEach(img=>{
  img.addEventListener('error', () => {
    // si la imagen falla, ocultarla y mostrar el alt como texto accesible
    img.style.display = 'none';
    const p = document.createElement('div');
    p.className = 'w-full max-w-xs md:max-w-sm rounded-2xl bg-white/5 text-white/90 flex items-center justify-center mx-auto';
    p.style.height = img.height ? img.height + 'px' : '200px';
    p.textContent = img.alt || 'Imagen';
    img.insertAdjacentElement('afterend', p);
  }, {once:true});
});

// IntersectionObserver para animar .fade-in
if('IntersectionObserver' in window){
  const io = new IntersectionObserver((entries, obs)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('in-view');
        obs.unobserve(en.target);
      }
    });
  }, {threshold: .12});
  document.querySelectorAll('.fade-in').forEach(el => {
    el.classList.add('opacity-0', 'translate-y-4', 'transition', 'duration-700');
    io.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});