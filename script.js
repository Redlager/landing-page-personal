// Animación simple de fade-in al hacer scroll
const faders = document.querySelectorAll('.fade-in');

const appearOptions = {
  threshold: 0,
  rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll){
  entries.forEach(entry => {
    if(!entry.isIntersecting){
      return;
    } else {
      entry.target.classList.add('opacity-100','translate-y-0');
      appearOnScroll.unobserve(entry.target);
    }
  });
}, appearOptions);

faders.forEach(fader => {
  fader.classList.add('opacity-0','translate-y-10','transition','duration-700');
  appearOnScroll.observe(fader);
});
