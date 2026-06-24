/* ==========================================================================
   RENEGADES QUEENS - FRONTEND JAVASCRIPT CONTROLLER
   Lightweight, highly optimized engine for loader, navbar, lightbox, and animations.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initMobileNav();
  initQueensRoster();
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
    link.addEventListener("click", function (e) {
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
    btn.addEventListener("mousemove", function (e) {
      const pos = btn.getBoundingClientRect();
      const x = e.clientX - pos.left - pos.width / 2;
      const y = e.clientY - pos.top - pos.height / 2;
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });
    btn.addEventListener("mouseout", function () {
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

  window.openQueensLightbox = function (src, title) {
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

// ==========================================================================
// 6. DYNAMIC QUEENS ROSTER CARD RENDERER
// ==========================================================================
function initQueensRoster() {
  const grid = document.getElementById("queensSquadGrid");
  if (!grid) return;

  grid.innerHTML = "";
  const data = window.RENEGADES_CONFIG?.queensPlayers || [];

  if (data.length === 0) {
    grid.innerHTML = `
      <div class="premium-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 5rem 2rem; background: rgba(18, 18, 18, 0.6); border: 1px dashed var(--queens-glass-border); border-radius: 8px; box-shadow: var(--queens-glow);">
        <div class="empty-state-icon" style="font-size: 4rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 10px var(--queens-violet));">👑</div>
        <h3 style="font-size: 1.8rem; margin-bottom: 0.75rem; color: #fff; font-family: var(--font-display); font-weight: 800;">No squad roster registered</h3>
        <p style="color: var(--queens-text-secondary); max-width: 500px; margin: 0 auto; line-height: 1.6; font-size: 1.05rem;">Our team stars will be showcased here.</p>
      </div>
    `;
    return;
  }

  data.forEach((player, index) => {
    const card = document.createElement("div");
    card.className = `queens-player-card reveal-element delay-${(index % 3) + 1}`;

    const social = player.social || { instagram: "#", twitter: "#", facebook: "#" };
    
    let socialHTML = "";
    if (social.instagram && social.instagram !== "#") {
      socialHTML += `<a href="${social.instagram}" target="_blank" rel="noopener" class="queens-player-social-link" aria-label="${player.name} Instagram">📸</a>`;
    }
    if (social.twitter && social.twitter !== "#") {
      socialHTML += `<a href="${social.twitter}" target="_blank" rel="noopener" class="queens-player-social-link" aria-label="${player.name} Twitter">🐦</a>`;
    }
    if (social.facebook && social.facebook !== "#") {
      socialHTML += `<a href="${social.facebook}" target="_blank" rel="noopener" class="queens-player-social-link" aria-label="${player.name} Facebook">👤</a>`;
    }

    card.innerHTML = `
      <div class="queens-player-img-wrapper">
        <img class="queens-player-img" src="${player.image || 'assets/images/logo_women.png'}" alt="${player.name}" style="cursor: zoom-in;" onclick="window.openQueensLightbox('${player.image || 'assets/images/logo_women.png'}', '${player.name} - ${player.role}')">
      </div>
      <div class="queens-player-card-inner">
        <span class="queens-player-badge">${player.badge || 'PROSPECT'}</span>
        <h3 class="queens-player-name">${player.name}</h3>
        <span class="queens-player-role">${player.role}</span>
        <p class="queens-player-desc">${player.description || ''}</p>
        ${player.achievement ? `<div class="queens-player-achievement"><span>🏆</span> ${player.achievement}</div>` : ""}
        ${socialHTML ? `<div class="queens-player-socials">${socialHTML}</div>` : ""}
      </div>
    `;

    grid.appendChild(card);
  });
}
