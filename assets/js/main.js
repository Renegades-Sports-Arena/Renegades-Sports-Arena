// Renegades Sports Arena - Main Javascript File
// Controls dynamic data binding, scroll animations, carousels, lightbox, counters, and form validation.

document.addEventListener("DOMContentLoaded", () => {
  const config = window.RENEGADES_CONFIG;
  if (!config) {
    console.error("Renegades configuration not found!");
    return;
  }

  // Initialize all dynamic bindings and features
  initAnnouncement(config.general);
  initGeneral(config.general);
  initHero(config.hero);
  initWhyChooseUs(config.whyChooseUs);
  initFutureArena(config.futureArena);
  initClubs(config.clubs);
  initPrograms(config.programs);
  initPathway(config.renegadesPathway);
  initParentsChoose(config.whyParentsChoose);
  if (config.shop) {
    initProShop(config.shop);
    initKitBuilder(config.shop.products || []);
  }
  initVisionMission(config.visionMission);
  const coachData = config?.coaches?.list?.length ? config.coaches : window.RENEGADES_DEFAULT_CONFIG.coaches;
  initCoaches(coachData);
  initFacilities(config.facilities);
  initGallery(config.gallery);
  initReviews(config.reviews);
  initAchievements(config.achievements);
  initContactForm(config.general);
  initScrollEffects();
  initMobileNav();
  initLoader();
  initHallOfFame(window.getHallOfFameData());
  initMagneticButtons();
  initProShopCheckout();

  // Register PWA Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js")
        .then(reg => console.log("PWA Service Worker registered:", reg.scope))
        .catch(err => console.error("PWA Service Worker registration failed:", err));
    });
  }

  // Request browser push notification permissions on load
  if (window.PushNotificationService) {
    window.PushNotificationService.requestPermission();
  }
});

// ==========================================================================
// 0. ANNOUNCEMENT BANNER
// ==========================================================================
function initAnnouncement(data) {
  const banner = document.getElementById("announcementBanner");
  const text = document.getElementById("announcementText");
  const link = document.getElementById("announcementLink");
  const closeBtn = document.getElementById("announcementClose");

  if (!banner || !text) return;

  if (data.announcementEnabled && data.announcementText) {
    banner.style.display = "flex";
    banner.style.backgroundColor = data.announcementBgColor || "#FF6B00";
    text.textContent = data.announcementText;
    document.body.classList.add("has-announcement");

    if (data.announcementLink) {
      link.href = data.announcementLink;
      link.style.display = "inline-block";
      link.textContent = "Learn More →";
    } else {
      link.style.display = "none";
    }
  } else {
    banner.style.display = "none";
    document.body.classList.remove("has-announcement");
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      banner.style.display = "none";
      document.body.classList.remove("has-announcement");
    });
  }
}

// ==========================================================================
// 1. GENERAL & LOGO BINDINGS
// ==========================================================================
function initGeneral(data) {
  // Page Title
  document.title = `${data.academyName} | ${data.tagline}`;

  // Logo Text
  const logoTextElems = document.querySelectorAll(".logo-text");
  logoTextElems.forEach(el => {
    el.innerHTML = `${data.academyName.split(" ")[0]} <span>${data.academyName.split(" ").slice(1).join(" ")}</span>`;
  });

  // Footer Contacts
  const phoneLinks = document.querySelectorAll(".contact-phone");
  phoneLinks.forEach(el => {
    if (data.phone.includes("/")) {
      const numbers = data.phone.split("/");
      el.innerHTML = numbers.map(num => {
        const trimmed = num.trim();
        const cleanDigits = trimmed.replace(/[^0-9+]/g, '');
        return `<a href="tel:${cleanDigits}" style="color: inherit; text-decoration: none; border-bottom: 1px dashed rgba(255,255,255,0.2);">${trimmed}</a>`;
      }).join(" / ");
      el.removeAttribute("href"); // Remove default href since we put nested anchors
      el.style.pointerEvents = "auto";
    } else {
      el.textContent = data.phone;
      el.href = `tel:${data.phone.replace(/[^0-9+]/g, '')}`;
    }
  });

  // Dynamically add WhatsApp links row under the phone links row in the footer
  const phoneParent = document.querySelector(".contact-phone")?.closest(".footer-contact-item");
  if (phoneParent && !document.querySelector(".footer-whatsapp-row")) {
    const waRow = document.createElement("div");
    waRow.className = "footer-contact-item footer-whatsapp-row";
    waRow.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: var(--accent-primary);"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.233-1.371a9.936 9.936 0 0 0 4.777 1.217h.005c5.505 0 9.989-4.478 9.99-9.984A9.972 9.972 0 0 0 12.012 2zm5.842 14.186c-.255.72-1.48 1.408-2.033 1.464-.5.052-1.154.077-1.85-.152a12.879 12.879 0 0 1-5.112-3.176 11.233 11.233 0 0 1-2.584-4.526c-.378-1.264.44-2.228 1.156-2.228.256 0 .428.005.57.01.18.007.316.012.457.348.163.39.56 1.36.608 1.46.049.096.082.21.016.342-.065.13-.1.218-.196.33-.098.114-.207.256-.294.343-.098.098-.201.205-.087.4.114.195.505.83 1.08 1.346.744.665 1.37.87 1.564.968.196.1.31.086.425-.043.114-.13.5-.58.636-.78.136-.2.272-.163.457-.096.184.065 1.173.553 1.375.656.202.103.337.152.386.234.05.08.05.474-.204 1.196z"/></svg>
      <div>
        <a href="https://wa.me/${data.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi%20Renegades%20Sports%20Arena%2C%20I'm%20interested!" target="_blank" rel="noopener" style="border-bottom: 1px dashed rgba(255,255,255,0.2);">WA: 9731134665</a>
        ${data.whatsappNumber2 ? ` / <a href="https://wa.me/${data.whatsappNumber2.replace(/[^0-9]/g, '')}?text=Hi%20Renegades%20Sports%20Arena%2C%20I'm%20interested!" target="_blank" rel="noopener" style="border-bottom: 1px dashed rgba(255,255,255,0.2);">WA: 8884434665</a>` : ''}
      </div>
    `;
    phoneParent.parentNode.insertBefore(waRow, phoneParent.nextSibling);
  }

  const emailLinks = document.querySelectorAll(".contact-email");
  emailLinks.forEach(el => {
    el.textContent = data.email;
    el.href = `mailto:${data.email}`;
  });

  const addressText = document.querySelector(".contact-address");
  if (addressText) addressText.textContent = data.address;

  // Social Links
  const instagramLinks = document.querySelectorAll(".social-instagram");
  instagramLinks.forEach(el => el.href = data.instagramUrl);

  const facebookLinks = document.querySelectorAll(".social-facebook");
  facebookLinks.forEach(el => el.href = data.facebookUrl);

  const youtubeLinks = document.querySelectorAll(".social-youtube");
  youtubeLinks.forEach(el => el.href = data.youtubeUrl);

  const googleReviewLinks = document.querySelectorAll(".social-google-review");
  googleReviewLinks.forEach(el => el.href = data.googleBusinessUrl);

  // WhatsApp Floating Button
  const waBtn = document.getElementById("whatsappLink");
  if (waBtn) {
    waBtn.href = `https://wa.me/${data.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi%20Renegades%20Sports%20Arena%2C%20I'm%20interested%20in%20joining%20the%20academy!`;
  }
}

// ==========================================================================
// 2. HERO SECTION
// ==========================================================================
function initHero(data) {
  const title = document.querySelector(".hero-title");
  const sub = document.querySelector(".hero-sub");
  const tagline = document.querySelector(".hero-tagline");
  const primaryCta = document.querySelector(".hero-btn-primary");
  const secondaryCta = document.querySelector(".hero-btn-secondary");
  const shopCta = document.querySelector(".hero-btn-shop");
  const videoBg = document.querySelector(".hero-video-bg");

  if (title) title.innerHTML = data.title.replace("RENEGADES", "<span class='text-orange'>RENEGADES</span>");
  if (sub) sub.textContent = data.subheading;
  if (tagline) tagline.textContent = data.tagline || "";
  if (primaryCta) primaryCta.textContent = data.primaryCtaText;
  if (secondaryCta) secondaryCta.textContent = data.secondaryCtaText;
  if (shopCta) shopCta.textContent = data.shopCtaText || "EXPLORE THE SHOP";

  // Video loop with image fallback
  if (videoBg) {
    videoBg.src = data.videoUrl;
    videoBg.poster = data.fallbackImageUrl;
    videoBg.load();
  }
}

// ==========================================================================
// 3. WHY CHOOSE US
// ==========================================================================
function initWhyChooseUs(data) {
  const title = document.querySelector("#whySectionTitle");
  if (title) title.textContent = data.title;

  const grid = document.getElementById("whyGrid");
  if (!grid) return;

  grid.innerHTML = "";
  data.cards.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = `why-card reveal-element delay-${(index % 3) + 1}`;
    cardEl.innerHTML = `
      <div class="why-icon">${card.icon}</div>
      <h3>${card.title}</h3>
      <p>${card.description}</p>
    `;
    grid.appendChild(cardEl);
  });
}

// ==========================================================================
// 4. FUTURE STARS ARENA (GROUND SHOWCASE BACKDROP)
// ==========================================================================
function initFutureArena(data) {
  if (!data) return;
  const badge = document.getElementById("arenaBadge");
  const title = document.getElementById("arenaTitle");
  const subtitle = document.getElementById("arenaSubtitle");
  const desc = document.getElementById("arenaDesc");
  const list = document.getElementById("arenaFeaturesList");
  const sec = document.getElementById("future-arena");

  if (badge) badge.textContent = data.badge;
  if (title) title.textContent = data.title;
  if (subtitle) subtitle.textContent = data.subtitle;
  if (desc) desc.textContent = data.description;

  if (sec && data.image) {
    sec.style.backgroundImage = `linear-gradient(180deg, rgba(10, 10, 10, 0.7) 0%, rgba(10, 10, 10, 0.5) 50%, rgba(10, 10, 10, 0.8) 100%), url('${data.image}')`;
  }

  if (list && data.features) {
    list.innerHTML = "";
    data.features.forEach(feat => {
      const li = document.createElement("li");
      li.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${feat}</span>
      `;
      list.appendChild(li);
    });
  }

  // Zoom click handler on the glass card to open full backdrop image zoom
  const card = document.querySelector(".future-arena-hero-card");
  if (card) {
    card.style.cursor = "zoom-in";
    card.title = "Click to zoom background ground view";
    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      if (window.openGenericLightbox) {
        window.openGenericLightbox(data.image, `${data.title} - ${data.subtitle}`);
      }
    });
  }
}

// ==========================================================================
// 5. ASSOCIATED CLUB NETWORK
// ==========================================================================
function initClubs(data) {
  const header = document.querySelector("#clubsHeader");
  const sub = document.querySelector("#clubsSub");
  const desc = document.querySelector("#clubsDesc");
  const ticker = document.getElementById("clubsTicker");

  if (header) header.textContent = data.title;
  if (sub) sub.textContent = data.subheading;
  if (desc) desc.textContent = data.disclaimer;

  if (!ticker) return;

  ticker.innerHTML = "";

  // We need to double the array elements to make an infinite seamless ticker
  const doubleList = [...data.list, ...data.list];
  doubleList.forEach(club => {
    const item = document.createElement("div");
    item.className = "ticker-item";
    item.innerHTML = `
      <div class="club-avatar">${club.logoText}</div>
      <span class="club-name">${club.name}</span>
    `;
    ticker.appendChild(item);
  });
}

// ==========================================================================
// 6. PLAYER DEVELOPMENT PROGRAMS
// ==========================================================================
function initPrograms(data) {
  const container = document.getElementById("programsGrid");
  if (!container) return;

  // Render Category Filter Controls
  const filterWrapper = document.getElementById("programsFilterControls");
  if (filterWrapper) {
    const categories = ["all", "junior", "elite", "specialist"];
    filterWrapper.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat === "all" ? "active" : ""}" data-category="${cat}">
        ${cat === "all" ? "All Programs" : cat + " Programs"}
      </button>
    `).join("");
  }

  // Helper to render checkmark SVG
  const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  function renderPrograms(category = "all") {
    container.innerHTML = "";

    const filtered = category === "all"
      ? data.list
      : data.list.filter(p => p.category === category);

    filtered.forEach((p, idx) => {
      const card = document.createElement("div");
      card.className = `program-card reveal-element delay-${(idx % 3) + 1} revealed`;

      const isImgIcon = p.icon.includes("/") || p.icon.includes(".png") || p.icon.includes(".jpg");
      const iconHtml = isImgIcon
        ? `<img src="${p.icon}" alt="${p.title}" style="height: 50px; width: auto; object-fit: contain;">`
        : p.icon;

      card.innerHTML = `
        <div class="program-icon-badge">${iconHtml}</div>
        <span class="program-age">${p.ageGroup}</span>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="program-benefits">
          ${p.benefits.map(b => `
            <div class="program-benefit-item">${checkIcon} <span>${b}</span></div>
          `).join("")}
        </div>
        <a href="#contact" class="btn btn-outline-orange program-cta scroll-link">BOOK A FREE TRIAL</a>
      `;
      container.appendChild(card);
    });

    // Rebind scroll links
    bindScrollLinks();
  }

  // Initial Render
  renderPrograms("all");

  // Click handler
  if (filterWrapper) {
    filterWrapper.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;

      filterWrapper.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const cat = btn.getAttribute("data-category");
      renderPrograms(cat);
    });
  }
}

// ==========================================================================
// 7. PLAYER SPOTLIGHT
// ==========================================================================
// ==========================================================================
// 7a. THE RENEGADES PATHWAY (TIMELINE)
// ==========================================================================
function initPathway(data) {
  const container = document.getElementById("pathwayContainer");
  if (!container || !data) return;

  container.innerHTML = "";

  data.steps.forEach((step, index) => {
    const item = document.createElement("div");
    const sideClass = index % 2 === 0 ? "left" : "right";
    item.className = `timeline-item ${sideClass} reveal-element delay-${(index % 3) + 1}`;

    item.innerHTML = `
      <div class="timeline-badge">${index + 1}</div>
      <div class="timeline-card glass-card">
        <span class="timeline-step-label">${step.step}</span>
        <h3>${step.title}</h3>
        <p>${step.description}</p>
      </div>
    `;
    container.appendChild(item);
  });
}

// ==========================================================================
// 7b. WHY PARENTS CHOOSE RENEGADES
// ==========================================================================
function initParentsChoose(data) {
  const container = document.getElementById("parentsChooseGrid");
  if (!container || !data) return;

  container.innerHTML = "";
  data.list.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = `trust-card glass-card reveal-element delay-${(index % 4) + 1}`;
    cardEl.innerHTML = `
      <div class="trust-icon">✓</div>
      <h3>${card.title}</h3>
      <p>${card.description}</p>
    `;
    container.appendChild(cardEl);
  });
}

// ==========================================================================
// 7c. RENEGADES PRO SHOP
// ==========================================================================
function initProShop(data) {
  const container = document.getElementById("shopGrid");
  const filterWrapper = document.getElementById("shopFilterControls");
  if (!container || !data) return;

  // Render Tabs
  if (filterWrapper && data.categories) {
    filterWrapper.innerHTML = data.categories.map((cat, idx) => `
      <button class="filter-btn ${idx === 0 ? "active" : ""}" data-shop-filter="${cat.id}">
        ${cat.name}
      </button>
    `).join("");
  }

  // Dynamic discounts list banner updates
  const bat = data.products.find(p => p.category === 'bats');
  const pad = data.products.find(p => p.category === 'pads');
  const glove = data.products.find(p => p.category === 'gloves');
  const protection = data.products.find(p => p.category === 'protection');
  const bag = data.products.find(p => p.category === 'bags');

  const discountsContainer = document.querySelector(".benefits-discounts-list");
  if (discountsContainer) {
    discountsContainer.innerHTML = "";
    const discountItems = [
      { item: bat, icon: "🏏", label: "Premium Willow Bat" },
      { item: pad, icon: "🥊", label: "Elite Protective Pads" },
      { item: glove, icon: "🧤", label: "Professional Batting Gloves" },
      { item: protection, icon: "🦵", label: "Moonwalkr Thigh Pads" },
      { item: bag, icon: "🎒", label: "SG Premium Backpack/Bag" }
    ];

    discountItems.forEach(d => {
      if (d.item) {
        const itemDiv = document.createElement("div");
        itemDiv.className = "discount-item";
        const orig = d.item.originalPrice || d.item.price;
        const price = d.item.price;
        const savings = orig - price;
        itemDiv.innerHTML = `
          <span class="item-name">${d.icon} ${d.item.name}</span>
          <div class="price-flow">
            <span class="original-val">₹${orig.toLocaleString('en-IN')}</span> → <span class="discount-val">₹${price.toLocaleString('en-IN')}</span> 
            ${savings > 0 ? `<span class="save-badge">Save ₹${savings.toLocaleString('en-IN')}</span>` : ''}
          </div>
        `;
        discountsContainer.appendChild(itemDiv);
      }
    });
  }

  // Update Full Kit Promo Card dynamically
  const fullKitCard = document.querySelector(".full-kit-promo-card");
  if (fullKitCard) {
    let origTotal = 0;
    let priceTotal = 0;
    const kitProducts = [bat, pad, glove, protection, bag];
    kitProducts.forEach(p => {
      if (p) {
        origTotal += (p.originalPrice || p.price);
        priceTotal += p.price;
      }
    });
    const savingsTotal = origTotal - priceTotal;

    const origEl = fullKitCard.querySelector(".strike-price");
    const finalEl = fullKitCard.querySelector(".glowing-price");
    const savingsEl = fullKitCard.querySelector(".savings-highlight");
    const orderBtn = fullKitCard.querySelector(".btn-order-full-kit");

    if (origEl) origEl.textContent = `₹${origTotal.toLocaleString('en-IN')}`;
    if (finalEl) finalEl.textContent = `₹${priceTotal.toLocaleString('en-IN')}`;
    if (savingsEl) savingsEl.textContent = `₹${savingsTotal.toLocaleString('en-IN')}`;
    if (orderBtn) {
      const waText = encodeURIComponent(`Hello Renegades Sports Arena, I would like to order the Full Kit Package containing Bats, Pads, Gloves, Thigh Pads, and Kit Bag for ₹${priceTotal.toLocaleString('en-IN')}.`);
      orderBtn.href = `https://wa.me/919731134665?text=${waText}`;
    }
  }

  function renderProducts(categoryId = "all") {
    container.innerHTML = "";
    const filtered = categoryId === "all"
      ? data.products
      : data.products.filter(p => p.category === categoryId);

    filtered.forEach((p, idx) => {
      const card = document.createElement("div");
      card.className = `product-card reveal-element delay-${(idx % 4) + 1} revealed`;

      const badgeHtml = p.badge ? `<span class="product-badge">${p.badge}</span>` : '';
      const discountPct = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
      const discountBadgeHtml = discountPct > 0 ? `<span class="product-discount-badge">-${discountPct}%</span>` : '';

      const isOutOfStock = p.stock === "out-of-stock";
      const stockBadgeHtml = p.stock === "low-stock"
        ? `<span class="stock-badge low-stock">Low Stock</span>`
        : p.stock === "out-of-stock"
          ? `<span class="stock-badge out-of-stock">Out of Stock</span>`
          : ``;

      const priceHtml = p.originalPrice && p.originalPrice > p.price
        ? `<div class="product-price"><span class="price-original">₹${p.originalPrice.toLocaleString('en-IN')}</span> <span class="price-discount">₹${p.price.toLocaleString('en-IN')}</span></div>`
        : `<div class="product-price"><span class="price-discount">₹${p.price.toLocaleString('en-IN')}</span></div>`;

      const waText = encodeURIComponent(`Hello Renegades Sports Arena, I am interested in purchasing: ${p.name} (Price: ₹${p.price.toLocaleString('en-IN')})`);
      const waUrl = `https://wa.me/919731134665?text=${waText}`;

      const imgUrl = p.image || "assets/images/logo.png";
      const srcUrl = imgUrl.startsWith('data:') ? imgUrl : `${imgUrl}?v=${Date.now()}`;

      const buyBtnHtml = isOutOfStock
        ? `<button class="btn btn-secondary product-buy-btn" disabled style="opacity: 0.5; cursor: not-allowed; width: 100%;">OUT OF STOCK</button>`
        : `<button class="btn btn-primary product-buy-btn" data-product-id="${p.id}" data-product-name="${p.name}" data-product-price="${p.price}" data-product-image="${srcUrl}">BUY NOW</button>`;

      card.innerHTML = `
        <div class="product-img-wrapper">
          <img class="product-img" src="${srcUrl}" alt="${p.name}" loading="eager">
          ${badgeHtml}
          ${discountBadgeHtml}
          ${stockBadgeHtml}
        </div>
        <div class="product-info">
          <span class="product-cat-label">${p.category.toUpperCase()}</span>
          <h3 class="product-name">${p.name}</h3>
          ${priceHtml}
          <div class="product-actions">
            ${buyBtnHtml}
            <button class="btn btn-outline-orange product-enquire-btn" data-product-name="${p.name}">ENQUIRE</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // Bind buy now click handler to open WhatsApp in a new tab
    container.querySelectorAll(".product-buy-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        const prodName = this.getAttribute("data-product-name");
        const waText = encodeURIComponent(`Hello Renegades Sports Arena, I want to buy: ${prodName}. Please share payment and delivery details.`);
        const waLink = `https://wa.me/919731134665?text=${waText}`;
        window.open(waLink, '_blank');
      });
    });

    // Bind enquire button click handler to open WhatsApp in a new tab
    container.querySelectorAll(".product-enquire-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        const prodName = this.getAttribute("data-product-name");
        const waText = encodeURIComponent(`Hello Renegades Sports Arena, I have an enquiry regarding: ${prodName}. Please provide more information.`);
        const waLink = `https://wa.me/919731134665?text=${waText}`;
        window.open(waLink, '_blank');
      });
    });
  }

  // Initial render
  renderProducts("all");

  // Tab click listeners
  if (filterWrapper) {
    filterWrapper.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-shop-filter]");
      if (!btn) return;

      filterWrapper.querySelectorAll("[data-shop-filter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const catId = btn.getAttribute("data-shop-filter");
      renderProducts(catId);
    });
  }
}

// ==========================================================================
// 7d. INTERACTIVE KIT BUILDER
// ==========================================================================
function initKitBuilder(products) {
  const batSelect = document.getElementById("select-bat");
  const padsSelect = document.getElementById("select-pads");
  const glovesSelect = document.getElementById("select-gloves");
  const protectionSelect = document.getElementById("select-protection");
  const bagSelect = document.getElementById("select-bag");

  const originalTotalEl = document.getElementById("kit-original-total");
  const discountEl = document.getElementById("kit-discount");
  const finalTotalEl = document.getElementById("kit-final-total");
  const buyBtn = document.getElementById("btn-buy-custom-kit");

  if (!batSelect || !padsSelect || !glovesSelect || !protectionSelect || !bagSelect) return;

  // Populate Dropdowns Dynamically from configuration
  function populateSelect(selectEl, category, label) {
    if (!selectEl) return;
    selectEl.innerHTML = "";

    // Filter matching products
    const filtered = products.filter(p => p.category === category);
    filtered.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.setAttribute("data-orig", p.originalPrice || p.price);
      opt.setAttribute("data-disc", p.price);
      opt.textContent = `${p.name} (₹${p.price.toLocaleString('en-IN')})`;
      selectEl.appendChild(opt);
    });

    // Add "None" option
    const noneOpt = document.createElement("option");
    noneOpt.value = "none";
    noneOpt.setAttribute("data-orig", "0");
    noneOpt.setAttribute("data-disc", "0");
    noneOpt.textContent = `No ${label} (-)`;
    selectEl.appendChild(noneOpt);
  }

  populateSelect(batSelect, "bats", "Bat");
  populateSelect(padsSelect, "pads", "Pads");
  populateSelect(glovesSelect, "gloves", "Gloves");
  populateSelect(protectionSelect, "protection", "Thigh Guard");
  populateSelect(bagSelect, "bags", "Kit Bag");

  function calculateKit() {
    let originalSubtotal = 0;
    let finalSubtotal = 0;
    let selectedItems = [];

    const selects = [
      { element: batSelect, label: "Bat" },
      { element: padsSelect, label: "Pads" },
      { element: glovesSelect, label: "Gloves" },
      { element: protectionSelect, label: "Thigh Guard" },
      { element: bagSelect, label: "Kit Bag" }
    ];

    selects.forEach(sel => {
      const option = sel.element.options[sel.element.selectedIndex];
      if (option && option.value !== "none") {
        const origVal = parseFloat(option.getAttribute("data-orig") || "0");
        const discVal = parseFloat(option.getAttribute("data-disc") || "0");
        originalSubtotal += origVal;
        finalSubtotal += discVal;

        selectedItems.push(`${sel.label}: ${option.text.split(" (")[0]}`);
      }
    });

    const totalSavings = originalSubtotal - finalSubtotal;

    if (originalTotalEl) originalTotalEl.textContent = `₹${originalSubtotal.toLocaleString('en-IN')}`;
    if (discountEl) discountEl.textContent = `₹${totalSavings.toLocaleString('en-IN')}`;
    if (finalTotalEl) finalTotalEl.textContent = `₹${finalSubtotal.toLocaleString('en-IN')}`;

    if (buyBtn) {
      if (selectedItems.length === 0) {
        buyBtn.href = "#";
        buyBtn.textContent = "SELECT ITEMS TO ENQUIRE";
        buyBtn.style.pointerEvents = "none";
        buyBtn.style.opacity = "0.5";
      } else {
        buyBtn.style.pointerEvents = "auto";
        buyBtn.style.opacity = "1";
        buyBtn.textContent = "ENQUIRE CUSTOM KIT";
        const waText = encodeURIComponent(`Hello Renegades Sports Arena, I would like to order a Custom Kit containing:\n- ${selectedItems.join("\n- ")}\n\nOriginal Price: ₹${originalSubtotal.toLocaleString('en-IN')}\nFinal Price: ₹${finalSubtotal.toLocaleString('en-IN')}\nSavings: ₹${totalSavings.toLocaleString('en-IN')}`);
        buyBtn.href = `https://wa.me/919731134665?text=${waText}`;
      }
    }
  }

  [batSelect, padsSelect, glovesSelect, protectionSelect, bagSelect].forEach(select => {
    select.addEventListener("change", calculateKit);
  });

  // Run initial calculation
  calculateKit();
}

// ==========================================================================
// 7c. VISION & MISSION
// ==========================================================================
function initVisionMission(data) {
  const visionEl = document.getElementById("visionText");
  const missionEl = document.getElementById("missionText");
  if (data) {
    if (visionEl) visionEl.textContent = data.vision;
    if (missionEl) missionEl.textContent = data.mission;
  }
}

// ==========================================================================
// 8. COACHING TEAM
// ==========================================================================
function initCoaches(data) {

  console.count("initCoaches");
  console.log("INIT COACHES CALLED");

  const container = document.getElementById("coachesGrid");
  if (!container) return;

  container.innerHTML = "";
  const list = data?.list || [];
  if (list.length === 0) {
    container.innerHTML = `
      <div class="premium-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: var(--bg-secondary); border: 1px dashed var(--glass-border); border-radius: 8px;">
        <p style="color: var(--text-secondary);">No coaches listed yet. Check back soon.</p>
      </div>
    `;
    return;
  }

  list.forEach((c, idx) => {
    const card = document.createElement("div");
    card.className = `coach-card glass-card reveal-element glow-violet delay-${(idx % 3) + 1}`;
    if (list.length === 1) {
      card.classList.add("coach-card-featured");
    }

    // Build social links
    let socialsHTML = "";
    if (c.instagram) {
      socialsHTML += `
        <a href="${c.instagram}" class="coach-social-btn" target="_blank" rel="noopener" aria-label="${c.name} Instagram">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
      `;
    }
    if (c.twitter) {
      socialsHTML += `
        <a href="${c.twitter}" class="coach-social-btn" target="_blank" rel="noopener" aria-label="${c.name} Twitter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
          </svg>
        </a>
      `;
    }

    card.innerHTML = `
      <div class="coach-img-container" style="cursor: zoom-in;">
        <img class="coach-img" src="${c.image || 'assets/images/logo.png'}" alt="${c.name}" loading="lazy">
        <div class="coach-zoom-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <span>Click to Zoom Poster</span>
        </div>
        <div class="coach-socials-overlay">
          ${socialsHTML}
        </div>
      </div>
      <div class="coach-details">
        <span class="coach-exp">${c.experience || 'Professional Coach'}</span>
        <h3>${c.name}</h3>
        <span class="coach-desig">${c.designation || 'Instructor'}</span>
        <div class="coach-spec-box">
          <strong>Specialization & Focus:</strong>
          ${c.specialization || 'All-round coaching'}
          ${c.achievements ? `
          <div style="margin-top:0.5rem; font-size:0.75rem; border-top:1px dashed var(--glass-border); padding-top:0.5rem;">
            <strong>Key Achievement:</strong> ${c.achievements}
          </div>
          ` : ''}
        </div>
      </div>
    `;

    // Zoom click handler
    const imgContainer = card.querySelector(".coach-img-container");
    imgContainer.addEventListener("click", (e) => {
      if (e.target.closest(".coach-social-btn")) return;
      if (window.openGenericLightbox) {
        window.openGenericLightbox(c.image || 'assets/images/logo.png', `${c.name} - ${c.designation || 'Instructor'}`);
      }
    });

    container.appendChild(card);
    if (window.revealObserver) {
      window.revealObserver.observe(card);
    }
  });
}

// ==========================================================================
// 9. FACILITIES
// ==========================================================================
function initFacilities(data) {
  const container = document.getElementById("facilitiesGrid");
  if (!container) return;

  container.innerHTML = "";
  data.list.forEach((f) => {
    const card = document.createElement("div");
    card.className = "facility-card reveal-element";
    card.innerHTML = `
      <img class="facility-img" src="${f.image}" alt="${f.title}" loading="lazy">
      <div class="facility-overlay">
        <h3>${f.title}</h3>
        <p>${f.description}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================================================
// 10. GALLERY & LIGHTBOX
// ==========================================================================
function initGallery(data) {
  const container = document.getElementById("galleryGrid");
  if (!container) return;

  // Render Tabs dynamically from config albums list
  const filterWrapper = document.getElementById("galleryFilterControls");
  if (filterWrapper) {
    const categories = ["all", ...(data.albums || ["training", "matches", "events", "players", "achievements"])];
    filterWrapper.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat === "all" ? "active" : ""}" data-gallery-filter="${cat}">
        ${cat}
      </button>
    `).join("");
  }

  // Magnify SVG
  const magnifyIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

  let activeList = [];

  function renderGallery(category = "all") {
    container.innerHTML = "";
    activeList = category === "all"
      ? data.list
      : data.list.filter(item => item.category === category);

    activeList.forEach((item, index) => {
      const cell = document.createElement("div");
      cell.className = `gallery-item reveal-element revealed`;
      cell.setAttribute("data-index", index);

      if (item.type === "video") {
        cell.innerHTML = `
          <div class="gallery-media-wrapper video-wrapper">
            <video class="gallery-media" src="${item.url}" muted loop playsinline></video>
            <div class="media-play-icon">▶</div>
          </div>
          <div class="gallery-hover">
            <div class="gallery-icon-magnify">${magnifyIcon}</div>
            <h4>${item.title}</h4>
          </div>
        `;
        cell.addEventListener("mouseenter", () => {
          const video = cell.querySelector("video");
          if (video) video.play().catch(e => { });
        });
        cell.addEventListener("mouseleave", () => {
          const video = cell.querySelector("video");
          if (video) video.pause();
        });
      } else if (item.type === "reel") {
        cell.innerHTML = `
          <div class="gallery-media-wrapper reel-wrapper" style="background: linear-gradient(135deg, #FF6B00 0%, #0A0A0A 100%); display: flex; align-items: center; justify-content: center; height: 100%;">
            <div style="text-align: center; padding: 2rem; z-index: 1;">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" style="color: white; margin-bottom: 0.5rem;"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              <div style="font-weight: 700; font-size: 0.9rem; color: white;">Instagram Reel</div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.8); margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${item.title}</div>
            </div>
          </div>
          <div class="gallery-hover">
            <div class="gallery-icon-magnify">${magnifyIcon}</div>
            <h4>${item.title}</h4>
          </div>
        `;
      } else {
        cell.innerHTML = `
          <div class="gallery-media-wrapper image-wrapper">
            <img class="gallery-media" src="${item.url}" alt="${item.title}" loading="lazy">
          </div>
          <div class="gallery-hover">
            <div class="gallery-icon-magnify">${magnifyIcon}</div>
            <h4>${item.title}</h4>
          </div>
        `;
      }

      container.appendChild(cell);
    });
  }

  renderGallery("all");

  // Filters Click Handler
  if (filterWrapper) {
    filterWrapper.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-gallery-filter]");
      if (!btn) return;

      filterWrapper.querySelectorAll("[data-gallery-filter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const cat = btn.getAttribute("data-gallery-filter");
      renderGallery(cat);
    });
  }

  // Lightbox Implementation
  const lightbox = document.getElementById("lightbox");
  const lightboxMediaContainer = document.getElementById("lightboxMediaContainer");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  let currentIdx = 0;

  function openLightbox(index) {
    currentIdx = parseInt(index);
    updateLightboxContent();
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden"; // Disable background scrolling
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "auto";
    // Clean up content to stop autoplay/sounds
    if (lightboxMediaContainer) {
      lightboxMediaContainer.innerHTML = "";
    }
  }

  function getInstagramEmbedUrl(url) {
    if (url.includes("instagram.com")) {
      let cleanUrl = url.split("?")[0];
      if (!cleanUrl.endsWith("/")) {
        cleanUrl += "/";
      }
      return cleanUrl + "embed/";
    }
    return url;
  }

  function updateLightboxContent() {
    const item = activeList[currentIdx];
    if (!item || !lightboxMediaContainer) return;

    lightboxMediaContainer.innerHTML = "";
    if (item.type === "video") {
      lightboxMediaContainer.innerHTML = `<video class="lightbox-video" src="${item.url}" controls autoplay playsinline style="max-height: 70vh; max-width: 100%;"></video>`;
    } else if (item.type === "reel") {
      lightboxMediaContainer.innerHTML = `<iframe class="lightbox-iframe" src="${getInstagramEmbedUrl(item.url)}" width="320" height="480" frameborder="0" scrolling="no" allowtransparency="true" allow="encrypted-media" style="max-height: 70vh; max-width: 100%; border: none;"></iframe>`;
    } else {
      lightboxMediaContainer.innerHTML = `<img class="lightbox-img" id="lightboxImg" src="${item.url}" alt="${item.title}" style="max-height: 70vh; max-width: 100%; object-fit: contain;">`;
    }

    lightboxTitle.textContent = item.title;
  }

  function prevImage() {
    currentIdx = (currentIdx - 1 + activeList.length) % activeList.length;
    updateLightboxContent();
  }

  function nextImage() {
    currentIdx = (currentIdx + 1) % activeList.length;
    updateLightboxContent();
  }

  container.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    openLightbox(item.getAttribute("data-index"));
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", prevImage);
  if (lightboxNext) lightboxNext.addEventListener("click", nextImage);

  // Close lightbox on clicking backdrop
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!lightbox || !lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "ArrowRight") nextImage();
  });
}

// ==========================================================================
// 11. GOOGLE REVIEWS CAROUSEL
// ==========================================================================
function initReviews(data) {
  const track = document.getElementById("reviewsTrack");
  const indicatorContainer = document.getElementById("reviewsIndicators");
  if (!track || !indicatorContainer) return;

  track.innerHTML = "";
  indicatorContainer.innerHTML = "";

  data.list.forEach((rev, idx) => {
    // Stars HTML generator
    let starsHtml = "";
    for (let i = 0; i < 5; i++) {
      starsHtml += i < rev.rating ? "★" : "☆";
    }

    const slide = document.createElement("div");
    slide.className = "review-slide";
    slide.innerHTML = `
      <div class="review-card">
        <div class="review-stars">${starsHtml}</div>
        <p class="review-text">"${rev.text}"</p>
        <div class="review-author-info">
          <div>
            <div class="review-author-name">${rev.name}</div>
            <div class="review-author-relation">${rev.relation}</div>
          </div>
          <div class="review-date">${rev.date}</div>
        </div>
      </div>
    `;
    track.appendChild(slide);

    // Indicator Dot
    const dot = document.createElement("div");
    dot.className = `indicator ${idx === 0 ? "active" : ""}`;
    dot.setAttribute("data-slide-to", idx);
    indicatorContainer.appendChild(dot);
  });

  // Carousel Mechanics
  let currentIndex = 0;
  const slides = track.children;
  const dots = indicatorContainer.children;
  let autoplayInterval;

  function goToSlide(index) {
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Update dots active class
    Array.from(dots).forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentIndex);
    });
  }

  function startAutoplay() {
    autoplayInterval = setInterval(() => {
      let nextIdx = (currentIndex + 1) % slides.length;
      goToSlide(nextIdx);
    }, 6000);
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  indicatorContainer.addEventListener("click", (e) => {
    const dot = e.target.closest(".indicator");
    if (!dot) return;
    const targetIdx = parseInt(dot.getAttribute("data-slide-to"));
    stopAutoplay();
    goToSlide(targetIdx);
    startAutoplay();
  });

  // Handle Swipe/Drag events on Carousel
  let startX = 0;
  let endX = 0;

  track.addEventListener("touchstart", (e) => {
    stopAutoplay();
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener("touchend", (e) => {
    endX = e.changedTouches[0].clientX;
    handleGesture();
    startAutoplay();
  }, { passive: true });

  function handleGesture() {
    const diff = startX - endX;
    if (diff > 50) {
      // swipe left (next)
      goToSlide((currentIndex + 1) % slides.length);
    } else if (diff < -50) {
      // swipe right (prev)
      goToSlide((currentIndex - 1 + slides.length) % slides.length);
    }
  }

  // Start automation
  if (slides.length > 1) {
    startAutoplay();
  }
}

// ==========================================================================
// 12. STATS/ACHIEVEMENTS COUNTERS
// ==========================================================================
function initAchievements(data) {
  const container = document.getElementById("statsGrid");
  if (!container) return;

  container.innerHTML = "";
  data.list.forEach((item) => {
    const col = document.createElement("div");
    col.className = "stat-item reveal-element";
    col.innerHTML = `
      <div class="stat-number" data-target="${item.count}" data-suffix="${item.suffix || ''}">0</div>
      <div class="stat-label">${item.label}</div>
    `;
    container.appendChild(col);
  });

  // IntersectionObserver to animate numbers
  const numberElems = container.querySelectorAll(".stat-number");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  numberElems.forEach(el => observer.observe(el));

  function animateCounter(element) {
    const target = parseFloat(element.getAttribute("data-target"));
    const suffix = element.getAttribute("data-suffix") || "";
    const duration = 2000; // 2 seconds
    const start = 0;
    const startTime = performance.now();

    // Check if it represents the rating (e.g. 5) to include suffix/format
    const parent = element.parentElement;
    const isRating = parent.querySelector(".stat-label").textContent.toLowerCase().includes("rating");

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutQuad)
      const ease = progress * (2 - progress);
      const currentVal = start + ease * (target - start);

      if (isRating) {
        element.innerHTML = `${currentVal.toFixed(1)} <span style="font-size: 2.5rem; color: var(--accent-primary);">★</span>`;
      } else {
        element.innerHTML = `${Math.floor(currentVal)}${suffix}`;
      }

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        if (isRating) {
          element.innerHTML = `${target.toFixed(1)} <span style="font-size: 2.5rem; color: var(--accent-primary);">★</span>`;
        } else {
          element.innerHTML = `${target}${suffix}`;
        }
      }
    }

    requestAnimationFrame(updateCounter);
  }
}

// ==========================================================================
// 13. CONTACT FORM
// ==========================================================================
function initContactForm(generalData) {
  const form = document.getElementById("academyContactForm");
  const mapContainer = document.getElementById("mapContainer");
  const successBox = document.getElementById("formSuccessMessage");

  // Toggle buttons
  const toggleBookNewBtn = document.getElementById("toggleBookNewBtn");
  const toggleManageBtn = document.getElementById("toggleManageBtn");
  const manageBookingPanel = document.getElementById("manageBookingPanel");

  // Load Google Map Embed Link
  if (mapContainer && generalData.googleMapsEmbed) {
    mapContainer.innerHTML = `<iframe src="${generalData.googleMapsEmbed}" allowfullscreen="" loading="lazy" title="Academy Location Map"></iframe>`;
  }

  if (toggleBookNewBtn && toggleManageBtn && form && manageBookingPanel) {
    toggleBookNewBtn.addEventListener("click", () => {
      toggleBookNewBtn.classList.add("active");
      toggleManageBtn.classList.remove("active");
      form.style.display = "block";
      manageBookingPanel.style.display = "none";
    });

    toggleManageBtn.addEventListener("click", () => {
      toggleManageBtn.classList.add("active");
      toggleBookNewBtn.classList.remove("active");
      form.style.display = "none";
      manageBookingPanel.style.display = "block";
    });
  }

  // Set minimum date to today
  const dateInput = document.getElementById("formDate");
  if (dateInput) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD format in India timezone
    dateInput.setAttribute("min", today);
  }

  // Age input listener to show/hide parent name
  const ageInput = document.getElementById("formAge");
  const parentNameGroup = document.getElementById("parentNameGroup");
  if (ageInput && parentNameGroup) {
    ageInput.addEventListener("input", () => {
      const age = parseInt(ageInput.value) || 0;
      if (age > 0 && age < 18) {
        parentNameGroup.style.display = "block";
      } else {
        parentNameGroup.style.display = "none";
        document.getElementById("formParentName").value = "";
      }
    });
  }

  // Date selection listener to fetch slots occupancy
  const slotsSelectionGroup = document.getElementById("slotsSelectionGroup");
  if (dateInput && slotsSelectionGroup) {
    dateInput.addEventListener("change", async () => {
      const selectedDate = dateInput.value;
      if (!selectedDate) {
        slotsSelectionGroup.style.display = "none";
        return;
      }
      slotsSelectionGroup.style.display = "block";

      const occupancies = await fetchSlotOccupancy(selectedDate);
      const hiddenInput = document.getElementById("selectedSlot");

      const morningGrid = document.getElementById("morningSlotsGrid");
      const eveningGrid = document.getElementById("eveningSlotsGrid");

      updateSlotsGrid(morningGrid, occupancies, hiddenInput);
      updateSlotsGrid(eveningGrid, occupancies, hiddenInput);
    });
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("formName").value.trim();
    const age = parseInt(document.getElementById("formAge").value) || 0;
    const phone = document.getElementById("formPhone").value.trim();
    const email = document.getElementById("formEmail").value.trim();
    const skillLevel = document.getElementById("formSkillLevel").value;
    const bookingDate = document.getElementById("formDate").value;
    const bookingSlot = document.getElementById("selectedSlot").value;
    const message = document.getElementById("formMessage").value.trim();
    const parentName = document.getElementById("formParentName")?.value.trim() || "";

    if (!name || !age || !phone || !email || !skillLevel || !bookingDate || !bookingSlot) {
      alert("Please fill in all mandatory fields and select an available time slot.");
      return;
    }

    if (age < 18 && !parentName) {
      alert("Parent Name is mandatory for students under 18 years old.");
      return;
    }

    // Verify slot is still available right before booking
    const occupancies = await fetchSlotOccupancy(bookingDate);
    if ((occupancies[bookingSlot] || 0) >= 5) {
      alert("We are sorry, this slot has just filled up. Please select another slot.");
      return;
    }

    const submitBtn = document.getElementById("formTrialBtn");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Booking your session...";

    try {
      let bookingId;
      const client = window.supabaseClient;
      if (window.isMockSession || !client) {
        const db = JSON.parse(localStorage.getItem("rsa_db")) || { trial_bookings: [] };
        if (!db.trial_bookings) db.trial_bookings = [];
        const newBooking = {
          id: `book-${Date.now()}`,
          name,
          age,
          parent_name: parentName || null,
          phone,
          email,
          skill_level: skillLevel,
          booking_date: bookingDate,
          booking_slot: bookingSlot,
          message: message || "No details provided.",
          status: "pending",
          created_at: new Date().toISOString()
        };
        db.trial_bookings.push(newBooking);
        localStorage.setItem("rsa_db", JSON.stringify(db));
        bookingId = newBooking.id;
      } else {
        const sessionId = window.getSessionId ? window.getSessionId() : "anon-session";
        const { data, error } =
          await client.functions.invoke(
            "create_trial_booking",
            {
              body: {
                name: name,
                age: age,
                parent_name: parentName || null,
                phone: phone,
                email: email,
                skill_level: skillLevel,
                message: message || "No details provided.",
                booking_date: bookingDate,
                booking_slot: bookingSlot,
                session_id: sessionId
              }
            }
          );

        if (error) throw error;
        if (data) {
          bookingId = data.id;
        }
      }

      // Write audit log (only in mock session since RPC handles it in DB)
      if ((window.isMockSession || !client) && window.writeAuditLog && bookingId) {
        await window.writeAuditLog(bookingId, 'create', 'user', {
          booking_date: bookingDate,
          booking_slot: bookingSlot
        });
      }

      // Release lock (only in mock session since RPC handles it in DB)
      if ((window.isMockSession || !client) && window.releaseSlotLock) {
        await window.releaseSlotLock();
      }

      // Dispatch booking notification
      if (window.NotificationDispatcher) {
        await window.NotificationDispatcher.dispatch({
          userId: null,
          type: 'trial_confirmation',
          title: 'New Trial Booking Request',
          message: `${name} has requested a trial session for ${bookingDate} at ${bookingSlot}.`,
          channels: ['push', 'email'],
          profileDetails: {
            name: name,
            phone: phone,
            email: email
          },
          bookingDetails: {
            date: bookingDate,
            slot: bookingSlot,
            adminEmail: generalData.email || 'renegadessportsarena@gmail.com'
          }
        });
      }

      //// EMAIL NOTIFICATIONS
      let emailSucceeded = false;
      try {
        //// TRIAL BOOKING FLOW
        const emailDetails = {
          name: name,
          age: age,
          parentName: parentName || "N/A",
          phone: phone,
          email: email,
          skillLevel: skillLevel,
          date: bookingDate,
          slot: bookingSlot,
          message: message || "No details provided.",
          adminEmail: generalData.email || 'renegadessportsarena@gmail.com',
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        console.log("[Booking Flow] Triggering operations for confirmation and admin alerts...");

        //// PLAYER CONFIRMATION
        // Sends confirmation email to the player (via sendTrialBookingEmails)

        //// ADMIN NOTIFICATION
        // Sends notification email to the admin (via sendTrialBookingEmails)

        const emailResult = await window.sendTrialBookingEmails(emailDetails);
        emailSucceeded = emailResult.allSuccess;
      } catch (emailErr) {
        console.error("Email notification flow failed:", emailErr);
        emailSucceeded = false;
      }

      submitBtn.disabled = false;
      submitBtn.textContent = originalText;

      // Reset form
      form.reset();
      slotsSelectionGroup.style.display = "none";
      if (parentNameGroup) parentNameGroup.style.display = "none";

      // Display Success Modal or UI with WhatsApp confirmation CTA
      if (successBox) {
        const waText = encodeURIComponent(`Hello Renegades Sports Arena! I have submitted a Free Trial Booking via your website.

Details:
Name: ${name}
Age: ${age}
Parent Name: ${parentName || 'N/A'}
Phone: ${phone}
Email: ${email}
Skill Level: ${skillLevel}
Date: ${bookingDate}
Slot: ${bookingSlot}

Please confirm my spot!`);
        const waLink = `https://wa.me/${generalData.whatsappNumber || '919731134665'}?text=${waText}`;

        const emailStatusText = emailSucceeded
          ? "Trial booked successfully. Confirmation email sent."
          : "Trial booked successfully. Email notification will be retried.";

        successBox.innerHTML = `
          <h3 style="color: var(--accent-primary); margin-bottom: 0.5rem; font-size:1.2rem;">TRIAL BOOKING REQUESTED SUCCESSFULLY!</h3>
          <p style="color: #fff; margin-bottom: 0.75rem; font-size: 0.9rem;">Your trial request for <strong>${bookingDate}</strong> at <strong>${bookingSlot}</strong> is now registered. ${emailStatusText}</p>
          <p style="color: #cbd5e1; margin-bottom: 1.25rem; font-size: 0.85rem;">Please click the button below to confirm instantly via WhatsApp.</p>
          <a href="${waLink}" class="btn btn-primary" target="_blank" rel="noopener" style="padding: 0.8rem 1.5rem; font-size: 0.85rem; width: 100%;">
            CONFIRM ON WHATSAPP NOW
          </a>
        `;
        successBox.style.display = "block";
        successBox.style.borderColor = "var(--accent-primary)";
        successBox.style.backgroundColor = "rgba(255, 107, 0, 0.08)";
        successBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

    } catch (err) {
      console.error("Booking submission error:", err);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      alert("Error submitting booking. Please double check internet connection or contact us on WhatsApp.");
    }
  });

  // Client Management: Find & Reschedule Bookings
  const btnFindBooking = document.getElementById("btnFindBooking");
  const manageEmailPhone = document.getElementById("manageEmailPhone");
  const manageBookingsResult = document.getElementById("manageBookingsResult");
  const manageSuccessBox = document.getElementById("manageSuccessMessage");

  if (btnFindBooking && manageEmailPhone && manageBookingsResult) {
    btnFindBooking.addEventListener("click", async () => {
      const searchVal = manageEmailPhone.value.trim();
      if (!searchVal) {
        alert("Please enter your email address or phone number.");
        return;
      }

      btnFindBooking.disabled = true;
      btnFindBooking.textContent = "FINDING...";
      manageBookingsResult.innerHTML = "";

      try {
        const client = window.supabaseClient;
        let data;
        if (window.isMockSession || !client) {
          const db = JSON.parse(localStorage.getItem("rsa_db")) || { trial_bookings: [] };
          data = (db.trial_bookings || []).filter(b =>
            (b.email && b.email.toLowerCase().includes(searchVal.toLowerCase())) ||
            (b.phone && b.phone.includes(searchVal))
          ).sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));
        } else {
          const { data: dbData, error } = await client
            .from("trial_bookings")
            .select("*")
            .or(`email.ilike.%${searchVal}%,phone.ilike.%${searchVal}%`)
            .order("booking_date", { ascending: false });

          if (error) throw error;
          data = dbData;
        }

        btnFindBooking.disabled = false;
        btnFindBooking.textContent = "FIND MY BOOKING";

        if (!data || data.length === 0) {
          manageBookingsResult.innerHTML = `<p style="text-align: center; color: var(--text-secondary); font-size: 0.9rem; padding: 1.5rem;">No trial bookings found for "${searchVal}".</p>`;
          return;
        }

        renderClientBookings(data, manageBookingsResult);
      } catch (err) {
        console.error("Find bookings error:", err);
        btnFindBooking.disabled = false;
        btnFindBooking.textContent = "FIND MY BOOKING";
        alert("Error retrieving bookings. Please try again.");
      }
    });
  }
}

// Client-side occupancies helper
async function fetchSlotOccupancy(dateStr) {
  const counts = { "6 AM": 0, "7 AM": 0, "8 AM": 0, "4 PM": 0, "5 PM": 0, "6 PM": 0, "7 PM": 0 };
  const client = window.supabaseClient;
  const sessionId = window.getSessionId ? window.getSessionId() : "anon";

  if (window.isMockSession || !client) {
    const db = JSON.parse(localStorage.getItem("rsa_db")) || { trial_bookings: [], booking_locks: [] };
    const bookings = db.trial_bookings.filter(b => b.booking_date === dateStr && !['rejected', 'cancelled'].includes(b.status));
    bookings.forEach(b => {
      if (counts[b.booking_slot] !== undefined) counts[b.booking_slot]++;
    });
    const locks = (db.booking_locks || []).filter(l => l.booking_date === dateStr && new Date(l.expires_at) > new Date() && l.session_id !== sessionId);
    locks.forEach(l => {
      if (counts[l.booking_slot] !== undefined) counts[l.booking_slot]++;
    });
    return counts;
  }

  try {
    const { data: bookings, error: bErr } = await client
      .from("trial_bookings")
      .select("booking_slot")
      .eq("booking_date", dateStr)
      .not("status", "in", '("rejected","cancelled")');

    if (bErr) throw bErr;
    if (bookings) {
      bookings.forEach(booking => {
        if (counts[booking.booking_slot] !== undefined) {
          counts[booking.booking_slot]++;
        }
      });
    }

    const { data: locks, error: lErr } = await client
      .from("booking_locks")
      .select("booking_slot")
      .eq("booking_date", dateStr)
      .gt("expires_at", new Date().toISOString())
      .neq("session_id", sessionId);

    if (lErr) throw lErr;
    if (locks) {
      locks.forEach(lock => {
        if (counts[lock.booking_slot] !== undefined) {
          counts[lock.booking_slot]++;
        }
      });
    }
  } catch (err) {
    console.error("Error fetching occupancies:", err);
  }
  return counts;
}

// Client slots builder
function updateSlotsGrid(gridContainer, occupancies, hiddenInput, selectedSlotVal = "") {
  if (!gridContainer) return;
  const buttons = gridContainer.querySelectorAll(".slot-btn");
  buttons.forEach(btn => {
    const slot = btn.getAttribute("data-slot");
    const occ = occupancies[slot] || 0;
    const remaining = 5 - occ;
    const badge = btn.querySelector(".slot-count");

    // Reset state
    btn.classList.remove("disabled", "active");
    if (badge) {
      badge.textContent = `${remaining} left`;
      badge.style.color = "#10B981";
    }

    if (selectedSlotVal === slot || hiddenInput.value === slot) {
      btn.classList.add("active");
    }

    if (occ >= 5) {
      btn.classList.add("disabled");
      if (badge) {
        badge.textContent = "Full";
        badge.style.color = "#EF4444";
      }
    }

    btn.onclick = async (e) => {
      e.preventDefault();
      if (btn.classList.contains("disabled")) return;
      if (btn.classList.contains("active")) return;

      // Deactivate all sibling buttons
      const allBtns = gridContainer.parentElement.parentElement.querySelectorAll(".slot-btn");
      allBtns.forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      hiddenInput.value = slot;

      // Acquire slot lock
      let selectedDate = "";
      const dateInput = gridContainer.closest("form")?.querySelector("input[type='date']") ||
        gridContainer.closest(".reschedule-pane")?.querySelector("input[type='date']") ||
        document.getElementById("formDate");
      if (dateInput) {
        selectedDate = dateInput.value;
      }

      if (selectedDate && window.acquireSlotLock) {
        const locked = await window.acquireSlotLock(selectedDate, slot);
        if (!locked) {
          alert("Could not secure a temporary lock on this slot. It might have just been reserved by another user.");
          btn.classList.remove("active");
          hiddenInput.value = "";
        }
      }
    };
  });
}

// Render Bookings inside self-service manager panel
function renderClientBookings(bookings, container) {
  container.innerHTML = "";
  bookings.forEach(b => {
    const card = document.createElement("div");
    card.className = "booking-item-card reveal-element revealed";

    // Status text formatting
    const statusText = b.status.toUpperCase();

    card.innerHTML = `
      <div class="booking-item-details">
        <h4 style="display:flex; justify-content:space-between; align-items:center;">
          <span>${b.name}</span>
          <span class="badge-status ${b.status}">${statusText}</span>
        </h4>
        <div class="booking-meta-row">
          <div class="booking-meta-item">
            <span>📅</span> <strong>${b.booking_date}</strong>
          </div>
          <div class="booking-meta-item">
            <span>⏰</span> <strong>${b.booking_slot}</strong>
          </div>
          <div class="booking-meta-item">
            <span>🏏</span> ${b.skill_level}
          </div>
        </div>
      </div>
      
      ${b.status !== 'cancelled' && b.status !== 'rejected' ? `
        <div class="booking-item-actions" id="actions-${b.id}">
          <button type="button" class="btn-sm btn-cancel" onclick="cancelBooking('${b.id}')">Cancel Booking</button>
          <button type="button" class="btn-sm btn-reschedule" onclick="showRescheduleForm('${b.id}', '${b.booking_date}', '${b.booking_slot}')">Reschedule</button>
        </div>
        <div class="reschedule-pane" id="pane-${b.id}" style="display: none;">
          <div class="form-group">
            <label class="form-label" style="font-size:0.7rem;">New Date:</label>
            <input type="date" id="date-${b.id}" class="form-control" style="padding: 0.6rem 0.8rem; font-size:0.85rem;">
          </div>
          <div class="form-group" style="margin-bottom:0.5rem;">
            <label class="form-label" style="font-size:0.7rem;">Select Slot:</label>
            
            <div id="slots-container-${b.id}" style="display:none; margin-top: 0.5rem;">
              <div class="slots-grid" id="grid-${b.id}" style="grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));">
                <button type="button" class="slot-btn" style="padding: 0.4rem;" data-slot="6 AM">6:00 AM <span class="slot-count" style="font-size:0.55rem;">-</span></button>
                <button type="button" class="slot-btn" style="padding: 0.4rem;" data-slot="7 AM">7:00 AM <span class="slot-count" style="font-size:0.55rem;">-</span></button>
                <button type="button" class="slot-btn" style="padding: 0.4rem;" data-slot="8 AM">8:00 AM <span class="slot-count" style="font-size:0.55rem;">-</span></button>
                <button type="button" class="slot-btn" style="padding: 0.4rem;" data-slot="4 PM">4:00 PM <span class="slot-count" style="font-size:0.55rem;">-</span></button>
                <button type="button" class="slot-btn" style="padding: 0.4rem;" data-slot="5 PM">5:00 PM <span class="slot-count" style="font-size:0.55rem;">-</span></button>
                <button type="button" class="slot-btn" style="padding: 0.4rem;" data-slot="6 PM">6:00 PM <span class="slot-count" style="font-size:0.55rem;">-</span></button>
                <button type="button" class="slot-btn" style="padding: 0.4rem;" data-slot="7 PM">7:00 PM <span class="slot-count" style="font-size:0.55rem;">-</span></button>
              </div>
            </div>
            <input type="hidden" id="slot-input-${b.id}">
          </div>
          <div style="display:flex; gap:0.75rem;">
            <button type="button" class="btn-sm btn-cancel" style="padding: 0.5rem; flex:1;" onclick="hideRescheduleForm('${b.id}')">Cancel</button>
            <button type="button" class="btn-sm btn-reschedule" style="padding: 0.5rem; flex:1;" onclick="submitReschedule('${b.id}')">Save Changes</button>
          </div>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });
}

// Global window mappings for client-side list callbacks:
window.cancelBooking = async function (id) {
  if (!confirm("Are you sure you want to cancel this trial session?")) return;
  try {
    const client = window.supabaseClient;
    if (window.isMockSession || !client) {
      const db = JSON.parse(localStorage.getItem("rsa_db"));
      if (db && db.trial_bookings) {
        const idx = db.trial_bookings.findIndex(b => b.id === id);
        if (idx !== -1) {
          db.trial_bookings[idx].status = "cancelled";
          localStorage.setItem("rsa_db", JSON.stringify(db));
        }
      }
    } else {
      const { error } = await client
        .from("trial_bookings")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    }

    // Write audit log
    if (window.writeAuditLog) {
      await window.writeAuditLog(id, 'cancel', 'user', { status: 'cancelled' });
    }

    // Refresh search results
    document.getElementById("btnFindBooking").click();

    const successMsg = document.getElementById("manageSuccessMessage");
    if (successMsg) {
      successMsg.textContent = "Your booking has been cancelled successfully.";
      successMsg.style.display = "block";
      successMsg.style.borderColor = "red";
      successMsg.style.color = "red";
      successMsg.style.backgroundColor = "rgba(255, 0, 0, 0.05)";
      setTimeout(() => successMsg.style.display = "none", 5000);
    }
  } catch (err) {
    console.error("Cancel booking error:", err);
    alert("Failed to cancel booking. Please try again.");
  }
};

window.showRescheduleForm = function (id, date, slot) {
  const pane = document.getElementById(`pane-${id}`);
  const actions = document.getElementById(`actions-${id}`);
  const datePicker = document.getElementById(`date-${id}`);
  const slotGrid = document.getElementById(`grid-${id}`);
  const slotInput = document.getElementById(`slot-input-${id}`);
  const container = document.getElementById(`slots-container-${id}`);

  if (!pane || !datePicker || !slotGrid) return;

  // Set date input limit to today onwards
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  datePicker.setAttribute("min", today);
  datePicker.value = date;
  slotInput.value = slot;

  actions.style.display = "none";
  pane.style.display = "block";
  container.style.display = "block";

  const loadOccupancies = async () => {
    const dateVal = datePicker.value;
    if (!dateVal) return;
    const occupancies = await fetchSlotOccupancy(dateVal);
    updateSlotsGrid(slotGrid, occupancies, slotInput, slot);
  };

  loadOccupancies();
  datePicker.addEventListener("change", loadOccupancies);
};

window.hideRescheduleForm = function (id) {
  document.getElementById(`pane-${id}`).style.display = "none";
  document.getElementById(`actions-${id}`).style.display = "flex";
  if (window.releaseSlotLock) window.releaseSlotLock();
};

window.submitReschedule = async function (id) {
  const newDate = document.getElementById(`date-${id}`).value;
  const newSlot = document.getElementById(`slot-input-${id}`).value;

  if (!newDate || !newSlot) {
    alert("Please select a date and an available slot.");
    return;
  }

  // Double check occupancy limits
  const occupancies = await fetchSlotOccupancy(newDate);
  if ((occupancies[newSlot] || 0) >= 5) {
    alert("We are sorry, this slot has just filled up. Please select another slot.");
    return;
  }

  try {
    const client = window.supabaseClient;
    if (window.isMockSession || !client) {
      const db = JSON.parse(localStorage.getItem("rsa_db"));
      if (db && db.trial_bookings) {
        const idx = db.trial_bookings.findIndex(b => b.id === id);
        if (idx !== -1) {
          db.trial_bookings[idx].booking_date = newDate;
          db.trial_bookings[idx].booking_slot = newSlot;
          db.trial_bookings[idx].status = "rescheduled";
          localStorage.setItem("rsa_db", JSON.stringify(db));
        }
      }
    } else {
      const { error } = await client
        .from("trial_bookings")
        .update({
          booking_date: newDate,
          booking_slot: newSlot,
          status: "rescheduled"
        })
        .eq("id", id);

      if (error) throw error;
    }

    // Write audit log
    if (window.writeAuditLog) {
      await window.writeAuditLog(id, 'reschedule', 'user', {
        booking_date: newDate,
        booking_slot: newSlot,
        status: 'rescheduled'
      });
    }

    // Release lock
    if (window.releaseSlotLock) {
      await window.releaseSlotLock();
    }

    // Refresh list
    document.getElementById("btnFindBooking").click();

    const successMsg = document.getElementById("manageSuccessMessage");
    if (successMsg) {
      successMsg.textContent = "Your trial slot has been rescheduled successfully.";
      successMsg.style.display = "block";
      successMsg.style.borderColor = "var(--accent-primary)";
      successMsg.style.color = "var(--accent-primary)";
      successMsg.style.backgroundColor = "rgba(255, 107, 0, 0.05)";
      setTimeout(() => successMsg.style.display = "none", 5000);
    }
  } catch (err) {
    console.error("Reschedule submit error:", err);
    alert("Failed to reschedule. Please try again.");
  }
};

// ==========================================================================
// 14. INTERACTIVE SCROLL & PARALLAX EFFECTS
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

    // Update Nav Links Active State on scroll
    let currentActive = "";
    sections.forEach(sec => {
      const sectionTop = sec.offsetTop;
      const sectionHeight = sec.clientHeight;
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

  // Intersection Observer for scroll reveal animations
  window.revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        // unobserve if we only want animate-once behavior
        window.revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  const elements = document.querySelectorAll(".reveal-element");
  elements.forEach(el => window.revealObserver.observe(el));

  bindScrollLinks();
}

function bindScrollLinks() {
  const scrollLinks = document.querySelectorAll(".scroll-link");
  scrollLinks.forEach(link => {
    link.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId && targetId.startsWith("#") && targetId.length > 1) {
        e.preventDefault();
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          // Remove mobile menu active state
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
}

// ==========================================================================
// 15. MOBILE NAVBAR MECHANICS
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
// 16. LOADER FADEOUT
// ==========================================================================
function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  // Let the progress loader complete, then hide the cover
  window.addEventListener("load", hideLoader);

  // Safeguard fallback: force load if it takes too long
  setTimeout(hideLoader, 2000);

  function hideLoader() {
    if (!loader.classList.contains("loaded")) {
      loader.classList.add("loaded");
    }
  }
}

// ==========================================================================
// 17. GENERIC LIGHTBOX ZOOM EXPOSURE
// ==========================================================================
window.openGenericLightbox = function (src, title) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  const lightboxClose = document.getElementById("lightboxClose");

  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  if (lightboxTitle) lightboxTitle.textContent = title || "";

  // Hide gallery slide buttons for generic single-media view
  if (lightboxPrev) lightboxPrev.style.display = "none";
  if (lightboxNext) lightboxNext.style.display = "none";

  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";

  // Re-enable scroll and restore layout details on close
  const cleanUp = () => {
    if (lightboxPrev) lightboxPrev.style.display = "";
    if (lightboxNext) lightboxNext.style.display = "";
    if (lightboxClose) lightboxClose.removeEventListener("click", cleanUp);
    lightbox.removeEventListener("click", backdropClick);
  };

  const backdropClick = (e) => {
    if (e.target === lightbox) cleanUp();
  };

  if (lightboxClose) lightboxClose.addEventListener("click", cleanUp);
  lightbox.addEventListener("click", backdropClick);
};

// ==========================================================================
// 18. DYNAMIC HALL OF FAME RENDERER
// ==========================================================================
function initHallOfFame(data) {
  const grid = document.getElementById("hallOfFameGrid");
  if (!grid) return;

  grid.innerHTML = "";
  if (!data || data.length === 0) {
    grid.innerHTML = `
      <div class="premium-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 5rem 2rem; background: rgba(18, 18, 18, 0.6); border: 1px dashed var(--glass-border); border-radius: 8px; box-shadow: var(--orange-glow);">
        <div class="empty-state-icon" style="font-size: 4rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 10px var(--accent-primary));">🏆</div>
        <h3 style="font-size: 1.8rem; margin-bottom: 0.75rem; color: #fff; font-family: var(--font-display); font-weight: 800;">No Hall of Fame members yet</h3>
        <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto; line-height: 1.6; font-size: 1.05rem;">Future champions will be celebrated here.</p>
      </div>
    `;
    return;
  }

  data.forEach((player, index) => {
    const card = document.createElement("div");

    // Premium glow class matching badge text
    let glowClass = "glow-violet";
    let badgeClass = "card-badge-violet";
    const badgeText = (player.badge || "").toLowerCase();
    if (badgeText.includes("ksca") || badgeText.includes("division") || badgeText.includes("mvp")) {
      glowClass = "glow-gold";
      badgeClass = "card-badge-gold";
    } else if (badgeText.includes("scholarship") || badgeText.includes("elite")) {
      glowClass = "glow-red";
      badgeClass = "card-badge-red";
    }

    card.className = `sports-card reveal-element ${glowClass} delay-${(index % 3) + 1}`;

    let statsHTML = "";
    if (player.stats && Array.isArray(player.stats)) {
      statsHTML = player.stats.map(stat => `
        <div class="card-stat-box">
          <div class="card-stat-val">${stat.val}</div>
          <div class="card-stat-lbl">${stat.lbl}</div>
        </div>
      `).join("");
    }

    card.innerHTML = `
      <div class="sports-card-glow"></div>
      <div class="sports-card-inner">
        <div class="card-top">
          <span class="card-badge ${badgeClass}">${player.badge || "PROSPECT"}</span>
          ${player.scholarship ? `<span class="card-scholarship">${player.scholarship}</span>` : ""}
        </div>
        <img class="card-player-img" src="${player.image || "https://images.unsplash.com/photo-1540747737956-37872404a82f?auto=format&fit=crop&w=500&q=80"}" alt="${player.name}" style="cursor: zoom-in;" onclick="window.openGenericLightbox('${player.image}', '${player.name} - ${player.role}')">
        <div class="card-info">
          <h3 class="card-name">${player.name}</h3>
          <span class="card-role">${player.role}</span>
        </div>
        <div class="card-stats-grid">
          ${statsHTML}
        </div>
        <div class="card-achievement">${player.achievement || "Rising Star"}</div>
      </div>
    `;

    grid.appendChild(card);

    if (window.revealObserver) {
      window.revealObserver.observe(card);
    }
  });
}


function initMagneticButtons() {
  const btns = document.querySelectorAll(".btn, .btn-primary, .btn-secondary, .btn-outline-orange, .slot-btn, .tab-btn, .dash-tab-btn");
  btns.forEach(btn => {
    btn.addEventListener("mousemove", function (e) {
      const position = btn.getBoundingClientRect();
      const x = e.clientX - position.left - position.width / 2;
      const y = e.clientY - position.top - position.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener("mouseout", function () {
      btn.style.transform = "translate(0, 0)";
    });
  });
}

// ==========================================================================
// PRO SHOP CHECKOUT MODAL LOGIC & REPAY SIMULATOR
// ==========================================================================

let selectedProductForCheckout = null;
let appliedCheckoutCoupon = null;

async function validateCouponCode(code, originalPrice, productId) {
  if (window.isMockSession || !window.supabaseClient) {
    if (code.toUpperCase() === 'WELCOME8') {
      return { valid: true, discountType: 'percentage', discountValue: 8, message: "Welcome Coupon Applied! (8% Off)" };
    } else {
      return { valid: false, message: "Invalid coupon code." };
    }
  }

  try {
    const { data, error } = await window.supabaseClient
      .from('coupon_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      return { valid: false, message: "Coupon code not found." };
    }

    if (!data.is_active) {
      return { valid: false, message: "This coupon is no longer active." };
    }

    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      return { valid: false, message: "This coupon has expired." };
    }

    const currentUses = (data.uses_count !== undefined) ? data.uses_count : (data.usage_count || 0);
    if (data.usage_limit !== null && currentUses >= data.usage_limit) {
      return { valid: false, message: "This coupon usage limit has been reached." };
    }

    // Minimum purchase check
    if (data.min_purchase_amount && originalPrice < data.min_purchase_amount) {
      return { valid: false, message: `Minimum purchase of ₹${data.min_purchase_amount} required.` };
    }

    // Product-specific check
    if (data.product_ids && Array.isArray(data.product_ids) && data.product_ids.length > 0) {
      if (!productId || !data.product_ids.includes(productId)) {
        return { valid: false, message: "This coupon is not valid for this product." };
      }
    }

    const discountType = data.discount_type || 'percentage';
    const discountVal = discountType === 'fixed' ? (data.discount_amount || 0) : (data.discount_percent || 0);

    return {
      valid: true,
      discountType: discountType,
      discountValue: discountVal,
      message: discountType === 'fixed'
        ? `Coupon Applied! (₹${discountVal} Off)`
        : `Coupon Applied! (${discountVal}% Off)`
    };
  } catch (err) {
    console.error("Coupon validation error:", err);
    return { valid: false, message: "Error validating coupon. Please try again." };
  }
}

window.openCheckoutModal = function(productId, productName, productPrice, productImg) {
  const modal = document.getElementById("checkoutModal");
  if (!modal) return;

  selectedProductForCheckout = {
    id: productId,
    name: productName,
    price: productPrice,
    image: productImg
  };
  appliedCheckoutCoupon = null;

  document.getElementById("checkoutProductImg").src = productImg;
  document.getElementById("checkoutProductName").textContent = productName;
  document.getElementById("checkoutProductPriceDisplay").textContent = `₹${productPrice.toLocaleString('en-IN')}`;
  
  document.getElementById("checkoutProductId").value = productId;
  document.getElementById("checkoutProductPrice").value = productPrice;
  
  document.getElementById("checkoutSubtotal").textContent = `₹${productPrice.toLocaleString('en-IN')}`;
  document.getElementById("checkoutTotal").textContent = `₹${productPrice.toLocaleString('en-IN')}`;
  
  document.getElementById("checkoutDiscountRow").style.display = "none";
  const msgEl = document.getElementById("checkoutCouponMessage");
  msgEl.style.display = "none";
  msgEl.textContent = "";

  document.getElementById("checkoutName").value = "";
  document.getElementById("checkoutEmail").value = "";
  document.getElementById("checkoutPhone").value = "";
  document.getElementById("checkoutCoupon").value = "";

  document.getElementById("checkoutStep-1").style.display = "block";
  document.getElementById("checkoutStep-2").style.display = "none";
  document.getElementById("checkoutStep-3").style.display = "none";

  modal.style.display = "flex";
};

function initProShopCheckout() {
  const modal = document.getElementById("checkoutModal");
  const closeBtn = document.getElementById("closeCheckoutModal");
  const applyCouponBtn = document.getElementById("btnApplyCheckoutCoupon");
  const checkoutForm = document.getElementById("checkoutForm");
  const backBtn = document.getElementById("btnBackToCheckoutForm");
  const confirmPaymentBtn = document.getElementById("btnSimulateCheckoutPayment");
  const finishBtn = document.getElementById("btnFinishCheckout");

  if (!modal) return;

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  applyCouponBtn.addEventListener("click", async () => {
    const couponInput = document.getElementById("checkoutCoupon");
    const code = couponInput.value.trim().toUpperCase();
    const msgEl = document.getElementById("checkoutCouponMessage");
    
    if (!code) {
      msgEl.textContent = "Please enter a coupon code.";
      msgEl.style.color = "#EF4444";
      msgEl.style.display = "block";
      return;
    }

    applyCouponBtn.disabled = true;
    applyCouponBtn.textContent = "Verifying...";

    const res = await validateCouponCode(code, selectedProductForCheckout.price, selectedProductForCheckout.id);
    
    applyCouponBtn.disabled = false;
    applyCouponBtn.textContent = "Apply";

    if (res.valid) {
      appliedCheckoutCoupon = {
        code: code,
        discountType: res.discountType,
        discountValue: res.discountValue
      };
      
      let discAmt = 0;
      if (res.discountType === 'fixed') {
        discAmt = Math.min(res.discountValue, selectedProductForCheckout.price);
      } else {
        discAmt = Math.round(selectedProductForCheckout.price * (res.discountValue / 100));
      }
      const totalAmt = selectedProductForCheckout.price - discAmt;
      
      document.getElementById("checkoutDiscount").textContent = `₹${discAmt.toLocaleString('en-IN')}`;
      document.getElementById("checkoutDiscountRow").style.display = "flex";
      document.getElementById("checkoutTotal").textContent = `₹${totalAmt.toLocaleString('en-IN')}`;
      
      msgEl.textContent = res.message;
      msgEl.style.color = "#10B981";
      msgEl.style.display = "block";
    } else {
      appliedCheckoutCoupon = null;
      document.getElementById("checkoutDiscountRow").style.display = "none";
      document.getElementById("checkoutTotal").textContent = `₹${selectedProductForCheckout.price.toLocaleString('en-IN')}`;
      
      msgEl.textContent = res.message;
      msgEl.style.color = "#EF4444";
      msgEl.style.display = "block";
    }
  });

  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("checkoutName").value.trim();
    const email = document.getElementById("checkoutEmail").value.trim();
    const phone = document.getElementById("checkoutPhone").value.trim();

    if (!name || !email || !phone) {
      alert("Please fill in all required fields.");
      return;
    }

    const price = selectedProductForCheckout.price;
    let discAmt = 0;
    if (appliedCheckoutCoupon) {
      if (appliedCheckoutCoupon.discountType === 'fixed') {
        discAmt = Math.min(appliedCheckoutCoupon.discountValue, price);
      } else {
        discAmt = Math.round(price * (appliedCheckoutCoupon.discountValue / 100));
      }
    }
    const finalAmount = price - discAmt;
    const orderId = 'RSA-SHOP-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    document.getElementById("checkoutPaymentAmount").textContent = `₹${finalAmount.toLocaleString('en-IN')}`;
    const upiLink = `upi://pay?pa=renegadessportsarena@okaxis&pn=Renegades%20Sports%20Arena&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(orderId)}`;
    
    const qrContainer = document.getElementById("checkoutQrContainer");
    qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}" alt="Scan to Pay">`;

    if (window.supabaseClient && !window.isMockSession) {
      try {
        const { data: paymentData, error: paymentError } = await window.supabaseClient
          .from("payments")
          .insert([{
            razorpay_order_id: 'order_' + Math.random().toString(36).substr(2, 9),
            amount: finalAmount,
            status: 'created',
            payment_type: 'shop_purchase',
            receipt_number: orderId
          }])
          .select()
          .single();

        if (paymentError) throw paymentError;

        selectedProductForCheckout.paymentDbId = paymentData.id;

        await window.supabaseClient.from("payment_logs").insert([{
          payment_id: paymentData.id,
          event: 'order_created',
          payload: { order_id: orderId, name, email, phone, product: selectedProductForCheckout }
        }]);

        await window.supabaseClient.from("shop_orders").insert([{
          total_amount: finalAmount,
          status: 'pending_payment',
          items: [{
            product_id: selectedProductForCheckout.id,
            product_name: selectedProductForCheckout.name,
            price: selectedProductForCheckout.price,
            quantity: 1
          }],
          payment_id: paymentData.id
        }]);

      } catch (err) {
        console.error("Failed to create initial database records:", err);
      }
    }

    document.getElementById("checkoutStep-1").style.display = "none";
    document.getElementById("checkoutStep-2").style.display = "block";
  });

  backBtn.addEventListener("click", () => {
    document.getElementById("checkoutStep-2").style.display = "none";
    document.getElementById("checkoutStep-1").style.display = "block";
  });

  confirmPaymentBtn.addEventListener("click", async () => {
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.textContent = "Processing Mock Payment...";

    const name = document.getElementById("checkoutName").value.trim();
    const email = document.getElementById("checkoutEmail").value.trim();
    const phone = document.getElementById("checkoutPhone").value.trim();
    const price = selectedProductForCheckout.price;
    let discAmt = 0;
    if (appliedCheckoutCoupon) {
      if (appliedCheckoutCoupon.discountType === 'fixed') {
        discAmt = Math.min(appliedCheckoutCoupon.discountValue, price);
      } else {
        discAmt = Math.round(price * (appliedCheckoutCoupon.discountValue / 100));
      }
    }
    const finalAmount = price - discAmt;
    const orderId = 'RSA-SHOP-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    if (window.supabaseClient && !window.isMockSession && selectedProductForCheckout.paymentDbId) {
      try {
        const paymentDbId = selectedProductForCheckout.paymentDbId;
        const razorpayPaymentId = 'pay_' + Math.random().toString(36).substr(2, 9);

        await window.supabaseClient
          .from("payments")
          .update({
            status: 'captured',
            razorpay_payment_id: razorpayPaymentId
          })
          .eq("id", paymentDbId);

        await window.supabaseClient.from("payment_logs").insert([{
          payment_id: paymentDbId,
          event: 'payment_captured',
          payload: { razorpay_payment_id: razorpayPaymentId, transaction_time: new Date().toISOString() }
        }]);

        let profileId = null;
        const { data: profile } = await window.supabaseClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (profile) profileId = profile.id;

        const { data: shopOrderData } = await window.supabaseClient
          .from("shop_orders")
          .update({
            status: 'paid',
            player_id: profileId
          })
          .eq("payment_id", paymentDbId)
          .select()
          .maybeSingle();

        if (appliedCheckoutCoupon) {
          const { data: couponData } = await window.supabaseClient
            .from("coupon_codes")
            .select("id, uses_count")
            .eq("code", appliedCheckoutCoupon.code)
            .maybeSingle();

          if (couponData) {
            const usesColumn = (couponData.uses_count !== undefined) ? "uses_count" : "usage_count";
            const currentCount = couponData.uses_count !== undefined ? couponData.uses_count : (couponData.usage_count || 0);
            
            const updatePayload = {};
            updatePayload[usesColumn] = currentCount + 1;

            await window.supabaseClient
              .from("coupon_codes")
              .update(updatePayload)
              .eq("id", couponData.id);

            await window.supabaseClient
              .from("coupon_usage")
              .insert([{
                coupon_id: couponData.id,
                user_id: profileId,
                applied_to: 'shop',
                reference_id: shopOrderData ? shopOrderData.id : null,
                discount_amount: discAmt
              }]);
          }
        }

      } catch (err) {
        console.error("Database updates on payment confirmation failed:", err);
      }
    }

    document.getElementById("checkoutConfirmOrderId").textContent = orderId;
    document.getElementById("checkoutConfirmProductName").textContent = selectedProductForCheckout.name;
    document.getElementById("checkoutConfirmTotalPaid").textContent = `₹${finalAmount.toLocaleString('en-IN')}`;

    if (window.sendOrderConfirmationEmail) {
      window.sendOrderConfirmationEmail(email, name, orderId, selectedProductForCheckout.name, finalAmount);
    }
    if (window.WhatsAppNotificationService && window.WhatsAppNotificationService.send) {
      window.WhatsAppNotificationService.send(phone, 'shop_order', {
        name: name,
        orderId: orderId,
        productName: selectedProductForCheckout.name,
        amount: finalAmount
      });
    }

    if (typeof confetti === "function") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    confirmPaymentBtn.disabled = false;
    confirmPaymentBtn.textContent = "CONFIRM MOCK PAYMENT";

    document.getElementById("checkoutStep-2").style.display = "none";
    document.getElementById("checkoutStep-3").style.display = "block";
  });

  finishBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Event Delegation for Shop BUY NOW buttons
  const shopGrid = document.getElementById("shopGrid");
  if (shopGrid) {
    shopGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".product-buy-btn");
      if (btn && btn.tagName === "BUTTON") {
        e.preventDefault();
        const pId = btn.getAttribute("data-product-id");
        const pName = btn.getAttribute("data-product-name");
        const pPrice = parseFloat(btn.getAttribute("data-product-price"));
        const pImg = btn.getAttribute("data-product-image");
        window.openCheckoutModal(pId, pName, pPrice, pImg);
      }
    });
  }

  // Intercept Order Full Kit
  const orderBtn = document.querySelector(".btn-order-full-kit");
  if (orderBtn) {
    orderBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const products = window.RENEGADES_CONFIG?.shop?.products || [];
      const bat = products.find(p => p.category === 'bats');
      const pad = products.find(p => p.category === 'pads');
      const glove = products.find(p => p.category === 'gloves');
      const protection = products.find(p => p.category === 'protection');
      const bag = products.find(p => p.category === 'bags');
      
      let priceTotal = 0;
      [bat, pad, glove, protection, bag].forEach(p => {
        if (p) priceTotal += p.price;
      });
      if (priceTotal === 0) priceTotal = 12790;

      window.openCheckoutModal("full-kit", "Renegades Cricket Full Kit Package", priceTotal, "assets/images/logo.png");
    });
  }

  // Intercept Custom Kit Buy Button
  const customKitBtn = document.getElementById("btn-buy-custom-kit");
  if (customKitBtn) {
    customKitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      let finalSubtotal = 0;
      let selectedItems = [];
      
      const selects = [
        { element: document.getElementById("select-bat"), label: "Bat" },
        { element: document.getElementById("select-pads"), label: "Pads" },
        { element: document.getElementById("select-gloves"), label: "Gloves" },
        { element: document.getElementById("select-protection"), label: "Thigh Guard" },
        { element: document.getElementById("select-bag"), label: "Kit Bag" }
      ];

      selects.forEach(sel => {
        if (sel.element) {
          const option = sel.element.options[sel.element.selectedIndex];
          if (option && option.value !== "none") {
            const discVal = parseFloat(option.getAttribute("data-disc") || "0");
            finalSubtotal += discVal;
            selectedItems.push(`${sel.label}: ${option.text.split(" (")[0]}`);
          }
        }
      });

      if (selectedItems.length === 0) return;

      window.openCheckoutModal("custom-kit", `Custom Cricket Kit (${selectedItems.length} items)`, finalSubtotal, "assets/images/logo.png");
    });
  }
}



