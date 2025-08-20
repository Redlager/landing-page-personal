// Efecto simple para animar scroll
document.addEventListener("scroll", () => {
  const header = document.querySelector(".hero");
  header.style.opacity = 1 - window.scrollY / 700;
});
