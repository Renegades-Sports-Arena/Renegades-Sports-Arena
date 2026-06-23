// Renegades Sports Arena - Admin Portal Logic
// Handles authentication, sidebar tabs, dynamic form rendering for repeaters,
// saving edits to LocalStorage, and downloading the updated config.js file.

window.isAdminPage = true;

document.addEventListener("DOMContentLoaded", () => {
  const config = window.RENEGADES_CONFIG;
  if (!config) {
    console.error("Renegades configuration not found!");
    return;
  }

  // Request browser push notification permissions on load
  if (window.PushNotificationService) {
    window.PushNotificationService.requestPermission();
  }
  if (window.initSupabaseRealtimeSub) {
    window.initSupabaseRealtimeSub();
  }

  // 1. Authentication Check
  checkAuth();

  // 2. Load Form Data
  loadGeneralForm(config.general);
  loadHeroForm(config.hero);
  loadFutureArenaForm(config.futureArena);

  // Lists
  renderWhyUsList(config.whyChooseUs);
  renderClubsList(config.clubs);
  renderProgramsList(config.programs);
  renderShopTab(config.shop);
  renderCoachesList(config.coaches);
  renderFacilitiesList(config.facilities);
  renderGalleryList(config.gallery);
  renderReviewsList(config.reviews);
  renderStatsList(config.achievements);

  // 3. Setup Navigation & Action Event Handlers
  initBookingsManager();
  initAdminNavigation();
  initActions();
  initNotificationsTab();
});

// ==========================================================================
// 1. AUTHENTICATION OPERATIONS
// ==========================================================================
function checkAuth() {
  const loginOverlay = document.getElementById("loginOverlay");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const loginPassInput = document.getElementById("loginPassword");
  const logoutBtn = document.getElementById("logoutBtn");

  const isAuthenticated = sessionStorage.getItem("renegades_admin_logged") === "true";

  if (isAuthenticated) {
    loginOverlay.classList.add("hidden");
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const enteredPassword = loginPassInput.value;

    const submitBtn = loginForm.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.textContent : "Submit";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Authenticating...";
    }

    try {
      const client = window.supabaseClient;
      if (window.isMockSession || !client) {
        // Default Mock Password check
        if (enteredPassword === "renegades_admin") {
          sessionStorage.setItem("renegades_admin_logged", "true");
          loginError.style.display = "none";
          loginOverlay.classList.add("hidden");
        } else {
          throw new Error("Invalid password");
        }
      } else {
        // Real Supabase Auth check
        let authData = null;
        let authError = null;

        try {
          const res = await client.auth.signInWithPassword({
            email: "renegadessportsarena@gmail.com",
            password: enteredPassword
          });
          authData = res.data;
          authError = res.error;
        } catch (signInErr) {
          authError = signInErr;
        }

        // Auto-provision default admin if credentials don't exist
        if ((authError || !authData?.user) && enteredPassword === "Renegades@2026") {
          console.log("Admin login failed. Attempting client-side auto-sync provisioning...");
          try {
            const { data: signUpData, error: signUpError } = await client.auth.signUp({
              email: "renegadessportsarena@gmail.com",
              password: "Renegades@2026"
            });

            if (signUpError) throw signUpError;

            if (signUpData && signUpData.user) {
              authData = signUpData;
              authError = null;

              console.log("Admin Auth user created. Initializing admins table record...");
              const { error: adminInsError } = await client
                .from("admins")
                .insert([{
                  id: signUpData.user.id,
                  email: "renegadessportsarena@gmail.com",
                  role: "super_admin"
                }]);

              if (adminInsError) {
                // If it already exists, update role to super_admin
                await client
                  .from("admins")
                  .update({ role: "super_admin" })
                  .eq("id", signUpData.user.id);
              }
            }
          } catch (syncErr) {
            console.error("Admin auto-sync provisioning failed:", syncErr);
            throw new Error("Admin authentication failed and auto-provisioning could not complete.");
          }
        } else if (authError) {
          throw authError;
        }

        if (authData && authData.user) {
          // Check role from admins table
          let { data: adminRecord, error: adminError } = await client
            .from("admins")
            .select("role")
            .eq("email", authData.user.email)
            .maybeSingle();

          if (adminError) {
            console.error("Admin table check error:", adminError);
          }

          if (!adminRecord) {
            console.log("Admin record not found. Re-attempting admin table record creation...");
            const { data: insData, error: adminInsError } = await client
              .from("admins")
              .insert([{
                id: authData.user.id,
                email: authData.user.email || "renegadessportsarena@gmail.com",
                role: "super_admin"
              }])
              .select()
              .single();

            if (adminInsError) {
              console.error("Failed to auto-provision admin record:", adminInsError);
            } else {
              adminRecord = insData;
            }
          }

          if (adminRecord && adminRecord.role === "super_admin") {
            sessionStorage.setItem("renegades_admin_logged", "true");
            loginError.style.display = "none";
            loginOverlay.classList.add("hidden");
          } else if (enteredPassword === "Renegades@2026") {
            console.log("Auto-provisioning admin record due to default credentials usage...");
            await client.from("admins").upsert({
              id: authData.user.id,
              email: authData.user.email || "renegadessportsarena@gmail.com",
              role: "super_admin"
            });
            sessionStorage.setItem("renegades_admin_logged", "true");
            loginError.style.display = "none";
            loginOverlay.classList.add("hidden");
          } else {
            // Sign out because user is not an admin
            await client.auth.signOut();
            throw new Error("Unauthorized: Access denied. Super Admin privileges required.");
          }
        } else {
          throw new Error("Failed to authenticate user session.");
        }
      }
    } catch (err) {
      console.error("Admin authentication failed:", err);

      // Save error diagnostics to error_logs table if supabase is connected
      if (window.supabaseClient && !window.isMockSession) {
        try {
          await window.supabaseClient.from("error_logs").insert([{
            error_message: err.message || "Admin login authentication failure",
            error_stack: err.stack || null,
            severity: "warning",
            context: { entered_email: "renegadessportsarena@gmail.com" }
          }]);
        } catch (logErr) {
          console.error("Error inserting error log:", logErr);
        }
      }

      loginError.textContent = err.message || "Invalid Password";
      loginError.style.display = "block";
      loginPassInput.value = "";
      loginPassInput.focus();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      sessionStorage.removeItem("renegades_admin_logged");
      const client = window.supabaseClient;
      if (client && !window.isMockSession) {
        try {
          await client.auth.signOut();
        } catch (err) {
          console.error("Error signing out from Supabase:", err);
        }
      }
      window.location.reload();
    });
  }
}

// ==========================================================================
// 2. ADMIN PORTAL TAB NAVIGATION
// ==========================================================================
function initAdminNavigation() {
  const menuItems = document.querySelectorAll(".menu-item");
  const panels = document.querySelectorAll(".tab-panel");
  const tabTitle = document.getElementById("currentTabTitle");

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      // Deactivate all buttons & panels
      menuItems.forEach(i => i.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      // Activate clicked
      item.classList.add("active");
      const targetId = item.getAttribute("data-target-tab");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      // Update Top Bar header
      tabTitle.textContent = item.textContent === "EXPORT CONFIGURATION"
        ? "Export & Download Configuration"
        : `${item.textContent} Settings`;
    });
  });
}

// ==========================================================================
// 3. LOAD STATIC FORMS
// ==========================================================================
function loadGeneralForm(data) {
  document.getElementById("input-general-name").value = data.academyName || "";
  document.getElementById("input-general-tagline").value = data.tagline || "";
  document.getElementById("input-general-phone").value = data.phone || "";
  document.getElementById("input-general-email").value = data.email || "";
  document.getElementById("input-general-whatsapp").value = data.whatsappNumber || "";
  document.getElementById("input-general-address").value = data.address || "";
  document.getElementById("input-general-map").value = data.googleMapsEmbed || "";

  document.getElementById("input-general-instagram").value = data.instagramUrl || "";
  document.getElementById("input-general-facebook").value = data.facebookUrl || "";
  document.getElementById("input-general-youtube").value = data.youtubeUrl || "";
  document.getElementById("input-general-google").value = data.googleBusinessUrl || "";

  // Announcement banner load
  document.getElementById("input-general-announcement-enabled").value = data.announcementEnabled !== false ? "true" : "false";
  document.getElementById("input-general-announcement-text").value = data.announcementText || "";
  document.getElementById("input-general-announcement-bg").value = data.announcementBgColor || "#FF6B00";
  document.getElementById("input-general-announcement-link").value = data.announcementLink || "";
}

function loadHeroForm(data) {
  document.getElementById("input-hero-title").value = data.title || "";
  document.getElementById("input-hero-subheading").value = data.subheading || "";
  document.getElementById("input-hero-tagline").value = data.tagline || "";
  document.getElementById("input-hero-video").value = data.videoUrl || "";
  document.getElementById("input-hero-fallback").value = data.fallbackImageUrl || "";
  document.getElementById("input-hero-primary").value = data.primaryCtaText || "";
  document.getElementById("input-hero-secondary").value = data.secondaryCtaText || "";
  document.getElementById("input-hero-shop-text").value = data.shopCtaText || "";
}

function loadFutureArenaForm(data) {
  if (!data) return;
  document.getElementById("input-arena-badge").value = data.badge || "";
  document.getElementById("input-arena-title").value = data.title || "";
  document.getElementById("input-arena-subtitle").value = data.subtitle || "";
  document.getElementById("input-arena-desc").value = data.description || "";
  document.getElementById("input-arena-image").value = data.image || "";
  document.getElementById("input-arena-features").value = data.features ? data.features.join(", ") : "";
}

// ==========================================================================
// 4. DYNAMIC LIST RENDERERS & ACTIONS
// ==========================================================================

// Why Us Cards
function renderWhyUsList(data) {
  const container = document.getElementById("whyCardsList");
  if (!container) return;

  container.innerHTML = "";
  document.getElementById("input-why-title").value = data.title || "";

  data.cards.forEach((card, index) => {
    const item = document.createElement("div");
    item.className = "list-item-row";
    item.innerHTML = `
      <div class="list-item-header">
        <span class="list-item-index">Module ${index + 1}</span>
      </div>
      <div class="form-grid">
        <div class="form-group" style="max-width: 100px;">
          <label class="form-label">Emoji Icon</label>
          <input type="text" class="form-input text-center card-icon" value="${card.icon}">
        </div>
        <div class="form-group">
          <label class="form-label">Card Title</label>
          <input type="text" class="form-input card-title" value="${card.title}">
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Description</label>
          <textarea class="form-input card-desc">${card.description}</textarea>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}



// Club logos list
function renderClubsList(data) {
  const container = document.getElementById("clubsList");
  if (!container) return;

  container.innerHTML = "";
  document.getElementById("input-clubs-title").value = data.title || "";
  document.getElementById("input-clubs-sub").value = data.subheading || "";
  document.getElementById("input-clubs-disclaimer").value = data.disclaimer || "";

  data.list.forEach((club, index) => {
    const item = document.createElement("div");
    item.className = "list-item-row";
    item.innerHTML = `
      <div class="list-item-header">
        <span class="list-item-index">Club Partner ${index + 1}</span>
        <button type="button" class="btn-remove-item" onclick="removeClubPartner(${index})">Remove Club</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Club Name</label>
          <input type="text" class="form-input club-name" value="${club.name}">
        </div>
        <div class="form-group" style="max-width: 150px;">
          <label class="form-label">Acronym (2-4 chars)</label>
          <input type="text" class="form-input club-acro" value="${club.logoText}" maxlength="4">
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

window.removeClubPartner = function (index) {
  window.RENEGADES_CONFIG.clubs.list.splice(index, 1);
  renderClubsList(window.RENEGADES_CONFIG.clubs);
};

document.getElementById("addClubBtn").addEventListener("click", () => {
  window.RENEGADES_CONFIG.clubs.list.push({
    name: "Associated Club Name",
    logoText: "CLUB"
  });
  renderClubsList(window.RENEGADES_CONFIG.clubs);
  scrollToBottom("clubsList");
});

// Programs List
function renderProgramsList(data) {
  const container = document.getElementById("programsList");
  if (!container) return;

  container.innerHTML = "";
  data.list.forEach((p, index) => {
    const item = document.createElement("div");
    item.className = "list-item-row";
    item.innerHTML = `
      <div class="list-item-header">
        <span class="list-item-index">Program ${index + 1} - ${p.title}</span>
        <button type="button" class="btn-remove-item" onclick="removeProgram(${index})">Delete Program</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Program Category</label>
          <select class="form-input program-cat">
            <option value="junior" ${p.category === "junior" ? "selected" : ""}>Junior / Grassroots</option>
            <option value="elite" ${p.category === "elite" ? "selected" : ""}>Elite Performance</option>
            <option value="specialist" ${p.category === "specialist" ? "selected" : ""}>Specialized & Coaching</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Program Name</label>
          <input type="text" class="form-input program-title" value="${p.title}">
        </div>
        <div class="form-group">
          <label class="form-label">Emoji Badge Icon</label>
          <input type="text" class="form-input program-icon" value="${p.icon}">
        </div>
        <div class="form-group">
          <label class="form-label">Target Age / Group Description</label>
          <input type="text" class="form-input program-age" value="${p.ageGroup}">
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Intro Description</label>
          <textarea class="form-input program-desc">${p.description}</textarea>
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Key Features/Benefits (Comma separated list)</label>
          <input type="text" class="form-input program-benefits" value="${p.benefits.join(", ")}">
          <span class="tip-text">Separate features using commas. Example: Pro nets, Video checks, Radar tracking</span>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

window.removeProgram = function (index) {
  window.RENEGADES_CONFIG.programs.list.splice(index, 1);
  renderProgramsList(window.RENEGADES_CONFIG.programs);
};

document.getElementById("addProgramBtn").addEventListener("click", () => {
  window.RENEGADES_CONFIG.programs.list.push({
    category: "junior",
    title: "New Academy Program",
    ageGroup: "All Age Groups",
    description: "Detailed overview of the newly established program.",
    benefits: ["BCCI certified training", "Flexible schedules", "Weekly assessments"],
    icon: "🏏"
  });
  renderProgramsList(window.RENEGADES_CONFIG.programs);
  scrollToBottom("programsList");
});

// (Players spotlight removed in production)

// Coaching Team List
function renderCoachesList(data) {
  const container = document.getElementById("coachesList");
  if (!container) return;

  container.innerHTML = "";
  data.list.forEach((c, index) => {
    const item = document.createElement("div");
    item.className = "list-item-row";
    item.innerHTML = `
      <div class="list-item-header">
        <span class="list-item-index">Coach ${index + 1} - ${c.name}</span>
        <button type="button" class="btn-remove-item" onclick="removeCoach(${index})">Delete Coach</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Coach Name</label>
          <input type="text" class="form-input coach-name" value="${c.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Designation / Role</label>
          <input type="text" class="form-input coach-desig" value="${c.designation}">
        </div>
        <div class="form-group">
          <label class="form-label">Experience Years</label>
          <input type="text" class="form-input coach-exp" value="${c.experience}">
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Coach Image Link</label>
          <input type="text" class="form-input coach-img" value="${c.image}">
          <input type="file" class="form-input" accept="image/*" onchange="handleCoachFileUpload(this, ${index})" style="margin-top: 0.5rem;">
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Specialization Summary Focus</label>
          <input type="text" class="form-input coach-spec" value="${c.specialization}">
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Key Certifications & Achievements</label>
          <input type="text" class="form-input coach-achievements" value="${c.achievements}">
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

window.handleCoachFileUpload = function (input, index) {
  const file = input.files[0];
  if (!file) return;
  compressImage(file, (base64) => {
    const row = input.closest(".list-item-row");
    const imgInput = row.querySelector(".coach-img");
    if (imgInput) imgInput.value = base64;
    window.RENEGADES_CONFIG.coaches.list[index].image = base64;
  });
};

window.removeCoach = function (index) {
  window.RENEGADES_CONFIG.coaches.list.splice(index, 1);
  renderCoachesList(window.RENEGADES_CONFIG.coaches);
};

document.getElementById("addCoachBtn").addEventListener("click", () => {
  window.RENEGADES_CONFIG.coaches.list.push({
    name: "Coaching Staff Name",
    designation: "Assistant Coach",
    experience: "5+ Years",
    specialization: "Fielding and Agility Coach",
    achievements: "BCCI Level 1 Certified",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=500&q=80",
    instagram: "#",
    twitter: "#"
  });
  renderCoachesList(window.RENEGADES_CONFIG.coaches);
  scrollToBottom("coachesList");
});

// Facilities list
function renderFacilitiesList(data) {
  const container = document.getElementById("facilitiesList");
  if (!container) return;

  container.innerHTML = "";
  data.list.forEach((f, index) => {
    const item = document.createElement("div");
    item.className = "list-item-row";
    item.innerHTML = `
      <div class="list-item-header">
        <span class="list-item-index">Facility ${index + 1} - ${f.title}</span>
        <button type="button" class="btn-remove-item" onclick="removeFacility(${index})">Remove Facility</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Facility Title</label>
          <input type="text" class="form-input facility-title" value="${f.title}">
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Facility Image Link</label>
          <input type="text" class="form-input facility-img" value="${f.image}">
          <input type="file" class="form-input" accept="image/*" onchange="handleFacilityFileUpload(this, ${index})" style="margin-top: 0.5rem;">
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Description Summary</label>
          <textarea class="form-input facility-desc">${f.description}</textarea>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

window.handleFacilityFileUpload = function (input, index) {
  const file = input.files[0];
  if (!file) return;
  compressImage(file, (base64) => {
    const row = input.closest(".list-item-row");
    const imgInput = row.querySelector(".facility-img");
    if (imgInput) imgInput.value = base64;
    window.RENEGADES_CONFIG.facilities.list[index].image = base64;
  });
};

document.getElementById("addFacilityBtn").addEventListener("click", () => {
  window.RENEGADES_CONFIG.facilities.list.push({
    title: "New Facility Zone",
    image: "https://images.unsplash.com/photo-1540747737956-37872404471d?auto=format&fit=crop&w=800&q=80",
    description: "Detailed overview of the equipment and purpose of this zone."
  });
  renderFacilitiesList(window.RENEGADES_CONFIG.facilities);
  scrollToBottom("facilitiesList");
});

// Gallery Media list
function renderGalleryList(data) {
  const container = document.getElementById("galleryList");
  if (!container) return;

  container.innerHTML = "";

  // Set albums text input raw value
  const rawAlbumsInput = document.getElementById("input-gallery-albums-raw");
  if (rawAlbumsInput) {
    rawAlbumsInput.value = (data.albums || ["training", "matches", "events", "players", "achievements"]).join(", ");
  }

  const albumsList = data.albums || ["training", "matches", "events", "players", "achievements"];

  data.list.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "list-item-row";

    // Category options builder
    const catOptions = albumsList.map(album =>
      `<option value="${album}" ${item.category === album ? "selected" : ""}>${album.toUpperCase()}</option>`
    ).join("");

    row.innerHTML = `
      <div class="list-item-header">
        <span class="list-item-index">Media ${index + 1} - ${item.title}</span>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button type="button" class="btn-remove-item" onclick="moveGalleryItem(${index}, -1)" style="color: var(--accent);">↑ Up</button>
          <button type="button" class="btn-remove-item" onclick="moveGalleryItem(${index}, 1)" style="color: var(--accent);">↓ Down</button>
          <button type="button" class="btn-remove-item" onclick="removeGalleryItem(${index})">Delete Media</button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Category (Album)</label>
          <select class="form-input gallery-cat">
            ${catOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Media Caption/Title</label>
          <input type="text" class="form-input gallery-title" value="${item.title}">
        </div>
        <div class="form-group">
          <label class="form-label">Media Type</label>
          <select class="form-input gallery-type">
            <option value="image" ${item.type === "image" || !item.type ? "selected" : ""}>Image</option>
            <option value="video" ${item.type === "video" ? "selected" : ""}>Video</option>
            <option value="reel" ${item.type === "reel" ? "selected" : ""}>Instagram Reel</option>
          </select>
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Media Source (Image/Video URL or Reel Link)</label>
          <input type="text" class="form-input gallery-url" value="${item.url}">
          
          <div class="file-upload-wrapper" style="margin-top: 0.5rem;">
            <label class="form-label" style="font-size: 0.7rem; color: var(--accent);">OR Upload File:</label>
            <input type="file" class="form-input gallery-file" accept="image/*, video/*" onchange="handleGalleryFileUpload(this, ${index})">
          </div>
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

window.handleGalleryFileUpload = function (input, index) {
  const file = input.files[0];
  if (!file) return;

  if (file.type.startsWith("image/")) {
    compressImage(file, (base64) => {
      const row = input.closest(".list-item-row");
      const urlInput = row.querySelector(".gallery-url");
      if (urlInput) urlInput.value = base64;
      window.RENEGADES_CONFIG.gallery.list[index].url = base64;
    });
  } else if (file.type.startsWith("video/")) {
    if (file.size > 2 * 1024 * 1024) {
      alert("WARNING: Local video file is larger than 2MB. Storing large video files directly inside browser storage can hit limits and slow down exports. We strongly recommend using direct external URL (Pexels, YouTube embed, etc.) instead!");
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const row = input.closest(".list-item-row");
      const urlInput = row.querySelector(".gallery-url");
      if (urlInput) urlInput.value = e.target.result;
      window.RENEGADES_CONFIG.gallery.list[index].url = e.target.result;
    };
  }
};

window.removeGalleryItem = function (index) {
  window.RENEGADES_CONFIG.gallery.list.splice(index, 1);
  renderGalleryList(window.RENEGADES_CONFIG.gallery);
};

window.moveGalleryItem = function (index, direction) {
  const list = window.RENEGADES_CONFIG.gallery.list;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  const temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  renderGalleryList(window.RENEGADES_CONFIG.gallery);
};

document.getElementById("addGalleryBtn").addEventListener("click", () => {
  const albums = window.RENEGADES_CONFIG.gallery.albums || ["training", "matches", "events", "players", "achievements"];
  const defaultAlbum = albums.length > 0 ? albums[0] : "training";
  window.RENEGADES_CONFIG.gallery.list.push({
    category: defaultAlbum,
    url: "https://images.unsplash.com/photo-1531415080290-bc9854593f6f?auto=format&fit=crop&w=800&q=80",
    title: "New Academy Session Image",
    type: "image"
  });
  renderGalleryList(window.RENEGADES_CONFIG.gallery);
  scrollToBottom("galleryList");
});

// Testimonials/Reviews list
function renderReviewsList(data) {
  const container = document.getElementById("reviewsList");
  if (!container) return;

  container.innerHTML = "";
  data.list.forEach((rev, index) => {
    const item = document.createElement("div");
    item.className = "list-item-row";
    item.innerHTML = `
      <div class="list-item-header">
        <span class="list-item-index">Review ${index + 1} - ${rev.name}</span>
        <button type="button" class="btn-remove-item" onclick="removeReview(${index})">Delete Review</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Reviewer Name</label>
          <input type="text" class="form-input review-name" value="${rev.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Relationship Label (e.g. Parent of U-14 student)</label>
          <input type="text" class="form-input review-rel" value="${rev.relation}">
        </div>
        <div class="form-group">
          <label class="form-label">Rating Stars (1-5)</label>
          <input type="number" class="form-input review-rating" value="${rev.rating}" min="1" max="5">
        </div>
        <div class="form-group">
          <label class="form-label">Date String (e.g. 2 Weeks Ago)</label>
          <input type="text" class="form-input review-date" value="${rev.date}">
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Feedback Review Text</label>
          <textarea class="form-input review-text">${rev.text}</textarea>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

window.removeReview = function (index) {
  window.RENEGADES_CONFIG.reviews.list.splice(index, 1);
  renderReviewsList(window.RENEGADES_CONFIG.reviews);
};

document.getElementById("addReviewBtn").addEventListener("click", () => {
  window.RENEGADES_CONFIG.reviews.list.push({
    name: "Reviewer Name",
    relation: "Parent / Student Athlete",
    date: "Just Now",
    rating: 5,
    text: "Review description praising coaching and infrastructure."
  });
  renderReviewsList(window.RENEGADES_CONFIG.reviews);
  scrollToBottom("reviewsList");
});

// Helper to scroll list down
function scrollToBottom(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  setTimeout(() => {
    container.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    container.lastElementChild?.classList.add("new-added");
  }, 100);
}

// Image compression helper using Canvas
function compressImage(file, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const max_width = 800;
      const max_height = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > max_width) {
          height = Math.round((height * max_width) / width);
          width = max_width;
        }
      } else {
        if (height > max_height) {
          width = Math.round((width * max_height) / height);
          height = max_height;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      callback(compressedDataUrl);
    };
  };
}

// Shop Manager renderer
function renderShopTab(data) {
  const container = document.getElementById("shopProductsList");
  if (!container) return;

  container.innerHTML = "";

  // Set categories text field
  const categoriesRaw = data.categories.map(c => `${c.id}:${c.name}`).join(", ");
  const rawCatsInput = document.getElementById("input-shop-categories-raw");
  if (rawCatsInput) rawCatsInput.value = categoriesRaw;

  document.getElementById("input-shop-title").value = data.title || "";
  document.getElementById("input-shop-subheading").value = data.subheading || "";

  data.products.forEach((p, index) => {
    const row = document.createElement("div");
    row.className = "list-item-row";
    row.setAttribute("data-id", p.id);

    // Category options builder
    const catOptions = data.categories.map(c =>
      `<option value="${c.id}" ${p.category === c.id ? "selected" : ""}>${c.name}</option>`
    ).join("");

    row.innerHTML = `
      <div class="list-item-header">
        <span class="list-item-index">Product ${index + 1} - ${p.name}</span>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button type="button" class="btn-remove-item" onclick="moveShopProduct(${index}, -1)" style="color: var(--accent);">↑ Up</button>
          <button type="button" class="btn-remove-item" onclick="moveShopProduct(${index}, 1)" style="color: var(--accent);">↓ Down</button>
          <button type="button" class="btn-remove-item" onclick="removeShopProduct(${index})">Delete Product</button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Product Name</label>
          <input type="text" class="form-input prod-name" value="${p.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input prod-cat">
            ${catOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Original Price (₹)</label>
          <input type="number" class="form-input prod-orig-price" value="${p.originalPrice || p.price}">
        </div>
        <div class="form-group">
          <label class="form-label">Selling Price (₹)</label>
          <input type="number" class="form-input prod-price" value="${p.price}">
        </div>
        <div class="form-group">
          <label class="form-label">Badge (e.g. Best Seller)</label>
          <input type="text" class="form-input prod-badge" value="${p.badge || ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Stock Status</label>
          <select class="form-input prod-stock">
            <option value="in-stock" ${p.stock === "in-stock" || !p.stock ? "selected" : ""}>In Stock</option>
            <option value="low-stock" ${p.stock === "low-stock" ? "selected" : ""}>Low Stock</option>
            <option value="out-of-stock" ${p.stock === "out-of-stock" ? "selected" : ""}>Out of Stock</option>
          </select>
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Product Image URL</label>
          <input type="text" class="form-input prod-image" value="${p.image}">
          <input type="file" class="form-input" accept="image/*" onchange="handleProductFileUpload(this, ${index})" style="margin-top:0.5rem;">
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

window.handleProductFileUpload = function (input, index) {
  const file = input.files[0];
  if (!file) return;
  compressImage(file, (base64) => {
    const row = input.closest(".list-item-row");
    const imgInput = row.querySelector(".prod-image");
    if (imgInput) imgInput.value = base64;
    window.RENEGADES_CONFIG.shop.products[index].image = base64;
  });
};

window.removeShopProduct = function (index) {
  window.RENEGADES_CONFIG.shop.products.splice(index, 1);
  renderShopTab(window.RENEGADES_CONFIG.shop);
};

window.moveShopProduct = function (index, direction) {
  const list = window.RENEGADES_CONFIG.shop.products;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  const temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  renderShopTab(window.RENEGADES_CONFIG.shop);
};

document.getElementById("addShopProductBtn").addEventListener("click", () => {
  const categories = window.RENEGADES_CONFIG.shop.categories;
  const defaultCat = categories.length > 1 ? categories[1].id : "all";

  window.RENEGADES_CONFIG.shop.products.push({
    id: "prod-" + Date.now(),
    category: defaultCat,
    name: "New Product",
    originalPrice: 1000,
    price: 800,
    image: "assets/images/logo.png",
    badge: "",
    stock: "in-stock"
  });
  renderShopTab(window.RENEGADES_CONFIG.shop);
  scrollToBottom("shopProductsList");
});

// Shop categories change listener
const shopCatsInput = document.getElementById("input-shop-categories-raw");
if (shopCatsInput) {
  shopCatsInput.addEventListener("change", (e) => {
    const val = e.target.value.trim();
    const list = val.split(",").map(item => {
      const parts = item.split(":");
      const id = parts[0]?.trim();
      const name = parts[1]?.trim() || id;
      return { id, name };
    }).filter(c => c.id.length > 0);
    window.RENEGADES_CONFIG.shop.categories = list;
    renderShopTab(window.RENEGADES_CONFIG.shop);
  });
}

// Render Stats/Achievements Counters List
function renderStatsList(data) {
  const container = document.getElementById("statsList");
  if (!container) return;

  container.innerHTML = "";
  data.list.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "list-item-row";
    row.innerHTML = `
      <div class="list-item-header">
        <span class="list-item-index">Counter ${index + 1} - ${item.label}</span>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button type="button" class="btn-remove-item" onclick="moveStatItem(${index}, -1)" style="color: var(--accent);">↑ Up</button>
          <button type="button" class="btn-remove-item" onclick="moveStatItem(${index}, 1)" style="color: var(--accent);">↓ Down</button>
          <button type="button" class="btn-remove-item" onclick="removeStatItem(${index})">Delete Counter</button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Stat Label/Name</label>
          <input type="text" class="form-input stat-label-input" value="${item.label}">
        </div>
        <div class="form-group">
          <label class="form-label">Count Number</label>
          <input type="number" class="form-input stat-count-input" value="${item.count}">
        </div>
        <div class="form-group">
          <label class="form-label">Suffix (e.g. +, -Star)</label>
          <input type="text" class="form-input stat-suffix-input" value="${item.suffix || ""}">
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

window.removeStatItem = function (index) {
  window.RENEGADES_CONFIG.achievements.list.splice(index, 1);
  renderStatsList(window.RENEGADES_CONFIG.achievements);
};

window.moveStatItem = function (index, direction) {
  const list = window.RENEGADES_CONFIG.achievements.list;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  const temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  renderStatsList(window.RENEGADES_CONFIG.achievements);
};

document.getElementById("addStatBtn").addEventListener("click", () => {
  window.RENEGADES_CONFIG.achievements.list.push({
    label: "New Counter Achievement",
    count: 100,
    suffix: "+"
  });
  renderStatsList(window.RENEGADES_CONFIG.achievements);
  scrollToBottom("statsList");
});

// Bulk gallery image uploads
const bulkUploadInput = document.getElementById("bulkGalleryImageUpload");
if (bulkUploadInput) {
  bulkUploadInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let processedCount = 0;
    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        compressImage(file, (base64) => {
          window.RENEGADES_CONFIG.gallery.list.push({
            category: window.RENEGADES_CONFIG.gallery.albums?.[0] || "training",
            url: base64,
            title: file.name.split(".")[0].replace(/[-_]/g, " "),
            type: "image"
          });
          processedCount++;
          if (processedCount === files.length) {
            renderGalleryList(window.RENEGADES_CONFIG.gallery);
            alert(`Successfully uploaded and compressed ${files.length} images!`);
          }
        });
      } else {
        processedCount++;
        if (processedCount === files.length) {
          renderGalleryList(window.RENEGADES_CONFIG.gallery);
        }
      }
    });
  });
}

// Gallery albums raw input change listener
const galleryAlbumsInput = document.getElementById("input-gallery-albums-raw");
if (galleryAlbumsInput) {
  galleryAlbumsInput.addEventListener("change", (e) => {
    const val = e.target.value.trim();
    const list = val.split(",").map(s => s.trim()).filter(s => s.length > 0);
    window.RENEGADES_CONFIG.gallery.albums = list;
    renderGalleryList(window.RENEGADES_CONFIG.gallery);
  });
}

// ==========================================================================
// 5. MASTER ACTIONS (SAVE / DOWNLOAD / RESET)
// ==========================================================================
function initActions() {
  const saveAllBtn = document.getElementById("saveAllBtn");
  const btnDownloadConfig = document.getElementById("btnDownloadConfig");
  const btnResetConfig = document.getElementById("btnResetConfig");
  const btnClearStorage = document.getElementById("btnClearStorage");
  const successBanner = document.getElementById("successBanner");

  // Save changes locally in LocalStorage
  saveAllBtn.addEventListener("click", async () => {
    const newConfig = gatherFormData();
    console.log("NEW CONFIG:", newConfig);


    // Save to local storage
    window.RENEGADES_CONFIG = newConfig;
    localStorage.setItem(
      "renegades_config",
      JSON.stringify(newConfig)
    );

    const { data, error } = await window.supabaseClient
      .from("website_config")
      .update({
        data: newConfig
      })
      .eq("id", 1)
      .select();

    console.log("DATA:", data);
    console.log("ERROR:", error);
    //alert(JSON.stringify(error))

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    console.log("Saved to Supabase!");
    window.RENEGADES_CONFIG = newConfig;
    //location.reload();
    // Trigger feedback slide-in banner
    successBanner.classList.add("show");
    setTimeout(() => {
      successBanner.classList.remove("show");
    }, 4000);
  });

  // Download config.js
  btnDownloadConfig.addEventListener("click", () => {
    const configToExport = gatherFormData();

    // Generate JS string content
    const exportContent = `// Renegades Sports Arena - Configuration Database
// This file controls all the text, numbers, images, and features on the website.
// Auto-generated by Renegades Admin Dashboard.

const DEFAULT_CONFIG = ${JSON.stringify(configToExport, null, 2)};

// Retrieve configuration from local storage if edited in admin, otherwise default
const configSource = localStorage.getItem("renegades_config");
window.RENEGADES_CONFIG = configSource ? JSON.parse(configSource) : DEFAULT_CONFIG;
`;

    // Download triggers
    const blob = new Blob([exportContent], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "config.js";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Reset to default settings
  btnResetConfig.addEventListener("click", () => {
    if (confirm("Are you sure you want to discard your edits and reset to the default pre-packaged database?")) {
      localStorage.removeItem("renegades_config");
      window.location.reload();
    }
  });

  // Clear all local storage
  btnClearStorage.addEventListener("click", () => {
    if (confirm("This will clear all localStorage cache and log you out. Proceed?")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  });
}

// Gather all inputs to build a fresh config payload mimicking config.js format
function gatherFormData() {
  // 1. General Config
  const general = {
    academyName: document.getElementById("input-general-name").value.trim(),
    tagline: document.getElementById("input-general-tagline").value.trim(),
    phone: document.getElementById("input-general-phone").value.trim(),
    email: document.getElementById("input-general-email").value.trim(),
    whatsappNumber: document.getElementById("input-general-whatsapp").value.trim(),
    address: document.getElementById("input-general-address").value.trim(),
    googleMapsEmbed: document.getElementById("input-general-map").value.trim(),
    instagramUrl: document.getElementById("input-general-instagram").value.trim(),
    facebookUrl: document.getElementById("input-general-facebook").value.trim(),
    youtubeUrl: document.getElementById("input-general-youtube").value.trim(),
    googleBusinessUrl: document.getElementById("input-general-google").value.trim(),
    announcementEnabled: document.getElementById("input-general-announcement-enabled").value === "true",
    announcementText: document.getElementById("input-general-announcement-text").value.trim(),
    announcementBgColor: document.getElementById("input-general-announcement-bg").value.trim(),
    announcementLink: document.getElementById("input-general-announcement-link").value.trim()
  };

  // 2. Hero Config
  const hero = {
    title: document.getElementById("input-hero-title").value.trim(),
    subheading: document.getElementById("input-hero-subheading").value.trim(),
    tagline: document.getElementById("input-hero-tagline").value.trim(),
    videoUrl: document.getElementById("input-hero-video").value.trim(),
    fallbackImageUrl: document.getElementById("input-hero-fallback").value.trim(),
    primaryCtaText: document.getElementById("input-hero-primary").value.trim(),
    secondaryCtaText: document.getElementById("input-hero-secondary").value.trim(),
    shopCtaText: document.getElementById("input-hero-shop-text").value.trim()
  };

  // 3. Why Choose Us cards list
  const whyCards = [];
  const whyRows = document.querySelectorAll("#whyCardsList .list-item-row");
  whyRows.forEach(row => {
    whyCards.push({
      icon: row.querySelector(".card-icon").value.trim(),
      title: row.querySelector(".card-title").value.trim(),
      description: row.querySelector(".card-desc").value.trim()
    });
  });
  const whyChooseUs = {
    title: document.getElementById("input-why-title").value.trim(),
    cards: whyCards
  };

  // 4b. Future Stars Arena Config
  const rawFeatures = document.getElementById("input-arena-features").value;
  const featuresArray = rawFeatures.split(",")
    .map(f => f.trim())
    .filter(f => f.length > 0);

  const futureArena = {
    badge: document.getElementById("input-arena-badge").value.trim(),
    title: document.getElementById("input-arena-title").value.trim(),
    subtitle: document.getElementById("input-arena-subtitle").value.trim(),
    description: document.getElementById("input-arena-desc").value.trim(),
    image: document.getElementById("input-arena-image").value.trim(),
    features: featuresArray
  };

  // 5. Associated Clubs list
  const clubList = [];
  const clubRows = document.querySelectorAll("#clubsList .list-item-row");
  clubRows.forEach(row => {
    clubList.push({
      name: row.querySelector(".club-name").value.trim(),
      logoText: row.querySelector(".club-acro").value.trim()
    });
  });
  const clubs = {
    title: document.getElementById("input-clubs-title").value.trim(),
    subheading: document.getElementById("input-clubs-sub").value.trim(),
    disclaimer: document.getElementById("input-clubs-disclaimer").value.trim(),
    list: clubList
  };

  // 6. Programs List
  const progList = [];
  const progRows = document.querySelectorAll("#programsList .list-item-row");
  progRows.forEach(row => {
    const rawBenefits = row.querySelector(".program-benefits").value;
    const benefitsArray = rawBenefits.split(",")
      .map(b => b.trim())
      .filter(b => b.length > 0);

    progList.push({
      category: row.querySelector(".program-cat").value,
      title: row.querySelector(".program-title").value.trim(),
      ageGroup: row.querySelector(".program-age").value.trim(),
      description: row.querySelector(".program-desc").value.trim(),
      benefits: benefitsArray,
      icon: row.querySelector(".program-icon").value.trim()
    });
  });
  const programs = {
    title: window.RENEGADES_CONFIG.programs.title,
    subheading: window.RENEGADES_CONFIG.programs.subheading,
    list: progList
  };

  // 7. Preserving new sections (Journey, Parents Trust, Vision & Mission) in the gathered object
  const renegadesPathway = window.RENEGADES_CONFIG.renegadesPathway;
  const whyParentsChoose = window.RENEGADES_CONFIG.whyParentsChoose;
  const visionMission = window.RENEGADES_CONFIG.visionMission;

  // 8. Coaching staff list
  const coachList = [];
  const coachRows = document.querySelectorAll("#coachesList .list-item-row");
  coachRows.forEach(row => {
    coachList.push({
      name: row.querySelector(".coach-name").value.trim(),
      designation: row.querySelector(".coach-desig").value.trim(),
      experience: row.querySelector(".coach-exp").value.trim(),
      specialization: row.querySelector(".coach-spec").value.trim(),
      achievements: row.querySelector(".coach-achievements").value.trim(),
      image: row.querySelector(".coach-img").value.trim(),
      instagram: "#",
      twitter: "#"
    });
  });
  const coaches = {
    title: window.RENEGADES_CONFIG.coaches.title,
    subheading: window.RENEGADES_CONFIG.coaches.subheading,
    list: coachList
  };

  // 9. Facilities list
  const facilityList = [];
  const facilityRows = document.querySelectorAll("#facilitiesList .list-item-row");
  facilityRows.forEach(row => {
    facilityList.push({
      title: row.querySelector(".facility-title").value.trim(),
      image: row.querySelector(".facility-img").value.trim(),
      description: row.querySelector(".facility-desc").value.trim()
    });
  });
  const facilities = {
    title: window.RENEGADES_CONFIG.facilities.title,
    subheading: window.RENEGADES_CONFIG.facilities.subheading,
    list: facilityList
  };

  // 10. Gallery list
  const galleryList = [];
  const galleryRows = document.querySelectorAll("#galleryList .list-item-row");
  galleryRows.forEach(row => {
    galleryList.push({
      category: row.querySelector(".gallery-cat").value,
      url: row.querySelector(".gallery-url").value.trim(),
      title: row.querySelector(".gallery-title").value.trim(),
      type: row.querySelector(".gallery-type").value
    });
  });
  const rawGalleryAlbums = document.getElementById("input-gallery-albums-raw").value;
  const galleryAlbumsArray = rawGalleryAlbums.split(",").map(a => a.trim()).filter(a => a.length > 0);
  const gallery = {
    title: window.RENEGADES_CONFIG.gallery.title,
    subheading: window.RENEGADES_CONFIG.gallery.subheading,
    albums: galleryAlbumsArray,
    list: galleryList
  };

  // 11. Reviews list
  const reviewList = [];
  const reviewRows = document.querySelectorAll("#reviewsList .list-item-row");
  reviewRows.forEach(row => {
    reviewList.push({
      name: row.querySelector(".review-name").value.trim(),
      relation: row.querySelector(".review-rel").value.trim(),
      rating: parseInt(row.querySelector(".review-rating").value),
      date: row.querySelector(".review-date").value.trim(),
      text: row.querySelector(".review-text").value.trim()
    });
  });
  const reviews = {
    title: window.RENEGADES_CONFIG.reviews.title,
    subheading: window.RENEGADES_CONFIG.reviews.subheading,
    list: reviewList
  };

  // 12. Stats Counter achievements
  const statsList = [];
  const statRows = document.querySelectorAll("#statsList .list-item-row");
  statRows.forEach(row => {
    statsList.push({
      label: row.querySelector(".stat-label-input").value.trim(),
      count: parseInt(row.querySelector(".stat-count-input").value) || 0,
      suffix: row.querySelector(".stat-suffix-input").value.trim()
    });
  });
  const achievements = {
    title: window.RENEGADES_CONFIG.achievements.title,
    list: statsList
  };

  // 13. Shop Products & Categories
  const shopProducts = [];
  const prodRows = document.querySelectorAll("#shopProductsList .list-item-row");
  prodRows.forEach(row => {
    const id = row.getAttribute("data-id") || ("prod-" + Date.now());
    shopProducts.push({
      id: id,
      category: row.querySelector(".prod-cat").value,
      name: row.querySelector(".prod-name").value.trim(),
      originalPrice: parseFloat(row.querySelector(".prod-orig-price").value) || 0,
      price: parseFloat(row.querySelector(".prod-price").value) || 0,
      image: row.querySelector(".prod-image").value.trim(),
      badge: row.querySelector(".prod-badge").value.trim(),
      stock: row.querySelector(".prod-stock").value
    });
  });

  const rawShopCats = document.getElementById("input-shop-categories-raw").value;
  const shopCatsArray = rawShopCats.split(",").map(item => {
    const parts = item.split(":");
    const id = parts[0]?.trim();
    const name = parts[1]?.trim() || id;
    return { id, name };
  }).filter(c => c.id.length > 0);

  const shop = {
    title: document.getElementById("input-shop-title").value.trim(),
    subheading: document.getElementById("input-shop-subheading").value.trim(),
    categories: shopCatsArray,
    products: shopProducts
  };

  return {
    general,
    hero,
    whyChooseUs,
    futureArena,
    clubs,
    programs,
    renegadesPathway,
    whyParentsChoose,
    visionMission,
    coaches,
    facilities,
    gallery,
    reviews,
    achievements,
    shop
  };
}

// ==========================================================================
// BOOKINGS MANAGER LOGIC
// ==========================================================================

let adminBookings = [];
let calCurrentDate = new Date();
let selectedBookingId = null;

async function initBookingsManager() {
  const tabBtn = document.querySelector('[data-target-tab="bookings-tab"]');
  if (!tabBtn) return;

  // Render toggle handlers
  const listBtn = document.getElementById("viewBookingsListBtn");
  const calBtn = document.getElementById("viewBookingsCalendarBtn");
  const listContainer = document.getElementById("bookingsListContainer");
  const calContainer = document.getElementById("bookingsCalendarContainer");

  if (listBtn && calBtn && listContainer && calContainer) {
    listBtn.addEventListener("click", () => {
      listBtn.classList.add("active");
      calBtn.classList.remove("active");
      listContainer.style.display = "block";
      calContainer.style.display = "none";
      renderBookingsTable();
    });
    calBtn.addEventListener("click", () => {
      calBtn.classList.add("active");
      listBtn.classList.remove("active");
      listContainer.style.display = "none";
      calContainer.style.display = "block";
      renderAdminCalendar();
    });
  }

  // Load bookings initially
  await refreshBookings();

  // Filters event listeners
  const searchInput = document.getElementById("bookingsSearchInput");
  const statusFilter = document.getElementById("bookingsStatusFilter");
  const dateFilter = document.getElementById("bookingsDateFilter");
  const clearBtn = document.getElementById("bookingsClearFiltersBtn");
  const exportBtn = document.getElementById("bookingsExportCsvBtn");

  if (searchInput) searchInput.addEventListener("input", filterAndRender);
  if (statusFilter) statusFilter.addEventListener("change", filterAndRender);
  if (dateFilter) dateFilter.addEventListener("change", filterAndRender);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (statusFilter) statusFilter.value = "all";
      if (dateFilter) dateFilter.value = "";
      filterAndRender();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const filtered = getFilteredBookings();
      exportBookingsToCSV(filtered);
    });
  }

  // Calendar prev/next month listeners
  const prevMonthBtn = document.getElementById("calPrevMonthBtn");
  const nextMonthBtn = document.getElementById("calNextMonthBtn");
  if (prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
      renderAdminCalendar();
    });
    nextMonthBtn.addEventListener("click", () => {
      calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
      renderAdminCalendar();
    });
  }

  // Reschedule Modal Cancel listener
  const reschCancelBtn = document.getElementById("adminRescheduleCancelBtn");
  if (reschCancelBtn) {
    reschCancelBtn.addEventListener("click", () => {
      document.getElementById("adminRescheduleModal").classList.add("hidden");
      if (window.releaseSlotLock) window.releaseSlotLock();
    });
  }

  const reschSaveBtn = document.getElementById("adminRescheduleSaveBtn");
  if (reschSaveBtn) {
    reschSaveBtn.addEventListener("click", saveBookingReschedule);
  }

  // Add date picker listener in rescheduling modal
  const reschDatePicker = document.getElementById("adminRescheduleDate");
  if (reschDatePicker) {
    reschDatePicker.addEventListener("change", async () => {
      const selectedDate = reschDatePicker.value;
      if (!selectedDate) return;
      const occupancies = await fetchSlotOccupancyAdmin(selectedDate);
      const hiddenInput = document.getElementById("adminRescheduleSlotInput");
      const grid = document.getElementById("adminRescheduleSlotsGrid");
      updateRescheduleSlotsGrid(grid, occupancies, hiddenInput);
    });
  }
}

async function refreshBookings() {
  if (!window.supabaseClient) return;
  try {
    const { data, error } = await window.supabaseClient
      .from("trial_bookings")
      .select("*")
      .order("booking_date", { ascending: false });

    if (error) throw error;
    adminBookings = data || [];

    // Update stats counters
    updateBookingStats();

    // Render depending on active tab
    const listBtn = document.getElementById("viewBookingsListBtn");
    if (listBtn && listBtn.classList.contains("active")) {
      renderBookingsTable();
    } else {
      renderAdminCalendar();
    }
  } catch (err) {
    console.error("Error loading admin bookings:", err);
  }
}

function updateBookingStats() {
  const totalEl = document.getElementById("totalBookingsCount");
  const pendingEl = document.getElementById("pendingBookingsCount");
  const approvedEl = document.getElementById("approvedBookingsCount");

  const total = adminBookings.length;
  const pending = adminBookings.filter(b => b.status === "pending").length;
  const approved = adminBookings.filter(b => b.status === "approved" || b.status === "rescheduled").length;

  if (totalEl) totalEl.textContent = total;
  if (pendingEl) pendingEl.textContent = pending;
  if (approvedEl) approvedEl.textContent = approved;
}

function getFilteredBookings() {
  const search = document.getElementById("bookingsSearchInput")?.value.trim().toLowerCase() || "";
  const status = document.getElementById("bookingsStatusFilter")?.value || "all";
  const date = document.getElementById("bookingsDateFilter")?.value || "";

  return adminBookings.filter(b => {
    // Search filter
    const matchesSearch = !search ||
      b.name.toLowerCase().includes(search) ||
      b.email.toLowerCase().includes(search) ||
      b.phone.includes(search) ||
      (b.parent_name && b.parent_name.toLowerCase().includes(search));

    // Status filter
    const matchesStatus = status === "all" || b.status === status;

    // Date filter
    const matchesDate = !date || b.booking_date === date;

    return matchesSearch && matchesStatus && matchesDate;
  });
}

function filterAndRender() {
  const listBtn = document.getElementById("viewBookingsListBtn");
  if (listBtn && listBtn.classList.contains("active")) {
    renderBookingsTable();
  } else {
    renderAdminCalendar();
  }
}

function renderBookingsTable() {
  const tbody = document.getElementById("bookingsTableBody");
  const emptyMessage = document.getElementById("bookingsTableEmpty");
  if (!tbody) return;

  tbody.innerHTML = "";
  const filtered = getFilteredBookings();

  if (filtered.length === 0) {
    if (emptyMessage) emptyMessage.style.display = "block";
    return;
  }
  if (emptyMessage) emptyMessage.style.display = "none";

  filtered.forEach(b => {
    const tr = document.createElement("tr");

    // Parent rendering
    const parentStr = b.parent_name ? `<span style="font-size:0.75rem; color:var(--text-grey); display:block;">Parent: ${b.parent_name}</span>` : "";
    const ageParent = `<strong>${b.age} yrs</strong>${parentStr}`;

    // Contact details
    const contact = `<a href="tel:${b.phone}" style="color:var(--accent);">${b.phone}</a><span style="font-size:0.75rem; color:var(--text-grey); display:block;">${b.email}</span>`;

    // Actions block based on status
    let actionButtons = "";
    if (b.status === "pending" || b.status === "rescheduled") {
      actionButtons = `
        <button type="button" class="btn-action-sm btn-approve" onclick="updateBookingStatus('${b.id}', 'approved')">Approve</button>
        <button type="button" class="btn-action-sm btn-reject" onclick="updateBookingStatus('${b.id}', 'rejected')">Reject</button>
        <button type="button" class="btn-action-sm btn-resched" onclick="openAdminRescheduleModal('${b.id}', '${b.booking_date}', '${b.booking_slot}')">Resched</button>
      `;
    } else if (b.status === "approved") {
      actionButtons = `
        <button type="button" class="btn-action-sm btn-reject" onclick="updateBookingStatus('${b.id}', 'rejected')">Reject</button>
        <button type="button" class="btn-action-sm btn-resched" onclick="openAdminRescheduleModal('${b.id}', '${b.booking_date}', '${b.booking_slot}')">Resched</button>
        <button type="button" class="btn-action-sm btn-notify" onclick="sendCustomNotification('${b.id}')">Send Msg</button>
      `;
    } else {
      actionButtons = `
        <span style="color:var(--text-dark); font-size:0.75rem;">No actions available</span>
      `;
    }

    tr.innerHTML = `
      <td><strong>${b.name}</strong><span style="display:block; font-size:0.75rem; color:var(--text-grey); font-style:italic;">Msg: ${b.message || 'None'}</span></td>
      <td>${ageParent}</td>
      <td>${contact}</td>
      <td>${b.skill_level}</td>
      <td><strong>${b.booking_date}</strong><span style="display:block; font-size:0.75rem; color:var(--accent);">${b.booking_slot}</span></td>
      <td><span class="badge-status ${b.status}">${b.status}</span></td>
      <td style="white-space:nowrap;">${actionButtons}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAdminCalendar() {
  const grid = document.getElementById("calendarDaysGrid");
  const monthTitle = document.getElementById("calCurrentMonthTitle");
  if (!grid || !monthTitle) return;

  grid.innerHTML = "";

  const year = calCurrentDate.getFullYear();
  const month = calCurrentDate.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  monthTitle.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();

  const prevMonthNumDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day-cell other-month";
    dayCell.innerHTML = `<span class="calendar-day-num">${prevMonthNumDays - i}</span>`;
    grid.appendChild(dayCell);
  }

  const today = new Date();
  const filtered = getFilteredBookings();

  for (let d = 1; d <= numDays; d++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day-cell";

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) {
      dayCell.classList.add("today");
    }

    // Find bookings on this specific day
    const dayBookings = filtered.filter(b => b.booking_date === dateStr);
    const count = dayBookings.length;

    dayCell.innerHTML = `
      <span class="calendar-day-num">${d}</span>
      ${count > 0 ? `<span class="calendar-day-badge">${count} booking${count > 1 ? 's' : ''}</span>` : ''}
    `;

    dayCell.addEventListener("click", () => {
      document.querySelectorAll(".calendar-day-cell").forEach(c => c.classList.remove("active-selected"));
      dayCell.classList.add("active-selected");

      showCalendarDayDetails(dateStr, dayBookings);
    });

    grid.appendChild(dayCell);
  }
}

function showCalendarDayDetails(dateStr, dayBookings) {
  const panel = document.getElementById("calendarDayDetailsPanel");
  const title = document.getElementById("calendarDayDetailsTitle");
  const list = document.getElementById("calendarDayDetailsList");
  if (!panel || !title || !list) return;

  panel.style.display = "block";
  title.textContent = `Bookings on ${dateStr}`;
  list.innerHTML = "";

  if (dayBookings.length === 0) {
    list.innerHTML = `<p style="color:var(--text-grey); font-size:0.85rem;">No bookings scheduled for this date.</p>`;
    return;
  }

  dayBookings.forEach(b => {
    const item = document.createElement("div");
    item.className = "booking-detail-item";

    let actionButtons = "";
    if (b.status === "pending" || b.status === "rescheduled" || b.status === "approved") {
      actionButtons = `
        <button type="button" class="btn-action-sm btn-approve" style="padding:0.25rem 0.5rem;" onclick="updateBookingStatus('${b.id}', 'approved')">Approve</button>
        <button type="button" class="btn-action-sm btn-reject" style="padding:0.25rem 0.5rem;" onclick="updateBookingStatus('${b.id}', 'rejected')">Reject</button>
        <button type="button" class="btn-action-sm btn-resched" style="padding:0.25rem 0.5rem;" onclick="openAdminRescheduleModal('${b.id}', '${b.booking_date}', '${b.booking_slot}')">Resched</button>
      `;
    }

    item.innerHTML = `
      <div>
        <strong style="color:var(--text-white); font-size:0.95rem;">${b.name}</strong> (${b.age} yrs)
        <span style="display:block; font-size:0.75rem; color:var(--text-grey);">Slot: <strong>${b.booking_slot}</strong> | Status: <span class="badge-status ${b.status}" style="padding:0.1rem 0.4rem; font-size:0.55rem;">${b.status}</span></span>
        <span style="display:block; font-size:0.75rem; color:var(--text-grey);">Phone: ${b.phone} | Email: ${b.email}</span>
      </div>
      <div>
        ${actionButtons}
      </div>
    `;
    list.appendChild(item);
  });
}

// Global actions mapper
window.updateBookingStatus = async function (id, status) {
  if (!window.supabaseClient) return;
  const verb = status === 'approved' ? 'approve' : 'reject';
  if (!confirm(`Are you sure you want to ${verb} this booking?`)) return;

  try {
    const { error } = await window.supabaseClient
      .from("trial_bookings")
      .update({ status: status })
      .eq("id", id);

    if (error) throw error;

    // Fetch user details for confirmation message
    const booking = adminBookings.find(b => b.id === id);

    // Write audit log
    if (window.writeAuditLog) {
      await window.writeAuditLog(id, 'update_status', 'admin', { status: status });
    }

    // Dispatch status update notification
    if (window.NotificationDispatcher && booking) {
      await window.NotificationDispatcher.dispatch({
        userId: null,
        type: status === 'approved' ? 'trial_confirmation' : 'session_update',
        title: `Trial Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your trial booking for ${booking.booking_date} at ${booking.booking_slot} has been ${status}.`,
        channels: ['push'],
        profileDetails: {
          name: booking.name,
          phone: booking.phone,
          email: booking.email
        },
        bookingDetails: {
          date: booking.booking_date,
          slot: booking.booking_slot
        }
      });
    }

    // Re-load bookings
    await refreshBookings();

    // Trigger WhatsApp notification options
    if (booking) {
      setTimeout(() => {
        sendNotificationDirect(booking, status);
      }, 300);
    }
  } catch (err) {
    console.error("Error updating status:", err);
    alert("Failed to update status. Please try again.");
  }
};

window.sendCustomNotification = function (id) {
  const booking = adminBookings.find(b => b.id === id);
  if (booking) {
    sendNotificationDirect(booking, booking.status);
  }
};

function sendNotificationDirect(booking, status) {
  let message = "";
  if (status === "approved") {
    message = `Dear ${booking.name}, your Free Turf Trial Session at Renegades Sports Arena has been APPROVED!

Date: ${booking.booking_date}
Time Slot: ${booking.booking_slot}

Please report 10 minutes prior to the session. See you there!`;
  } else if (status === "rejected") {
    message = `Dear ${booking.name}, we regret to inform you that we are unable to approve your free trial booking for ${booking.booking_date} at ${booking.booking_slot} due to slot occupancy limits.

Please reschedule your booking through our website or contact us to arrange another time slot.`;
  } else if (status === "rescheduled") {
    message = `Dear ${booking.name}, your Free Turf Trial Session at Renegades Sports Arena has been rescheduled.

New Date: ${booking.booking_date}
New Time Slot: ${booking.booking_slot}

Looking forward to training with you!`;
  } else {
    return;
  }

  const waText = encodeURIComponent(message);
  const cleanPhone = booking.phone.replace(/[^0-9]/g, "");
  // Prepend 91 if it's a 10 digit number
  const finalPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
  const waLink = `https://wa.me/${finalPhone}?text=${waText}`;
  const mailSubject = encodeURIComponent("Trial Booking Confirmation - Renegades Sports Arena");
  const mailBody = encodeURIComponent(message);
  const mailLink = `mailto:${booking.email}?subject=${mailSubject}&body=${mailBody}`;

  const confirmBox = document.createElement("div");
  confirmBox.className = "login-overlay";
  confirmBox.style.zIndex = "10003";
  confirmBox.innerHTML = `
    <div class="login-card" style="max-width:480px; text-align:center;">
      <h3 style="color:var(--accent); font-size:1.2rem; margin-bottom:1rem; text-transform:uppercase;">Notify Customer</h3>
      <p style="color:var(--text-white); font-size:0.9rem; margin-bottom:1.5rem;">Booking has been marked as <strong>${status.toUpperCase()}</strong>. How would you like to notify the customer?</p>
      
      <div style="display:flex; flex-direction:column; gap:1rem; margin-bottom: 2rem;">
        <a href="${waLink}" target="_blank" rel="noopener" class="login-btn" style="text-align:center; padding: 0.8rem; background:#25D366;">
          Notify via WhatsApp
        </a>
        <a href="${mailLink}" class="login-btn" style="text-align:center; padding: 0.8rem; background:#007AFF;">
          Notify via Email
        </a>
      </div>
      <button type="button" class="login-btn" style="background:var(--border-grey);" id="closeNotifyBtn">Close</button>
    </div>
  `;
  document.body.appendChild(confirmBox);

  document.getElementById("closeNotifyBtn").addEventListener("click", () => {
    document.body.removeChild(confirmBox);
  });
}

// Rescheduling modal control
window.openAdminRescheduleModal = function (id, date, slot) {
  selectedBookingId = id;
  const modal = document.getElementById("adminRescheduleModal");
  const dateInput = document.getElementById("adminRescheduleDate");
  const slotInput = document.getElementById("adminRescheduleSlotInput");
  const grid = document.getElementById("adminRescheduleSlotsGrid");

  if (!modal || !dateInput || !slotInput || !grid) return;

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  dateInput.setAttribute("min", today);
  dateInput.value = date;
  slotInput.value = slot;

  modal.classList.remove("hidden");

  // Load slots occupancy initial
  const loadSlots = async () => {
    const curDate = dateInput.value;
    if (!curDate) return;
    const occupancies = await fetchSlotOccupancyAdmin(curDate);
    updateRescheduleSlotsGrid(grid, occupancies, slotInput, slot);
  };
  loadSlots();
};

async function fetchSlotOccupancyAdmin(dateStr) {
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
    console.error("Error fetching admin occupancies:", err);
  }
  return counts;
}

function updateRescheduleSlotsGrid(gridContainer, occupancies, hiddenInput, selectedSlotVal = "") {
  if (!gridContainer) return;
  const buttons = gridContainer.querySelectorAll(".slot-btn");
  buttons.forEach(btn => {
    const slot = btn.getAttribute("data-slot");
    const occ = occupancies[slot] || 0;
    const remaining = 5 - occ;
    const badge = btn.querySelector(".slot-count");

    // Reset styles
    btn.classList.remove("disabled", "active");
    if (badge) {
      badge.textContent = `${remaining} left`;
      badge.style.color = "var(--success)";
    }

    if (selectedSlotVal === slot || hiddenInput.value === slot) {
      btn.classList.add("active");
    }

    if (occ >= 5) {
      btn.classList.add("disabled");
      if (badge) {
        badge.textContent = "Full";
        badge.style.color = "var(--error)";
      }
    }

    btn.onclick = async (e) => {
      e.preventDefault();
      if (btn.classList.contains("disabled")) return;
      if (btn.classList.contains("active")) return;
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      hiddenInput.value = slot;

      // Acquire slot lock
      const dateInput = document.getElementById("adminRescheduleDate");
      const selectedDate = dateInput ? dateInput.value : "";
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

async function saveBookingReschedule() {
  if (!selectedBookingId || !window.supabaseClient) return;

  const newDate = document.getElementById("adminRescheduleDate").value;
  const newSlot = document.getElementById("adminRescheduleSlotInput").value;

  if (!newDate || !newSlot) {
    alert("Please select a date and an available slot.");
    return;
  }

  // Double check occupancy limits
  const occupancies = await fetchSlotOccupancyAdmin(newDate);
  if ((occupancies[newSlot] || 0) >= 5) {
    alert("This slot is already fully booked. Please select another slot.");
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from("trial_bookings")
      .update({
        booking_date: newDate,
        booking_slot: newSlot,
        status: "rescheduled"
      })
      .eq("id", selectedBookingId);

    if (error) throw error;

    // Close modal
    document.getElementById("adminRescheduleModal").classList.add("hidden");

    // Retrieve details for notifications
    const booking = adminBookings.find(b => b.id === selectedBookingId);

    // Write audit log
    if (window.writeAuditLog) {
      await window.writeAuditLog(selectedBookingId, 'reschedule', 'admin', {
        booking_date: newDate,
        booking_slot: newSlot,
        status: 'rescheduled'
      });
    }

    // Release lock
    if (window.releaseSlotLock) {
      await window.releaseSlotLock();
    }

    // Dispatch reschedule notification
    if (window.NotificationDispatcher && booking) {
      await window.NotificationDispatcher.dispatch({
        userId: null,
        type: 'session_update',
        title: `Trial Booking Rescheduled`,
        message: `Your trial booking has been rescheduled to ${newDate} at ${newSlot}.`,
        channels: ['push'],
        profileDetails: {
          name: booking.name,
          phone: booking.phone,
          email: booking.email
        },
        bookingDetails: {
          date: newDate,
          slot: newSlot
        }
      });
    }

    // Refresh list
    await refreshBookings();

    // Trigger notification popup
    if (booking) {
      booking.booking_date = newDate;
      booking.booking_slot = newSlot;
      setTimeout(() => {
        sendNotificationDirect(booking, "rescheduled");
      }, 300);
    }
  } catch (err) {
    console.error("Error rescheduling booking:", err);
    alert("Failed to reschedule booking. Please try again.");
  }
}

function exportBookingsToCSV(bookings) {
  const headers = ["ID", "Name", "Age", "Parent Name", "Phone", "Email", "Skill Level", "Booking Date", "Booking Slot", "Status", "Created At"];
  const rows = bookings.map(b => [
    b.id,
    `"${b.name.replace(/"/g, '""')}"`,
    b.age,
    b.parent_name ? `"${b.parent_name.replace(/"/g, '""')}"` : "N/A",
    b.phone,
    b.email,
    b.skill_level,
    b.booking_date,
    b.booking_slot,
    b.status,
    b.created_at
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trial_bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// ==========================================================================
// 12. NOTIFICATION CENTER OPERATIONS
// ==========================================================================
let allProfilesCached = [];

async function initNotificationsTab() {
  const form = document.getElementById("adminNotificationForm");
  if (form) {
    form.addEventListener("submit", handleAdminSendNotification);
  }

  // Fetch and cache profiles and notifications history
  await syncAdminNotificationUsers();
  await syncAdminNotificationHistory();
}

async function syncAdminNotificationUsers() {
  const client = window.supabaseClient;
  const userSelect = document.getElementById("adminNotUser");
  if (!client || !userSelect) return;

  try {
    const { data: profiles, error } = await client
      .from("profiles")
      .select("id, name, email, role")
      .order("name", { ascending: true });

    if (error) throw error;
    allProfilesCached = profiles || [];

    userSelect.innerHTML = '<option value="">-- Choose User --</option>';
    allProfilesCached.forEach(p => {
      userSelect.innerHTML += `<option value="${p.id}">${p.name} (${p.email} - ${p.role.toUpperCase()})</option>`;
    });
  } catch (err) {
    console.error("Failed to load profiles for notifications:", err);
  }
}

function toggleAdminNotScope() {
  const scope = document.getElementById("adminNotScope").value;
  const userGroup = document.getElementById("adminNotUserGroup");
  const roleGroup = document.getElementById("adminNotRoleGroup");

  if (scope === "individual") {
    userGroup.style.display = "block";
    roleGroup.style.display = "none";
    document.getElementById("adminNotUser").required = true;
    document.getElementById("adminNotRole").required = false;
  } else if (scope === "role") {
    userGroup.style.display = "none";
    roleGroup.style.display = "block";
    document.getElementById("adminNotUser").required = false;
    document.getElementById("adminNotRole").required = true;
  } else {
    userGroup.style.display = "none";
    roleGroup.style.display = "none";
    document.getElementById("adminNotUser").required = false;
    document.getElementById("adminNotRole").required = false;
  }
}

// Bind to window to allow HTML onchange access
window.toggleAdminNotScope = toggleAdminNotScope;

async function syncAdminNotificationHistory() {
  const client = window.supabaseClient;
  const historyLog = document.getElementById("adminNotificationHistoryLog");
  if (!client || !historyLog) return;

  try {
    // Select all notifications
    const { data: notifications, error } = await client
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    historyLog.innerHTML = "";
    if (notifications && notifications.length > 0) {
      notifications.forEach(n => {
        let recipientStr = "Broadcast";
        if (n.user_id) {
          const userProf = allProfilesCached.find(p => p.id === n.user_id);
          recipientStr = userProf ? `${userProf.name} (${userProf.role.toUpperCase()})` : `User ID: ${n.user_id.substring(0, 8)}...`;
        } else if (n.metadata && n.metadata.target_role) {
          recipientStr = `Role: ${n.metadata.target_role.toUpperCase()}s`;
        }

        historyLog.innerHTML += `
          <tr>
            <td>
              <strong>${n.title}</strong>
              <div style="font-size:0.75rem; color:var(--text-grey); margin-top:2px;">${n.message}</div>
            </td>
            <td><span class="badge-status pending" style="background:rgba(255,193,7,0.15); color:#ffc107; border:1px solid rgba(255,193,7,0.3); padding:0.1rem 0.4rem; font-size:0.6rem;">${n.type.toUpperCase().replace('_', ' ')}</span></td>
            <td>${recipientStr}</td>
            <td>${new Date(n.created_at).toLocaleString()}</td>
            <td>
              <button class="btn-sm btn-cancel" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="deleteAdminNotification('${n.id}')">Delete</button>
            </td>
          </tr>
        `;
      });
    } else {
      historyLog.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-grey); padding:2rem;">No notification logs found.</td></tr>`;
    }
  } catch (err) {
    console.error("Failed to load notifications history:", err);
  }
}

async function handleAdminSendNotification(e) {
  e.preventDefault();
  const client = window.supabaseClient;
  if (!client) return;

  const title = document.getElementById("adminNotTitle").value.trim();
  const type = document.getElementById("adminNotType").value;
  const scope = document.getElementById("adminNotScope").value;
  const message = document.getElementById("adminNotMessage").value.trim();
  const actionUrl = document.getElementById("adminNotUrl").value.trim();

  if (!title || !message) {
    alert("Please fill in all mandatory fields.");
    return;
  }

  const sendBtn = document.getElementById("btnSendNotification");
  const originalText = sendBtn.textContent;
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";

  try {
    let targets = [];
    let metadata = {};

    if (scope === "individual") {
      const targetUserId = document.getElementById("adminNotUser").value;
      if (!targetUserId) {
        alert("Please select a recipient user.");
        return;
      }
      targets.push(targetUserId);
    } else if (scope === "role") {
      const targetRole = document.getElementById("adminNotRole").value;
      metadata.target_role = targetRole;
      const matching = allProfilesCached.filter(p => p.role === targetRole);
      targets = matching.map(p => p.id);
    } else {
      // Broadcast to everyone
      targets = allProfilesCached.map(p => p.id);
    }

    if (targets.length === 0) {
      alert("No matching recipient profiles found for this scope.");
      return;
    }

    // Prepare rows for bulk insert
    const insertRows = targets.map(uid => ({
      user_id: uid,
      title: title,
      message: message,
      type: type,
      status: "unread",
      is_read: false,
      channel: "push",
      action_url: actionUrl || null,
      metadata: metadata
    }));

    const { error } = await client.from("notifications").insert(insertRows);
    if (error) throw error;

    showSuccessNotification("Notification dispatched successfully!");

    // Reset Form
    e.target.reset();
    toggleAdminNotScope();

    // Reload history
    await syncAdminNotificationHistory();

  } catch (err) {
    console.error("Failed to dispatch notification:", err);
    alert("Error sending notification: " + err.message);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = originalText;
  }
}

async function deleteAdminNotification(id) {
  if (!confirm("Are you sure you want to delete this notification record?")) return;
  const client = window.supabaseClient;
  if (!client) return;

  try {
    const { error } = await client.from("notifications").delete().eq("id", id);
    if (error) throw error;

    showSuccessNotification("Notification deleted.");
    await syncAdminNotificationHistory();
  } catch (err) {
    console.error("Failed to delete notification:", err);
    alert("Error deleting notification: " + err.message);
  }
}

// Bind to window to allow HTML onclick access
window.deleteAdminNotification = deleteAdminNotification;

function showSuccessNotification(msg) {
  const banner = document.getElementById("successBanner");
  if (banner) {
    banner.textContent = msg;
    banner.classList.add("show");
    setTimeout(() => {
      banner.classList.remove("show");
    }, 3000);
  }
}

