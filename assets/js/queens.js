/* ==========================================================================
   RENEGADES QUEENS - FRONTEND JAVASCRIPT CONTROLLER
   Lightweight, highly optimized engine for loader, navbar, lightbox, and animations.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initMobileNav();
  initScrollEffects();
  initMagneticButtons();
  initQueensGallery();
});

// ==========================================================================
// 1. CINEMATIC LOADER
// ==========================================================================
function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  window.addEventListener("load", hideLoader);
  setTimeout(hideLoader, 2000); // safety timeout

  function hideLoader() {
    if (!loader.classList.contains("loaded")) {
      loader.classList.add("loaded");
    }
  }
}

// ==========================================================================
// 2. MOBILE NAVIGATION WIDGET
// ==========================================================================
function initMobileNav() {
  const toggle = document.querySelector(".mobile-nav-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    document.body.classList.toggle("nav-mobile-active");
  });
}

// ==========================================================================
// 3. SMOOTH SCROLL AND SCROLLED HEADER
// ==========================================================================
function initScrollEffects() {
  const header = document.querySelector(".header");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section, header, footer");

  // Sticky header transition on scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    // Update active nav-link state dynamically
    let currentActive = "";
    sections.forEach(sec => {
      const sectionTop = sec.offsetTop;
      if (window.scrollY >= (sectionTop - 200)) {
        currentActive = sec.getAttribute("id") || "";
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentActive}`) {
        link.classList.add("active");
      }
    });
  });

  // Bind smooth scroll anchors
  const scrollLinks = document.querySelectorAll(".scroll-link");
  scrollLinks.forEach(link => {
    link.addEventListener("click", function(e) {
      const targetId = this.getAttribute("href");
      if (targetId && targetId.startsWith("#") && targetId.length > 1) {
        e.preventDefault();
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          document.body.classList.remove("nav-mobile-active");
          const toggle = document.querySelector(".mobile-nav-toggle");
          if (toggle) toggle.classList.remove("open");

          const headerHeight = document.querySelector(".header").clientHeight;
          const offsetTop = targetSection.offsetTop - headerHeight;

          window.scrollTo({
            top: offsetTop,
            behavior: "smooth"
          });
        }
      }
    });
  });

  // Intersection Observer for fade-in reveals
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll(".reveal-element").forEach(el => revealObserver.observe(el));
}

// ==========================================================================
// 4. MAGNETIC BUTTONS INTERACTION
// ==========================================================================
function initMagneticButtons() {
  const btns = document.querySelectorAll(".btn, .btn-queens-primary, .btn-queens-secondary, .form-control");
  btns.forEach(btn => {
    btn.addEventListener("mousemove", function(e) {
      const pos = btn.getBoundingClientRect();
      const x = e.clientX - pos.left - pos.width / 2;
      const y = e.clientY - pos.top - pos.height / 2;
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });
    btn.addEventListener("mouseout", function() {
      btn.style.transform = "translate(0, 0)";
    });
  });
}

// ==========================================================================
// 5. GENERIC LIGHTBOX ZOOM WIDGET FOR QUEENS GALLERY
// ==========================================================================
function initQueensGallery() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxClose = document.getElementById("lightboxClose");

  if (!lightbox) return;

  window.openQueensLightbox = function(src, title) {
    if (lightboxImg) lightboxImg.src = src;
    if (lightboxTitle) lightboxTitle.textContent = title || "";
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  };

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}
