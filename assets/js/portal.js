/* ==========================================================================
   RENEGADES SPORTS ARENA - PORTAL ENGINE
   Handles Supabase Authentication, Multi-Role Dashboards, emulated offline
   local storage database, and Canvas progress visualization.
   ========================================================================== */

// --- STATE MANAGEMENT ---
const DEFAULT_BLANK_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2FhYSI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI0Ii8+PHBhdGggZD0iTTEyIDE0Yy02LjEgMC04IDQtOCA0djJoMTZ2LTJzLTEuOS00LTgtNHoiLz48L3N2Zz4=";
let currentUser = null; // Profile object: { id, email, name, role, ... }
let isMockSession = false;
let liveCache = {
  profiles: [],
  parent_student_relations: [],
  attendance: [],
  performance_reports: [],
  certificates: [],
  session_plans: [],
  announcements: [],
  payment_history: [],
  notifications: [],
  attendance_reports: [],
  analytics: [],
  player_statistics: [],
  coach_feedback: []
};

// Emulated Database in LocalStorage (Initialized if empty)
const MOCK_DB_VERSION = "v1.3";
const DEFAULT_MOCK_DATA = {
  profiles: [
    {
      id: "player-1",
      email: "player@rsa.com",
      role: "player",
      name: "Virat Kohli",
      phone: "+91 98765 43210",
      age: 16,
      school: "RSA International School",
      bio: "Top-order batsman. Focusing on Major League Baseball hitting techniques and stance adjustments.",
      avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: "player-2",
      email: "rohit@rsa.com",
      role: "player",
      name: "Rohit Sharma",
      phone: "+91 91111 22222",
      age: 17,
      school: "Bengaluru Central College",
      bio: "Elite power hitter. Adapting baseball bat speeds for boundary-scoring leverage.",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: "parent-1",
      email: "parent@rsa.com",
      role: "parent",
      name: "Prem Kohli",
      phone: "+91 98450 12345",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: "coach-1",
      email: "coach@rsa.com",
      role: "coach",
      name: "Coach Rahul Dravid",
      phone: "+91 99000 88888",
      bio: "Head Development Coach. Ex-Professional athlete with 15+ years coaching experience.",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
    }
  ],
  parent_student_relations: [
    { parent_id: "parent-1", player_id: "player-1" },
    { parent_id: "parent-1", player_id: "player-2" }
  ],
  attendance: [
    { player_id: "player-1", date: "2026-06-01", status: "Present", marked_by: "coach-1" },
    { player_id: "player-1", date: "2026-06-04", status: "Present", marked_by: "coach-1" },
    { player_id: "player-1", date: "2026-06-08", status: "Absent", marked_by: "coach-1" },
    { player_id: "player-1", date: "2026-06-11", status: "Present", marked_by: "coach-1" },
    { player_id: "player-2", date: "2026-06-01", status: "Present", marked_by: "coach-1" },
    { player_id: "player-2", date: "2026-06-04", status: "Absent", marked_by: "coach-1" },
    { player_id: "player-2", date: "2026-06-08", status: "Present", marked_by: "coach-1" },
    { player_id: "player-2", date: "2026-06-11", status: "Present", marked_by: "coach-1" }
  ],
  performance_reports: [
    {
      player_id: "player-1",
      coach_id: "coach-1",
      batting: 9,
      bowling: 5,
      fielding: 8,
      fitness: 9,
      feedback: "Virat shows incredible batting posture and pitch selection. His MLB batting speed transition is progressing fast. Work on quick singles and back-foot stability.",
      report_date: "2026-06-12"
    },
    {
      player_id: "player-2",
      coach_id: "coach-1",
      batting: 8,
      bowling: 8,
      fielding: 7,
      fitness: 8,
      feedback: "Rohit has brilliant wrist rotation and pull shots. His pitching drills have improved overall bowling consistency. Keep building stamina.",
      report_date: "2026-06-12"
    }
  ],
  certificates: [
    {
      id: "cert-a1",
      player_id: "player-1",
      title: "MLB Development Excellence",
      badge_type: "Gold",
      date_issued: "2026-06-10",
      description: "Successfully cleared Level 1 Pitching Speed benchmarks and batting mechanics certification."
    },
    {
      id: "cert-a2",
      player_id: "player-2",
      title: "Rookie Star Achievement",
      badge_type: "Rookie",
      date_issued: "2026-06-08",
      description: "Recognized for exceptional technical improvements in ground fielding speed."
    }
  ],
  session_plans: [
    {
      id: "session-s1",
      coach_id: "coach-1",
      title: "MLB Bat Speed & Stance",
      date: "2026-06-16",
      topic: "Hitting Mechanics",
      drills: ["Warmup sprint drills", "Tee batting stance logs", "Hip torque rotation drills"]
    },
    {
      id: "session-s2",
      coach_id: "coach-1",
      title: "High Altitude Stamina Run",
      date: "2026-06-18",
      topic: "Cardiovascular Endurance",
      drills: ["1000m dash logs", "Interval shuttle run checks", "Hydration discipline talks"]
    }
  ],
  announcements: [
    {
      id: "announce-1",
      author_id: "coach-1",
      title: "Summer Camp Timings Adjusted",
      content: "Due to the heatwave forecasts, morning batches will run from 6:00 AM to 8:30 AM. Evening sessions remain 4:30 PM to 7:00 PM.",
      target_role: "all",
      created_at: "2026-06-14T10:00:00Z"
    },
    {
      id: "announce-2",
      author_id: "coach-1",
      title: "Exclusive MLB Scout Visit",
      content: "Scouts from the international pathway will observe the trial matches this Saturday. Wear official arena uniforms.",
      target_role: "player",
      created_at: "2026-06-13T09:00:00Z"
    }
  ],
  payment_history: [
    {
      id: "pay-p1",
      player_id: "player-1",
      amount: 1500,
      billing_date: "2026-06-01",
      due_date: "2026-06-15",
      status: "paid",
      invoice_number: "INV-2026-001",
      description: "Monthly training fee & turf booking"
    },
    {
      id: "pay-p2",
      player_id: "player-1",
      amount: 1500,
      billing_date: "2026-07-01",
      due_date: "2026-07-15",
      status: "pending",
      invoice_number: "INV-2026-003",
      description: "Upcoming monthly training fee"
    },
    {
      id: "pay-p3",
      player_id: "player-2",
      amount: 1500,
      billing_date: "2026-06-01",
      due_date: "2026-06-15",
      status: "overdue",
      invoice_number: "INV-2026-002",
      description: "Monthly training fee & kit charge"
    }
  ],
  notifications: [
    {
      id: "not-n1",
      user_id: "player-1",
      type: "fee_reminder",
      title: "Pending Monthly Fees Alert",
      message: "This is a friendly reminder that your monthly training fee invoice INV-2026-003 of INR 1,500 is due on 2026-07-15. Please clear it in the portal.",
      status: "unread",
      channel: "whatsapp",
      created_at: "2026-06-14T09:30:00Z"
    },
    {
      id: "not-n2",
      user_id: "player-1",
      type: "achievement_certificate",
      title: "Gold Badge Awarded",
      message: "Congratulations Virat! You have been awarded the Gold Rank Badge for MLB Development Excellence. Download your certificate in the portal.",
      status: "read",
      channel: "email",
      created_at: "2026-06-10T12:00:00Z"
    },
    {
      id: "not-n3",
      user_id: "player-2",
      type: "match_reminder",
      title: "Championship Semi-Final Fixture",
      message: "Match Reminder: RSA Renegades vs HSR Hawks is scheduled this Sunday at 8:00 AM on Turf Ground A. Be there by 7:15 AM.",
      status: "unread",
      channel: "push",
      created_at: "2026-06-14T11:00:00Z"
    }
  ],
  attendance_reports: [
    { player_id: "player-1", month: "2026-05-01", total_sessions: 12, present_sessions: 11, absent_sessions: 0, excused_sessions: 1, percentage: 91.6, remarks: "Consistent effort." },
    { player_id: "player-1", month: "2026-06-01", total_sessions: 4, present_sessions: 3, absent_sessions: 1, excused_sessions: 0, percentage: 75.0, remarks: "Missed session on 8th." },
    { player_id: "player-2", month: "2026-05-01", total_sessions: 12, present_sessions: 10, absent_sessions: 2, excused_sessions: 0, percentage: 83.3, remarks: "Satisfactory participation." },
    { player_id: "player-2", month: "2026-06-01", total_sessions: 4, present_sessions: 3, absent_sessions: 1, excused_sessions: 0, percentage: 75.0, remarks: "Missed session on 4th." }
  ],
  analytics: [
    { player_id: "player-1", sport_type: "cricket", metric_name: "batting_rating", metric_value: 9.0, timestamp: "2026-06-12" },
    { player_id: "player-1", sport_type: "cricket", metric_name: "bowling_rating", metric_value: 5.0, timestamp: "2026-06-12" },
    { player_id: "player-1", sport_type: "cricket", metric_name: "fitness_weight_kg", metric_value: 68, timestamp: "2026-06-01" },
    { player_id: "player-1", sport_type: "cricket", metric_name: "fitness_weight_kg", metric_value: 67, timestamp: "2026-06-12" },
    { player_id: "player-1", sport_type: "cricket", metric_name: "fitness_sprint_sec", metric_value: 7.2, timestamp: "2026-06-01" },
    { player_id: "player-1", sport_type: "cricket", metric_name: "fitness_sprint_sec", metric_value: 6.9, timestamp: "2026-06-12" }
  ],
  player_statistics: [
    {
      player_id: "player-1",
      sport_type: "cricket",
      matches_played: 15,
      runs_scored: 540,
      batting_average: 45.0,
      high_score: 112,
      strike_rate: 135.5,
      wickets_taken: 3,
      bowling_average: 28.3,
      best_bowling: "2/15",
      economy_rate: 5.80,
      season: "2026 Summer"
    },
    {
      player_id: "player-2",
      sport_type: "cricket",
      matches_played: 18,
      runs_scored: 620,
      batting_average: 38.8,
      high_score: 95,
      strike_rate: 142.1,
      wickets_taken: 14,
      bowling_average: 19.5,
      best_bowling: "4/20",
      economy_rate: 6.40,
      season: "2026 Summer"
    },
    {
      player_id: "player-1",
      sport_type: "baseball",
      matches_played: 8,
      runs_scored: 12,
      batting_average: 0.325,
      high_score: 3,
      pitching_era: 4.15,
      pitching_strikeouts: 18,
      pitching_innings: 21.2,
      catches: 12,
      run_outs: 2,
      season: "2026 Summer"
    },
    {
      player_id: "player-2",
      sport_type: "baseball",
      matches_played: 10,
      runs_scored: 15,
      batting_average: 0.295,
      high_score: 2,
      pitching_era: 2.80,
      pitching_strikeouts: 42,
      pitching_innings: 35.0,
      catches: 8,
      run_outs: 1,
      season: "2026 Summer"
    }
  ],
  coach_feedback: [
    {
      player_id: "player-1",
      coach_id: "coach-1",
      topic: "Stance Mechanics",
      feedback: "Needs to lower his center of gravity slightly. Bat swing speed is top tier.",
      goals_set: ["Achieve swing speed of 105 mph", "Complete 20 medicine ball drills", "Maintain 90%+ attendance rate"],
      report_date: "2026-06-12"
    },
    {
      player_id: "player-2",
      coach_id: "coach-1",
      topic: "Curveball Control",
      feedback: "Exceptional wrist snap. Need to focus on maintaining clean arm extensions.",
      goals_set: ["Throw 30 pitches in target strike zone", "Run 1500m in under 5:45 min", "Complete 10 slider drills"],
      report_date: "2026-06-12"
    }
  ]
};

// --- DATABASE INITIATION ---
function initDatabase() {
  const version = localStorage.getItem("rsa_db_version");
  if (version !== MOCK_DB_VERSION || !localStorage.getItem("rsa_db")) {
    localStorage.setItem("rsa_db", JSON.stringify(DEFAULT_MOCK_DATA));
    localStorage.setItem("rsa_db_version", MOCK_DB_VERSION);
  }
}

function getLocalDB() {
  return JSON.parse(localStorage.getItem("rsa_db"));
}

function saveLocalDB(db) {
  localStorage.setItem("rsa_db", JSON.stringify(db));
}

// --- INITIALIZE PORTAL PAGE ---
document.addEventListener("DOMContentLoaded", () => {
  initDatabase();
  initAuthListener();
  hideLoader();
  initPortalCouponVerification();

  // Register PWA Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js")
        .then(reg => console.log("PWA Service Worker registered from Portal:", reg.scope))
        .catch(err => console.error("PWA Service Worker registration from Portal failed:", err));
    });
  }

  // Handle forms
  document.getElementById("signInForm").addEventListener("submit", handleSignInSubmit);
  document.getElementById("signUpForm").addEventListener("submit", handleSignUpSubmit);
  document.getElementById("forgotForm").addEventListener("submit", handleForgotSubmit);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);

  // Player Forms
  document.getElementById("playerProfileForm").addEventListener("submit", handlePlayerProfileSave);

  const avatarFileEl = document.getElementById("playerProfAvatarFile");
  if (avatarFileEl) {
    avatarFileEl.addEventListener("change", handleAvatarFileChange);
  }

  // Header notifications panel toggle
  const bellBtn = document.getElementById("headerNotificationBell");
  const panelEl = document.getElementById("headerNotificationPanel");
  if (bellBtn && panelEl) {
    bellBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      panelEl.style.display = panelEl.style.display === "none" ? "block" : "none";
    });
    document.addEventListener("click", (e) => {
      if (!panelEl.contains(e.target) && !bellBtn.contains(e.target)) {
        panelEl.style.display = "none";
      }
    });
  }

  // Coach Forms
  document.getElementById("coachEvaluationForm").addEventListener("submit", handleCoachEvalSubmit);
  document.getElementById("coachSessionForm").addEventListener("submit", handleCoachSessionSubmit);
  document.getElementById("coachAnnouncementForm").addEventListener("submit", handleCoachAnnouncementSubmit);
  document.getElementById("coachCertificateForm").addEventListener("submit", handleCoachCertificateSubmit);
});

// --- LOADER SAFETIES ---
function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("loaded");
  }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Force reflow
  toast.offsetHeight;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// --- AUTH UI CONTROLS ---
function switchAuthTab(tab) {
  // Hide all form panels
  document.getElementById("signInFormContainer").classList.remove("active");
  document.getElementById("signUpFormContainer").classList.remove("active");
  document.getElementById("forgotFormContainer").classList.remove("active");

  const tabBtns = document.querySelectorAll(".auth-tab-btn");
  tabBtns.forEach(btn => btn.classList.remove("active"));

  if (tab === "signin") {
    document.getElementById("signInFormContainer").classList.add("active");
    tabBtns[0].classList.add("active");
  } else if (tab === "signup") {
    document.getElementById("signUpFormContainer").classList.add("active");
    tabBtns[1].classList.add("active");
  } else if (tab === "forgot") {
    document.getElementById("forgotFormContainer").classList.add("active");
  }
}

function fillDemo(email) {
  document.getElementById("loginEmail").value = email;
  document.getElementById("loginPassword").value = "password";
  showToast(`Demo filled for: ${email}. Click Sign In to load dashboard.`, "info");
}

// --- AUTH ACTION SUBMITS ---
async function handleSignInSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPassword").value;

  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing In...";

  try {
    const client = window.supabaseClient;
    if (!client) throw new Error("Supabase client is not loaded.");

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: email,
      password: pass
    });

    if (authError) throw authError;

    // Retrieve database profile record
    const { data: profile, error: profError } = await client
      .from("profiles")
      .select("*")
      .eq("user_id", authData.user.id)
      .single();

    if (profError || !profile) {
      // Create user profile on the fly if authentication passed but profile table has no entry
      const role = email.includes("coach") ? "coach" : (email.includes("parent") ? "parent" : "player");
      const defaultName = email.split("@")[0].toUpperCase();

      const newProf = {
        user_id: authData.user.id,
        email: email,
        role: role,
        name: defaultName,
        avatar_url: DEFAULT_BLANK_AVATAR
      };

      const { data: insertedProf, error: insertError } = await client
        .from("profiles")
        .insert(newProf)
        .select()
        .single();

      if (insertError) throw insertError;
      currentUser = insertedProf;
    } else {
      currentUser = profile;
    }

    isMockSession = false;
    showToast(`Logged in successfully as ${currentUser.name}!`, "success");
    loadDashboard(currentUser);

  } catch (err) {
    console.error("Live DB auth login error: ", err.message);
    showToast(`Auth Failed: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function handleSignUpSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const role = document.getElementById("registerRole").value;

  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating Account...";

  try {
    const client = window.supabaseClient;
    if (!client) throw new Error("Supabase client not initialized.");

    // Sign Up auth
    const { data: authData, error: authErr } = await client.auth.signUp({
      email,
      password
    });

    if (authErr) throw authErr;

    if (authData.user) {
      // Add profile entry
      const newProf = {
        user_id: authData.user.id,
        email: email,
        name: name,
        role: role,
        avatar_url: DEFAULT_BLANK_AVATAR
      };

      const { error: profErr } = await client
        .from("profiles")
        .insert(newProf);

      if (profErr) throw profErr;

      showToast("Registration successful! Check your email for verification.", "success");
      switchAuthTab("signin");
    }

  } catch (err) {
    console.error("Sign up failed: ", err.message);
    showToast(`Sign up failed: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function handleForgotSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("forgotEmail").value.trim();
  const client = window.supabaseClient;
  if (!client) return;

  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) throw error;
    showToast(`Password reset link dispatched to ${email}!`, "success");
    switchAuthTab("signin");
  } catch (err) {
    showToast(`Failed to send reset link: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function handleLogout() {
  const client = window.supabaseClient;
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.error("Supabase signOut error:", err);
    }
  }
  currentUser = null;
  isMockSession = false;

  // Reset visibility
  document.getElementById("authSection").style.display = "block";
  document.getElementById("playerPortal").style.display = "none";
  document.getElementById("parentPortal").style.display = "none";
  document.getElementById("coachPortal").style.display = "none";
  document.getElementById("logoutBtn").style.display = "none";

  // Hide header notification bell & clean up realtime subs
  const headerNotifContainer = document.getElementById("headerNotificationContainer");
  if (headerNotifContainer) {
    headerNotifContainer.style.display = "none";
  }
  const headerNotifPanel = document.getElementById("headerNotificationPanel");
  if (headerNotifPanel) {
    headerNotifPanel.style.display = "none";
  }
  if (window.cleanupSupabaseRealtimeSub) {
    window.cleanupSupabaseRealtimeSub();
  }

  showToast("Logged out successfully.", "info");
}

async function initAuthListener() {
  const client = window.supabaseClient;
  if (!client) return;

  // Restore session on page load
  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      const { data: profile } = await client
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      if (profile) {
        currentUser = profile;
        loadDashboard(currentUser);
      }
    }
  } catch (err) {
    console.error("Session restore failed:", err);
  }

  client.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      const newPassword = prompt("Please enter your new password (minimum 6 characters):");
      if (newPassword) {
        if (newPassword.length < 6) {
          alert("Password must be at least 6 characters.");
          return;
        }
        try {
          const { error } = await client.auth.updateUser({ password: newPassword });
          if (error) throw error;
          showToast("Password updated successfully!", "success");
        } catch (err) {
          showToast("Failed to update password: " + err.message, "error");
        }
      }
    } else if (event === "SIGNED_IN" && session?.user && !isMockSession) {
      try {
        const { data: profile } = await client
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (profile) {
          currentUser = profile;
          loadDashboard(currentUser);
        }
      } catch (e) {
        console.warn("Auth Listener Profile Bind Failed: ", e);
      }
    } else if (event === "SIGNED_OUT") {
      currentUser = null;
      document.getElementById("authSection").style.display = "block";
      document.getElementById("playerPortal").style.display = "none";
      document.getElementById("parentPortal").style.display = "none";
      document.getElementById("coachPortal").style.display = "none";
      document.getElementById("logoutBtn").style.display = "none";
    }
  });
}

// --- SWITCH DASHBOARD TABS ---
function switchTab(role, tabId) {
  // Select active dashboard container
  const parentContainer = document.getElementById(`${role}Portal`);
  if (!parentContainer) return;

  // Switch menus
  const menuButtons = parentContainer.querySelectorAll(".portal-menu-item");
  menuButtons.forEach(btn => {
    btn.classList.remove("active");
    // Simple text match to highlight correct menu button
    const btnText = btn.textContent.toLowerCase();
    if (btnText.includes(tabId)) {
      btn.classList.add("active");
    }
  });

  // Switch panels
  const panes = parentContainer.querySelectorAll(".tab-pane");
  panes.forEach(pane => {
    pane.classList.remove("active");
    if (pane.id === `${role}-tab-${tabId}`) {
      pane.classList.add("active");
    }
  });

  // Render visualizations specifically
  if (role === "player" && tabId === "performance") {
    renderPlayerSkillsChart(currentUser.id);
    renderFitnessChart("playerFitnessChart", currentUser.id);
    renderAttendanceChart("playerAttendanceChart", currentUser.id);
    updatePlayerComparison();
    syncSportStatsView("player", "cricket");
  } else if (role === "parent" && tabId === "analytics") {
    const studentSelect = document.getElementById("parentStudentSelector");
    if (studentSelect && studentSelect.value) {
      renderParentSkillsChart(studentSelect.value);
      renderFitnessChart("parentFitnessChart", studentSelect.value);
      renderAttendanceChart("parentAttendanceChart", studentSelect.value);
      updateParentComparison();
      syncSportStatsView("parent", "cricket");
    }
  } else if (role === "player" && tabId === "notifications") {
    syncNotificationsList("player", currentUser.id);
  } else if (role === "parent" && tabId === "notifications") {
    syncNotificationsList("parent", currentUser.id); // Parent profile notification alerts
  } else if (role === "coach" && tabId === "teamstats") {
    renderCoachTeamStatsChart();
    syncCoachTournamentStats();
  }
}

// --- LOAD ROLES DASHBOARD ---
async function loadDashboard(profile) {
  // Hide Auth section, show logout button
  document.getElementById("authSection").style.display = "none";
  document.getElementById("logoutBtn").style.display = "block";

  // Request browser push notification permissions on load
  if (window.PushNotificationService) {
    window.PushNotificationService.requestPermission();
  }
  if (!isMockSession && window.initSupabaseRealtimeSub) {
    window.initSupabaseRealtimeSub();
  }

  // Show header notification bell
  const headerNotifContainer = document.getElementById("headerNotificationContainer");
  if (headerNotifContainer) {
    headerNotifContainer.style.display = "block";
    syncHeaderNotifications(profile.id, profile.role);
  }

  if (profile.role === "player") {
    document.getElementById("playerPortal").style.display = "block";
    // Bind Mini Card info
    const avatarUrl = profile.avatar_url || DEFAULT_BLANK_AVATAR;
    document.getElementById("playerAvatar").src = avatarUrl;
    document.getElementById("playerName").textContent = profile.name;

    // Fill Profiles Form
    document.getElementById("playerProfName").value = profile.name;
    document.getElementById("playerProfPhone").value = profile.phone || "";
    document.getElementById("playerProfAge").value = profile.age || "";
    document.getElementById("playerProfSchool").value = profile.school || "";
    document.getElementById("playerProfAvatar").value = avatarUrl;
    const preview = document.getElementById("playerProfAvatarPreview");
    if (preview) {
      preview.src = avatarUrl;
    }
    document.getElementById("playerProfBio").value = profile.bio || "";

    // Sync other tabs
    await syncPlayerDashboardData(profile.id);
    switchTab("player", "overview");

  } else if (profile.role === "parent") {
    document.getElementById("parentPortal").style.display = "block";
    document.getElementById("parentAvatar").src = profile.avatar_url || DEFAULT_BLANK_AVATAR;
    document.getElementById("parentName").textContent = profile.name;

    await syncParentDashboardData(profile.id);
    switchTab("parent", "dashboard");

  } else if (profile.role === "coach") {
    document.getElementById("coachPortal").style.display = "block";
    document.getElementById("coachAvatar").src = profile.avatar_url || DEFAULT_BLANK_AVATAR;
    document.getElementById("coachName").textContent = profile.name;

    await syncCoachDashboardData();
    switchTab("coach", "students");
  }
}

// ==========================================================================
// A. PLAYER PORTAL DATA HANDLERS
// ==========================================================================
async function syncPlayerDashboardData(playerId) {
  let profile = currentUser;
  let playerAttendance = [];
  let performance = null;
  let invoices = [];
  let roleAnnouncements = [];
  let playerCerts = [];
  let feedbackRecord = null;
  let attReport = null;
  let coaches = [];

  if (isMockSession) {
    let db = getLocalDB();
    profile = db.profiles.find(p => p.id === playerId) || currentUser;
    playerAttendance = db.attendance.filter(a => a.player_id === playerId);
    performance = db.performance_reports.find(p => p.player_id === playerId);
    invoices = db.payment_history.filter(p => p.player_id === playerId);
    roleAnnouncements = db.announcements.filter(a => a.target_role === "all" || a.target_role === "player");
    playerCerts = db.certificates.filter(c => c.player_id === playerId);
    feedbackRecord = db.coach_feedback.find(f => f.player_id === playerId);
    attReport = db.attendance_reports.find(r => r.player_id === playerId && r.month === "2026-06-01");
    coaches = db.profiles.filter(p => p.role === "coach");
  } else {
    try {
      const client = window.supabaseClient;
      const [
        { data: profData },
        { data: attData },
        { data: perfData },
        { data: invData },
        { data: annData },
        { data: certData },
        { data: fbData },
        { data: arData },
        { data: coachData },
        { data: analyticsData },
        { data: statsData }
      ] = await Promise.all([
        client.from("profiles").select("*").eq("id", playerId).maybeSingle(),
        client.from("attendance").select("*").eq("player_id", playerId),
        client.from("performance_reports").select("*").eq("player_id", playerId),
        client.from("payment_history").select("*").eq("player_id", playerId),
        client.from("announcements").select("*").or("target_role.eq.all,target_role.eq.player").order("created_at", { ascending: false }),
        client.from("certificates").select("*").eq("player_id", playerId),
        client.from("coach_feedback").select("*").eq("player_id", playerId),
        client.from("attendance_reports").select("*").eq("player_id", playerId).eq("month", "2026-06-01"),
        client.from("profiles").select("*").eq("role", "coach"),
        client.from("analytics").select("*").eq("player_id", playerId),
        client.from("player_statistics").select("*").eq("player_id", playerId)
      ]);

      if (profData) profile = profData;
      playerAttendance = attData || [];
      performance = perfData && perfData.length > 0 ? perfData[0] : null;
      invoices = invData || [];
      roleAnnouncements = annData || [];
      playerCerts = certData || [];
      feedbackRecord = fbData && fbData.length > 0 ? fbData[0] : null;
      attReport = arData && arData.length > 0 ? arData[0] : null;
      coaches = coachData || [];

      // Update liveCache
      liveCache.profiles = [profile, ...coaches];
      liveCache.attendance = playerAttendance;
      liveCache.performance_reports = perfData || [];
      liveCache.payment_history = invoices;
      liveCache.announcements = roleAnnouncements;
      liveCache.certificates = playerCerts;
      liveCache.coach_feedback = fbData || [];
      liveCache.attendance_reports = arData || [];
      liveCache.analytics = analyticsData || [];
      liveCache.player_statistics = statsData || [];
    } catch (err) {
      console.error("Error fetching live player dashboard data:", err);
      showToast("Error loading dashboard data from live database.", "error");
    }
  }

  // Attendance Calculations
  const presentCount = playerAttendance.filter(a => a.status === "Present").length;
  const presenceRate = playerAttendance.length > 0 ? Math.round((presentCount / playerAttendance.length) * 100) : 0;
  document.getElementById("playerAttendanceRate").textContent = `${presenceRate}%`;

  // Skill assessments calculations
  let skillAverage = 0;
  if (performance) {
    skillAverage = ((performance.batting + performance.bowling + performance.fielding + performance.fitness) / 4).toFixed(1);
    document.getElementById("playerSkillIndex").textContent = `${skillAverage} / 10`;
  } else {
    document.getElementById("playerSkillIndex").textContent = "N/A";
  }

  // Fees billing outstanding calculation
  const pendingFees = invoices.filter(p => p.status === "pending" || p.status === "overdue");
  const feesTotal = pendingFees.reduce((acc, current) => acc + Number(current.amount), 0);

  const statusElement = document.getElementById("playerFeesStatus");
  const subtextElement = document.getElementById("playerFeesSubtext");
  if (feesTotal > 0) {
    statusElement.textContent = `₹${feesTotal}`;
    statusElement.style.color = "var(--accent-primary)";
    subtextElement.textContent = `${pendingFees.length} Pending Invoices`;
  } else {
    statusElement.textContent = "Paid ✓";
    statusElement.style.color = "#10B981";
    subtextElement.textContent = "No outstanding dues";
  }

  // Latest announcements mapping
  const latestAnnounce = roleAnnouncements[0];
  const announceBox = document.getElementById("playerAnnouncement");
  if (latestAnnounce) {
    announceBox.innerHTML = `
      <h4 style="color:#fff;">${latestAnnounce.title}</h4>
      <p class="text-secondary mt-1" style="font-size:0.9rem;">${latestAnnounce.content}</p>
      <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-top:8px;">Broadcasted on: ${new Date(latestAnnounce.created_at).toLocaleDateString()}</span>
    `;
  } else {
    announceBox.innerHTML = `<p class="text-muted">No new announcements at this time.</p>`;
  }

  // Sync Attendance Table
  const attendanceLog = document.getElementById("playerAttendanceLog");
  attendanceLog.innerHTML = "";
  if (playerAttendance.length > 0) {
    playerAttendance.forEach(a => {
      const coach = coaches.find(p => p.id === a.marked_by) || { name: "Coach" };
      attendanceLog.innerHTML += `
        <tr>
          <td><strong>${a.date}</strong></td>
          <td>Training Session Class</td>
          <td><span class="badge-status ${a.status.toLowerCase()}">${a.status}</span></td>
          <td>${coach.name}</td>
        </tr>
      `;
    });
  } else {
    attendanceLog.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No attendance logs available.</td></tr>`;
  }

  // Sync Certificates Badges
  const certsGrid = document.getElementById("playerCertificatesGrid");
  certsGrid.innerHTML = "";
  if (playerCerts.length > 0) {
    playerCerts.forEach(c => {
      certsGrid.innerHTML += `
        <div class="badge-item-card glass-card" onclick="openCertificateModal('${c.id}')">
          <div class="badge-icon-shield">🏆</div>
          <h4 class="badge-title-award">${c.title}</h4>
          <span class="badge-rank-text rank-${c.badge_type.toLowerCase()}">${c.badge_type} Rank Badge</span>
          <p class="text-muted mt-2" style="font-size:0.75rem;">Issued: ${c.date_issued}</p>
        </div>
      `;
    });
  } else {
    certsGrid.innerHTML = `<div class="w-100 text-center text-muted p-4">No certificates awarded yet. Keep training hard to earn credentials!</div>`;
  }

  // Sync Payments Tab Invoices Table
  const paymentsLog = document.getElementById("playerPaymentsLog");
  paymentsLog.innerHTML = "";
  if (invoices.length > 0) {
    invoices.forEach(inv => {
      const isPending = inv.status !== "paid";
      const actionButton = isPending
        ? `<button class="btn btn-outline-orange btn-sm" onclick="openPaymentModal('${inv.id}', ${inv.amount})">Pay Now</button>`
        : `<span style="color:#10B981; font-weight:700;">Complete ✓</span>`;

      paymentsLog.innerHTML += `
        <tr>
          <td><strong>${inv.invoice_number}</strong></td>
          <td>${inv.description}</td>
          <td>₹${inv.amount}</td>
          <td>${inv.due_date}</td>
          <td><span class="badge-status ${inv.status}">${inv.status}</span></td>
          <td>${actionButton}</td>
        </tr>
      `;
    });
  } else {
    paymentsLog.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No billing invoices found.</td></tr>`;
  }

  // Sync Skills Evaluator breakdown items
  const skillsBreakdown = document.getElementById("playerSkillsBreakdown");
  skillsBreakdown.innerHTML = "";
  const critiqueText = document.getElementById("playerCoachCritique");

  if (performance) {
    const skills = [
      { name: "Batting & Hitting", val: performance.batting },
      { name: "Bowling & Pitching", val: performance.bowling },
      { name: "Fielding speed", val: performance.fielding },
      { name: "Fitness & Endurance", val: performance.fitness }
    ];

    skills.forEach(s => {
      skillsBreakdown.innerHTML += `
        <div class="skill-bar-item">
          <div class="skill-bar-header">
            <span>${s.name}</span>
            <span>${s.val} / 10</span>
          </div>
          <div class="skill-bar-track">
            <div class="skill-bar-fill" style="width: ${s.val * 10}%;"></div>
          </div>
        </div>
      `;
    });

    critiqueText.textContent = performance.feedback || "Work hard on basic pitching grip and batting positions.";
  } else {
    skillsBreakdown.innerHTML = `<p class="text-muted text-center">No evaluations posted. Skills are rated 0 by default.</p>`;
    critiqueText.textContent = "Your coach will log critiques and skill progress logs shortly.";
  }

  // Sync Cricket and Baseball Stats profiles
  await syncSportStatsView("player", "cricket");

  // Sync Goal Tracker Checklist
  const goalsContainer = document.getElementById("playerGoalsList");
  goalsContainer.innerHTML = "";

  if (feedbackRecord && feedbackRecord.goals_set.length > 0) {
    feedbackRecord.goals_set.forEach((goal, i) => {
      const isCompleted = feedbackRecord.goals_completed ? feedbackRecord.goals_completed.includes(i) : (i === 2);
      goalsContainer.innerHTML += `
        <div class="goal-item">
          <div class="goal-desc-box">
            <input type="checkbox" id="pGoalCheck-${i}" ${isCompleted ? "checked" : ""} onchange="toggleGoalCompletion('${playerId}', ${i}, this.checked)">
            <label for="pGoalCheck-${i}" style="${isCompleted ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${goal}</label>
          </div>
          <span class="goal-status-badge ${isCompleted ? 'goal-completed' : 'goal-pending'}">${isCompleted ? 'Done' : 'Active'}</span>
        </div>
      `;
    });
  } else {
    goalsContainer.innerHTML = `<p class="text-center text-muted">No goal challenges assigned by coach. Contact coach Dravid.</p>`;
  }

  // Sync Monthly Development Reports Summary block
  const devReportBox = document.getElementById("playerDevelopmentReportBox");
  const presencePercentage = attReport ? attReport.percentage : presenceRate;

  devReportBox.innerHTML = `
    <div class="report-header-block">
      <h4 style="color:#fff;">Monthly Developmental Report - June 2026</h4>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Published on: 2026-06-12 | By Coach Rahul Dravid</p>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
      <span class="report-metric-pill">Attendance Rate: ${presencePercentage}%</span>
      <span class="report-metric-pill">Skill Rating index: ${skillAverage}/10</span>
      <span class="report-metric-pill">Fee Billing: ${feesTotal > 0 ? 'Dues Pending' : 'Settled'}</span>
    </div>
    <p style="color:var(--text-secondary); margin-bottom:0.5rem;"><strong>Technical Assessment Critique:</strong> ${performance ? performance.feedback : 'No critiques logged yet.'}</p>
    <p style="color:var(--text-secondary);"><strong>Target Milestones Assigned:</strong> ${feedbackRecord ? feedbackRecord.goals_set.join(", ") : 'No targets logged yet.'}</p>
  `;

  // Set Dynamic Greeting
  const hour = new Date().getHours();
  let greet = "Welcome Back";
  if (hour < 12) greet = "Good morning";
  else if (hour < 17) greet = "Good afternoon";
  else greet = "Good evening";
  const welcomeTitle = document.querySelector(".dashboard-banner h2");
  if (welcomeTitle) {
    welcomeTitle.innerHTML = `${greet}, <span class="player-name-placeholder">${profile.name}</span>!`;
  }

  // Re-display player placeholders
  const namePlaceholders = document.querySelectorAll(".player-name-placeholder");
  namePlaceholders.forEach(ph => ph.textContent = profile.name);

  // Initialize digital ID card and leaderboards
  initPlayerIdCard(profile);
  initLeaderboard();

  // Sync Notifications count and badge
  await updateUnreadNotificationsBadge("player", playerId);
}

// --- CANVAS RADAR PLOT FOR TECHNICAL SKILLS ---
function renderPlayerSkillsChart(playerId) {
  const canvas = document.getElementById("playerSkillsChart");
  if (!canvas) return;

  const db = isMockSession ? getLocalDB() : liveCache;
  const performance = db.performance_reports.find(p => p.player_id === playerId) || {
    batting: 5, bowling: 5, fielding: 5, fitness: 5
  };

  const scores = [performance.batting, performance.bowling, performance.fielding, performance.fitness];
  const labels = ["Batting", "Bowling", "Fielding", "Fitness"];

  drawRadarChart(canvas, scores, labels);
}

function drawRadarChart(canvas, scores, labels) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const maxVal = 10;
  const radius = Math.min(cx, cy) - 35;
  const numAxes = scores.length;

  // 1. Draw web backgrounds grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let grid = 1; grid <= 4; grid++) {
    const gridRadius = (radius / 4) * grid;
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * gridRadius;
      const y = cy + Math.sin(angle) * gridRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 2. Draw axes lines
  for (let i = 0; i < numAxes; i++) {
    const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
    const ax = cx + Math.cos(angle) * radius;
    const ay = cy + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // Draw Labels
    ctx.fillStyle = "#A3A3A3";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    const labelX = cx + Math.cos(angle) * (radius + 20);
    const labelY = cy + Math.sin(angle) * (radius + 15);
    ctx.fillText(labels[i], labelX, labelY);
  }

  // 3. Plot player scores polygon
  ctx.beginPath();
  for (let i = 0; i < numAxes; i++) {
    const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
    const scoreRad = (radius / maxVal) * scores[i];
    const px = cx + Math.cos(angle) * scoreRad;
    const py = cy + Math.sin(angle) * scoreRad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 107, 0, 0.35)";
  ctx.fill();
  ctx.strokeStyle = "var(--accent-primary)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // 4. Highlight score points
  for (let i = 0; i < numAxes; i++) {
    const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
    const scoreRad = (radius / maxVal) * scores[i];
    const px = cx + Math.cos(angle) * scoreRad;
    const py = cy + Math.sin(angle) * scoreRad;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- SAVE PLAYER PROFILE ROUTINES ---
async function handlePlayerProfileSave(e) {
  e.preventDefault();
  const name = document.getElementById("playerProfName").value.trim();
  const phone = document.getElementById("playerProfPhone").value.trim();
  const age = document.getElementById("playerProfAge").value;
  const school = document.getElementById("playerProfSchool").value.trim();
  const avatar = document.getElementById("playerProfAvatar").value.trim();
  const bio = document.getElementById("playerProfBio").value.trim();

  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      if (!client) throw new Error("Supabase client is not loaded.");

      const { data, error } = await client
        .from("profiles")
        .update({
          name: name,
          phone: phone,
          age: age ? Number(age) : null,
          school: school,
          avatar_url: avatar,
          bio: bio
        })
        .eq("id", currentUser.id)
        .select()
        .single();

      if (error) throw error;
      currentUser = data;
      showToast("Profile details updated successfully!", "success");
      loadDashboard(currentUser);
    } catch (err) {
      console.error("Error saving profile:", err);
      showToast("Error updating profile: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  } else {
    try {
      let db = getLocalDB();
      const index = db.profiles.findIndex(p => p.id === currentUser.id);
      if (index !== -1) {
        db.profiles[index].name = name;
        db.profiles[index].phone = phone;
        db.profiles[index].age = age ? Number(age) : null;
        db.profiles[index].school = school;
        db.profiles[index].avatar_url = avatar;
        db.profiles[index].bio = bio;

        saveLocalDB(db);
        currentUser = db.profiles[index];
        showToast("Profile details updated successfully!", "success");
        loadDashboard(currentUser);
      }
    } catch (err) {
      console.error("Error saving mock profile:", err);
      showToast("Error updating mock profile.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

// --- PROFILE AVATAR UPLOAD ROUTINES ---
function updateAvatarUI(url) {
  const preview = document.getElementById("playerProfAvatarPreview");
  if (preview) preview.src = url;

  const hiddenInput = document.getElementById("playerProfAvatar");
  if (hiddenInput) hiddenInput.value = url;

  const playerAvatar = document.getElementById("playerAvatar");
  if (playerAvatar) playerAvatar.src = url;
}

async function deleteAvatarFromStorage(url) {
  if (!url || url.startsWith("data:image")) return;
  const client = window.supabaseClient;
  if (!client) return;

  try {
    const bucketMarker = "/storage/v1/object/public/avatars/";
    const markerIndex = url.indexOf(bucketMarker);
    if (markerIndex !== -1) {
      const filePath = decodeURIComponent(url.substring(markerIndex + bucketMarker.length));
      await client.storage.from('avatars').remove([filePath]);
    }
  } catch (err) {
    console.error("Failed to delete avatar from storage:", err);
  }
}

async function handleAvatarUpload(file) {
  const client = window.supabaseClient;
  if (!client) throw new Error("Supabase client is not loaded.");

  // Client-side validations
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("File size exceeds 2MB limit.");
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `avatar-${Date.now()}.${fileExt}`;
  const filePath = `${currentUser.id}/${fileName}`;

  const { data, error } = await client.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = client.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return { publicUrl };
}

async function handleAvatarFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const btnChoose = document.querySelector("button[onclick*='playerProfAvatarFile']");
  const originalText = btnChoose.textContent;
  btnChoose.disabled = true;
  btnChoose.textContent = "Uploading...";

  try {
    // Clean up old avatar from storage if not default
    if (currentUser.avatar_url && currentUser.avatar_url !== DEFAULT_BLANK_AVATAR) {
      await deleteAvatarFromStorage(currentUser.avatar_url);
    }

    const { publicUrl } = await handleAvatarUpload(file);

    // Save directly to profiles
    const client = window.supabaseClient;
    const { data, error } = await client
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", currentUser.id)
      .select()
      .single();

    if (error) throw error;
    currentUser = data;

    updateAvatarUI(publicUrl);
    showToast("Profile picture updated successfully!", "success");
  } catch (err) {
    console.error("Avatar change error:", err);
    showToast("Upload failed: " + err.message, "error");
  } finally {
    btnChoose.disabled = false;
    btnChoose.textContent = originalText;
    e.target.value = "";
  }
}

async function handleDeleteAvatar() {
  if (!currentUser) return;
  if (currentUser.avatar_url === DEFAULT_BLANK_AVATAR) {
    showToast("Profile is already using the default avatar.", "info");
    return;
  }

  if (!confirm("Are you sure you want to delete your profile picture?")) return;

  const btnDelete = document.getElementById("btnDeleteAvatar");
  const originalText = btnDelete.textContent;
  btnDelete.disabled = true;
  btnDelete.textContent = "Deleting...";

  try {
    await deleteAvatarFromStorage(currentUser.avatar_url);

    const client = window.supabaseClient;
    const { data, error } = await client
      .from("profiles")
      .update({ avatar_url: DEFAULT_BLANK_AVATAR })
      .eq("id", currentUser.id)
      .select()
      .single();

    if (error) throw error;
    currentUser = data;

    updateAvatarUI(DEFAULT_BLANK_AVATAR);
    showToast("Profile picture deleted successfully.", "success");
  } catch (err) {
    console.error("Error deleting avatar:", err);
    showToast("Delete failed: " + err.message, "error");
  } finally {
    btnDelete.disabled = false;
    btnDelete.textContent = originalText;
  }
}


// ==========================================================================
// B. PARENT DASHBOARD DATA HANDLERS
// ==========================================================================
async function syncParentDashboardData(parentId) {
  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      // Fetch relations first
      const { data: rels, error: relError } = await client
        .from("parent_student_relations")
        .select("*")
        .eq("parent_id", parentId);

      if (relError) throw relError;

      const studentIds = (rels || []).map(r => r.player_id);

      let students = [];
      if (studentIds.length > 0) {
        const { data: studs, error: studError } = await client
          .from("profiles")
          .select("*")
          .in("id", studentIds);
        if (studError) throw studError;
        students = studs || [];
      }

      // Fetch parent announcements
      const { data: annData, error: annError } = await client
        .from("announcements")
        .select("*")
        .or("target_role.eq.all,target_role.eq.parent")
        .order("created_at", { ascending: false });

      if (annError) throw annError;

      liveCache.parent_student_relations = rels || [];
      liveCache.profiles = students || [];
      liveCache.announcements = annData || [];
    } catch (err) {
      console.error("Error loading live parent dashboard data:", err);
      showToast("Error loading parent dashboard data from live database.", "error");
    }
  }

  const db = isMockSession ? getLocalDB() : liveCache;

  // Find linked children
  const relations = db.parent_student_relations.filter(r => r.parent_id === parentId);
  const studentSelector = document.getElementById("parentStudentSelector");
  studentSelector.innerHTML = "";

  if (relations.length > 0) {
    relations.forEach(rel => {
      const student = db.profiles.find(p => p.id === rel.player_id);
      if (student) {
        studentSelector.innerHTML += `<option value="${student.id}">${student.name}</option>`;
      }
    });

    // Populate announcements notices target
    const parentAnnounces = db.announcements.filter(a => a.target_role === "all" || a.target_role === "parent");
    const parentAnnounceList = document.getElementById("parentAnnouncementsList");
    parentAnnounceList.innerHTML = "";
    if (parentAnnounces.length > 0) {
      parentAnnounces.forEach(a => {
        parentAnnounceList.innerHTML += `
          <div class="announcement-item mt-3 p-3 bg-dark rounded border-left-orange">
            <h4 style="color:#fff; font-size:1rem;">${a.title}</h4>
            <p class="text-secondary mt-1" style="font-size:0.85rem;">${a.content}</p>
            <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-top:6px;">Date: ${new Date(a.created_at).toLocaleDateString()}</span>
          </div>
        `;
      });
    } else {
      parentAnnounceList.innerHTML = `<p class="text-muted">No notice broadcasts logged.</p>`;
    }

    // Trigger initial select change load
    await parentSelectStudent();
  } else {
    studentSelector.innerHTML = `<option value="">No Linked Children Found</option>`;
    document.getElementById("parentAnnouncementsList").innerHTML = `<p class="text-muted">No child records associated with this parent email.</p>`;
  }
}

async function parentSelectStudent() {
  const studentId = document.getElementById("parentStudentSelector").value;
  if (!studentId) return;

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const [
        { data: childProf },
        { data: attData },
        { data: perfData },
        { data: invData },
        { data: certData },
        { data: fbData },
        { data: arData },
        { data: coachData },
        { data: analyticsData },
        { data: statsData }
      ] = await Promise.all([
        client.from("profiles").select("*").eq("id", studentId).maybeSingle(),
        client.from("attendance").select("*").eq("player_id", studentId),
        client.from("performance_reports").select("*").eq("player_id", studentId),
        client.from("payment_history").select("*").eq("player_id", studentId),
        client.from("certificates").select("*").eq("player_id", studentId),
        client.from("coach_feedback").select("*").eq("player_id", studentId),
        client.from("attendance_reports").select("*").eq("player_id", studentId).eq("month", "2026-06-01"),
        client.from("profiles").select("*").eq("role", "coach"),
        client.from("analytics").select("*").eq("player_id", studentId),
        client.from("player_statistics").select("*").eq("player_id", studentId)
      ]);

      liveCache.profiles = (liveCache.profiles || []).filter(p => p.id !== studentId).concat(childProf ? [childProf] : []).concat(coachData || []);
      liveCache.attendance = attData || [];
      liveCache.performance_reports = perfData || [];
      liveCache.payment_history = invData || [];
      liveCache.certificates = certData || [];
      liveCache.coach_feedback = fbData || [];
      liveCache.attendance_reports = arData || [];
      liveCache.analytics = analyticsData || [];
      liveCache.player_statistics = statsData || [];
    } catch (err) {
      console.error("Error fetching child live data from Supabase:", err);
      showToast("Error loading child data from Supabase", "error");
    }
  }

  const db = isMockSession ? getLocalDB() : liveCache;
  const child = db.profiles.find(p => p.id === studentId);
  if (!child) return;

  // 1. Child presence calculation
  const attendance = db.attendance.filter(a => a.player_id === studentId);
  const presentCount = attendance.filter(a => a.status === "Present").length;
  const presenceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  document.getElementById("parentAttendanceRate").textContent = `${presenceRate}%`;

  // 2. Child evaluation skill rating average
  const performance = db.performance_reports.find(p => p.player_id === studentId);
  let skillAverage = 0;
  if (performance) {
    skillAverage = ((performance.batting + performance.bowling + performance.fielding + performance.fitness) / 4).toFixed(1);
    document.getElementById("parentChildRating").textContent = `${skillAverage} / 10`;
    document.getElementById("parentCoachFeedback").textContent = performance.feedback || "Doing great! Practice batting alignments regularly.";
  } else {
    document.getElementById("parentChildRating").textContent = "N/A";
    document.getElementById("parentCoachFeedback").textContent = "No feedback notes logged by coach yet.";
  }

  // 3. Child outstanding fee invoices
  const invoices = db.payment_history.filter(p => p.player_id === studentId);
  const pendingInvoices = invoices.filter(inv => inv.status === "pending" || inv.status === "overdue");
  const feesTotal = pendingInvoices.reduce((acc, c) => acc + Number(c.amount), 0);
  document.getElementById("parentFeesValue").textContent = `₹${feesTotal}`;
  const label = document.getElementById("parentFeesLabel");
  if (feesTotal > 0) {
    label.textContent = `${pendingInvoices.length} Pending Bills`;
    label.style.color = "var(--accent-primary)";
  } else {
    label.textContent = "All invoices settled";
    label.style.color = "#10B981";
  }

  // 4. Attendance Table sync
  const attendanceTable = document.getElementById("parentAttendanceLog");
  attendanceTable.innerHTML = "";
  if (attendance.length > 0) {
    attendance.forEach(a => {
      const coach = db.profiles.find(p => p.id === a.marked_by) || { name: "Coach" };
      attendanceTable.innerHTML += `
        <tr>
          <td><strong>${a.date}</strong></td>
          <td>Training Session Class</td>
          <td><span class="badge-status ${a.status.toLowerCase()}">${a.status}</span></td>
          <td>${coach.name}</td>
        </tr>
      `;
    });
  } else {
    attendanceTable.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No attendance logs available for this child.</td></tr>`;
  }

  // 5. Invoices payments log sync
  const paymentTable = document.getElementById("parentPaymentsLog");
  paymentTable.innerHTML = "";
  if (invoices.length > 0) {
    invoices.forEach(inv => {
      const isPending = inv.status !== "paid";
      const actionButton = isPending
        ? `<button class="btn btn-outline-orange btn-sm" onclick="openPaymentModal('${inv.id}', ${inv.amount})">Pay Now</button>`
        : `<span style="color:#10B981; font-weight:700;">Complete ✓</span>`;

      paymentTable.innerHTML += `
        <tr>
          <td><strong>${inv.invoice_number}</strong></td>
          <td>${inv.billing_date}</td>
          <td>₹${inv.amount}</td>
          <td><span class="badge-status ${inv.status}">${inv.status}</span></td>
          <td>${actionButton}</td>
        </tr>
      `;
    });
  } else {
    paymentTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No billing logs for this child.</td></tr>`;
  }

  // 6. Certificates List with download triggers
  const childCerts = db.certificates.filter(c => c.player_id === studentId);
  const parentCertsLog = document.getElementById("parentCertificatesLog");
  parentCertsLog.innerHTML = "";
  if (childCerts.length > 0) {
    childCerts.forEach(c => {
      parentCertsLog.innerHTML += `
        <tr>
          <td><strong>${c.title}</strong></td>
          <td><span class="rank-${c.badge_type.toLowerCase()}" style="font-weight:bold;">${c.badge_type} Badge</span></td>
          <td>${c.date_issued}</td>
          <td><button class="btn btn-outline-orange btn-sm" onclick="openCertificateModal('${c.id}')">View & Print</button></td>
        </tr>
      `;
    });
  } else {
    parentCertsLog.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No certificates issued yet.</td></tr>`;
  }

  // 7. Goals checklist milestones logs for child
  const parentGoalsList = document.getElementById("parentGoalsList");
  parentGoalsList.innerHTML = "";
  const feedbackRecord = db.coach_feedback.find(f => f.player_id === studentId);
  if (feedbackRecord && feedbackRecord.goals_set.length > 0) {
    feedbackRecord.goals_set.forEach((goal, idx) => {
      const isCompleted = feedbackRecord.goals_completed ? feedbackRecord.goals_completed.includes(idx) : (idx === 2);
      parentGoalsList.innerHTML += `
        <div class="goal-item">
          <div class="goal-desc-box">
            <span style="font-size:1.1rem; color:${isCompleted ? '#10B981' : 'var(--accent-primary)'};">${isCompleted ? '✓' : '🎯'}</span>
            <label style="${isCompleted ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${goal}</label>
          </div>
          <span class="goal-status-badge ${isCompleted ? 'goal-completed' : 'goal-pending'}">${isCompleted ? 'Completed' : 'Active'}</span>
        </div>
      `;
    });
  } else {
    parentGoalsList.innerHTML = `<p class="text-muted text-center">No goal challenges logged for your child.</p>`;
  }

  // 8. Developmental Report summaries
  const parentDevBox = document.getElementById("parentDevelopmentReportBox");
  const attReport = db.attendance_reports.find(r => r.player_id === studentId && r.month === "2026-06-01");
  const presencePercentage = attReport ? attReport.percentage : presenceRate;

  parentDevBox.innerHTML = `
    <div class="report-header-block">
      <h4 style="color:#fff;">Monthly Development Report Summary - June 2026</h4>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Issued on: 2026-06-12 | By Coach Rahul Dravid</p>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
      <span class="report-metric-pill">Presence Rating: ${presencePercentage}%</span>
      <span class="report-metric-pill">Average Assessment: ${skillAverage}/10</span>
      <span class="report-metric-pill">Invoices Due: ${feesTotal > 0 ? '₹' + feesTotal : 'Settled'}</span>
    </div>
    <p style="color:var(--text-secondary); margin-bottom:0.5rem;"><strong>Coaching Critique Note:</strong> ${performance ? performance.feedback : 'No technical evaluation critiques logged yet.'}</p>
    <p style="color:var(--text-secondary);"><strong>Goals Assigned:</strong> ${feedbackRecord ? feedbackRecord.goals_set.join(" | ") : 'None'}</p>
  `;

  // Draw parent canvases
  renderParentSkillsChart(studentId);
  renderFitnessChart("parentFitnessChart", studentId);
  renderAttendanceChart("parentAttendanceChart", studentId);
  updateParentComparison();
  syncSportStatsView("parent", "cricket");

  // Sync Notifications count and badge
  await updateUnreadNotificationsBadge("parent", currentUser.id);
}

function renderParentSkillsChart(studentId) {
  const canvas = document.getElementById("parentSkillsChart");
  if (!canvas) return;

  const db = isMockSession ? getLocalDB() : liveCache;
  const performance = db.performance_reports.find(p => p.player_id === studentId) || {
    batting: 5, bowling: 5, fielding: 5, fitness: 5
  };

  const scores = [performance.batting, performance.bowling, performance.fielding, performance.fitness];
  const labels = ["Batting", "Bowling", "Fielding", "Fitness"];

  // Render text-based breakdown list
  const breakdown = document.getElementById("parentSkillsBreakdown");
  breakdown.innerHTML = "";
  const skillsList = [
    { name: "Batting & Hitting", val: performance.batting },
    { name: "Bowling & Pitching", val: performance.bowling },
    { name: "Fielding speed", val: performance.fielding },
    { name: "Fitness & Endurance", val: performance.fitness }
  ];
  skillsList.forEach(s => {
    breakdown.innerHTML += `
      <div class="skill-bar-item">
        <div class="skill-bar-header">
          <span>${s.name}</span>
          <span>${s.val} / 10</span>
        </div>
        <div class="skill-bar-track">
          <div class="skill-bar-fill" style="width: ${s.val * 10}%;"></div>
        </div>
      </div>
    `;
  });

  drawRadarChart(canvas, scores, labels);
}

// ==========================================================================
// C. COACH DASHBOARD DATA HANDLERS
// ==========================================================================
async function syncCoachDashboardData() {
  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const [
        { data: playerData },
        { data: attendanceData },
        { data: perfData },
        { data: sessionData }
      ] = await Promise.all([
        client.from("profiles").select("*").eq("role", "player"),
        client.from("attendance").select("*"),
        client.from("performance_reports").select("*"),
        client.from("session_plans").select("*").order("date", { ascending: false })
      ]);

      liveCache.profiles = playerData || [];
      liveCache.attendance = attendanceData || [];
      liveCache.performance_reports = perfData || [];
      liveCache.session_plans = sessionData || [];
    } catch (err) {
      console.error("Error loading live coach data from Supabase:", err);
      showToast("Error loading coach dashboard data.", "error");
    }
  }

  const db = isMockSession ? getLocalDB() : liveCache;
  const players = db.profiles.filter(p => p.role === "player");

  // Roster Directory Table
  const rosterTable = document.getElementById("coachStudentRosterTable");
  rosterTable.innerHTML = "";
  if (players.length > 0) {
    players.forEach(p => {
      rosterTable.innerHTML += `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>${p.email}</td>
          <td>${p.age || "N/A"}</td>
          <td>${p.phone || "N/A"}</td>
          <td>${p.school || "N/A"}</td>
          <td><button class="btn btn-outline-cyan btn-sm" onclick="quickViewStudent('${p.id}')">Review Profile</button></td>
        </tr>
      `;
    });
  } else {
    rosterTable.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No students registered in database.</td></tr>`;
  }

  // Mark Attendance checkboxes mapping
  const datePicker = document.getElementById("attendanceDatePicker");
  if (!datePicker.value) {
    datePicker.value = new Date().toISOString().split("T")[0];
  }
  await loadAttendanceRosterList();

  // Populate Dropdown Selectors in evaluator, certificates, and alert dispatcher
  const evalSelect = document.getElementById("evalStudentSelect");
  const certSelect = document.getElementById("certStudentSelect");
  const alertSelect = document.getElementById("alertStudentSelect");

  if (evalSelect) evalSelect.innerHTML = "";
  if (certSelect) certSelect.innerHTML = "";
  if (alertSelect) alertSelect.innerHTML = "";

  players.forEach(p => {
    const opt = `<option value="${p.id}">${p.name}</option>`;
    if (evalSelect) evalSelect.innerHTML += opt;
    if (certSelect) certSelect.innerHTML += opt;
    if (alertSelect) alertSelect.innerHTML += opt;
  });

  // Initialize coach evaluator inputs for the first student
  if (players.length > 0) {
    await loadStudentStatsForCoach();
    applyAlertTemplate();
  }

  // Calculate team statistics for Coach Dashboard
  const teamSizeElement = document.getElementById("coachTeamSize");
  const teamPresenceElement = document.getElementById("coachTeamPresence");
  if (teamSizeElement) {
    teamSizeElement.textContent = players.length;
  }
  if (teamPresenceElement) {
    const totalAttendanceCount = db.attendance.length;
    const presentCount = db.attendance.filter(a => a.status === "Present").length;
    const teamAvgPresence = totalAttendanceCount > 0 ? Math.round((presentCount / totalAttendanceCount) * 100) : 0;
    teamPresenceElement.textContent = `${teamAvgPresence}%`;
  }

  // Session Plans lists
  syncCoachSessionPlansList();
}

async function loadAttendanceRosterList() {
  const date = document.getElementById("attendanceDatePicker").value;
  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const { data, error } = await client.from("attendance").select("*").eq("date", date);
      if (error) throw error;
      liveCache.attendance = (liveCache.attendance || []).filter(a => a.date !== date).concat(data || []);
    } catch (err) {
      console.error("Error fetching attendance for date:", err);
    }
  }
  const db = isMockSession ? getLocalDB() : liveCache;
  const players = db.profiles.filter(p => p.role === "player");
  const attendanceMarkerList = document.getElementById("coachAttendanceMarkerList");
  attendanceMarkerList.innerHTML = "";

  players.forEach((p, idx) => {
    const record = db.attendance.find(a => a.player_id === p.id && a.date === date);
    const isPresent = record ? record.status === "Present" : true; // default true/checked for ease

    attendanceMarkerList.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${p.name}</strong></td>
        <td>
          <label style="cursor:pointer; display:inline-flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" class="attendance-check" data-student-id="${p.id}" ${isPresent ? "checked" : ""}>
            Present
          </label>
        </td>
      </tr>
    `;
  });
}

// Filter Student Roster table
function filterRoster() {
  const val = document.getElementById("rosterSearchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#coachStudentRosterTable tr");
  rows.forEach(row => {
    const name = row.querySelector("td strong")?.textContent.toLowerCase() || "";
    if (name.includes(val)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function quickViewStudent(playerId) {
  // Switches context to evaluation or displays details
  switchTab("coach", "evaluator");
  document.getElementById("evalStudentSelect").value = playerId;
  showToast(`Loaded details for athlete profile ID: ${playerId}`, "info");
}

// Bulk Attendance entry submission
async function submitBulkAttendance() {
  const date = document.getElementById("attendanceDatePicker").value;
  const topic = document.getElementById("attendanceTopicInput").value.trim() || "Regular Session";

  if (!date) {
    showToast("Please pick a valid session date.", "error");
    return;
  }

  const checks = document.querySelectorAll(".attendance-check");
  const records = [];

  checks.forEach(chk => {
    const sId = chk.getAttribute("data-student-id");
    const isChecked = chk.checked;
    const status = isChecked ? "Present" : "Absent";
    records.push({
      player_id: sId,
      date: date,
      status: status,
      marked_by: currentUser.id
    });
  });

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const { error } = await client
        .from("attendance")
        .upsert(records, { onConflict: "player_id,date" });
      if (error) throw error;

      // Update cache
      records.forEach(rec => {
        const idx = liveCache.attendance.findIndex(a => a.player_id === rec.player_id && a.date === date);
        if (idx !== -1) {
          liveCache.attendance[idx] = rec;
        } else {
          liveCache.attendance.push(rec);
        }
      });

      showToast(`Attendance batch saved to Supabase for ${date}! Topic: ${topic}`, "success");
    } catch (err) {
      console.error("Error saving attendance to Supabase:", err);
      showToast("Error saving attendance: " + err.message, "error");
    }
  } else {
    const db = getLocalDB();
    records.forEach(rec => {
      const idx = db.attendance.findIndex(a => a.player_id === rec.player_id && a.date === date);
      if (idx !== -1) {
        db.attendance[idx] = rec;
      } else {
        db.attendance.push(rec);
      }
    });
    saveLocalDB(db);
    showToast(`Attendance batch saved for ${date}! Topic: ${topic}`, "success");
  }
}

// Evaluation post submit
async function handleCoachEvalSubmit(e) {
  e.preventDefault();
  const sId = document.getElementById("evalStudentSelect").value;
  const batting = Number(document.getElementById("evalBatting").value);
  const bowling = Number(document.getElementById("evalBowling").value);
  const fielding = Number(document.getElementById("evalFielding").value);
  const fitness = Number(document.getElementById("evalFitness").value);
  const feedback = document.getElementById("evalFeedback").value.trim();
  const date = new Date().toISOString().split("T")[0];

  const db = isMockSession ? getLocalDB() : liveCache;
  const existingReport = db.performance_reports.find(r => r.player_id === sId);

  const report = {
    player_id: sId,
    coach_id: currentUser.id,
    batting,
    bowling,
    fielding,
    fitness,
    feedback,
    report_date: date
  };
  if (existingReport && existingReport.id) {
    report.id = existingReport.id;
  }

  // Update Sport-Specific Statistics Profile
  const sport = document.getElementById("evalSportType").value;
  let existingStats = db.player_statistics.find(s => s.player_id === sId && s.sport_type === sport);

  let statObj = {
    player_id: sId,
    sport_type: sport,
    season: "2026 Summer"
  };
  if (existingStats && existingStats.id) {
    statObj.id = existingStats.id;
  }

  if (sport === "cricket") {
    statObj.matches_played = Number(document.getElementById("evalCricketMatches").value);
    statObj.runs_scored = Number(document.getElementById("evalCricketRuns").value);
    statObj.wickets_taken = Number(document.getElementById("evalCricketWickets").value);
    statObj.economy_rate = Number(document.getElementById("evalCricketEcon").value);
    statObj.batting_average = statObj.matches_played > 0 ? Number((statObj.runs_scored / statObj.matches_played).toFixed(1)) : 0;
    statObj.bowling_average = statObj.wickets_taken > 0 ? Number((statObj.economy_rate * statObj.matches_played / statObj.wickets_taken).toFixed(1)) : 0;
  } else {
    statObj.matches_played = Number(document.getElementById("evalBaseballMatches").value);
    const hitsVal = Number(document.getElementById("evalBaseballHits").value);
    statObj.runs_scored = Math.round(hitsVal / 1.5); // Proxy run values
    statObj.pitching_innings = Number(document.getElementById("evalBaseballInnings").value);
    statObj.pitching_era = Number(document.getElementById("evalBaseballEra").value);
    statObj.batting_average = statObj.matches_played > 0 ? Number((hitsVal / (statObj.matches_played * 4)).toFixed(3)) : 0;
    statObj.pitching_strikeouts = Math.round(statObj.pitching_innings * 1.2); // Proxy SO
  }

  // Update Coach Feedback & Target Goals
  const newGoalText = document.getElementById("evalNewGoal").value.trim();
  let existingFeedback = db.coach_feedback.find(f => f.player_id === sId);

  let feedbackObj = {
    player_id: sId,
    coach_id: currentUser.id,
    topic: "General Performance",
    feedback: feedback,
    goals_set: existingFeedback ? [...existingFeedback.goals_set] : [],
    goals_completed: existingFeedback ? [...existingFeedback.goals_completed] : [],
    report_date: date
  };
  if (existingFeedback && existingFeedback.id) {
    feedbackObj.id = existingFeedback.id;
  }

  feedbackObj.feedback = feedback;
  if (newGoalText) {
    if (!feedbackObj.goals_set.includes(newGoalText)) {
      feedbackObj.goals_set.push(newGoalText);
    }
  }

  // Log timeline analytics record
  const analyticObj = {
    player_id: sId,
    sport_type: sport,
    metric_name: "overall_evaluation",
    metric_value: Number(((batting + bowling + fielding + fitness) / 4).toFixed(1)),
    timestamp: new Date().toISOString()
  };

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      // Parallel inserts/upserts
      const [
        savedRepRes,
        savedStatsRes,
        savedFBRes,
        savedAnalyticRes
      ] = await Promise.all([
        client.from("performance_reports").upsert(report).select(),
        client.from("player_statistics").upsert(statObj).select(),
        client.from("coach_feedback").upsert(feedbackObj).select(),
        client.from("analytics").insert(analyticObj).select()
      ]);

      if (savedRepRes.error) throw savedRepRes.error;
      if (savedStatsRes.error) throw savedStatsRes.error;
      if (savedFBRes.error) throw savedFBRes.error;
      if (savedAnalyticRes.error) throw savedAnalyticRes.error;

      const savedReport = savedRepRes.data && savedRepRes.data.length > 0 ? savedRepRes.data[0] : null;
      const savedStats = savedStatsRes.data && savedStatsRes.data.length > 0 ? savedStatsRes.data[0] : null;
      const savedFB = savedFBRes.data && savedFBRes.data.length > 0 ? savedFBRes.data[0] : null;
      const savedAnalytic = savedAnalyticRes.data && savedAnalyticRes.data.length > 0 ? savedAnalyticRes.data[0] : null;

      // Update cache
      liveCache.performance_reports = (liveCache.performance_reports || []).filter(r => r.player_id !== sId).concat(savedReport ? [savedReport] : []);
      liveCache.player_statistics = (liveCache.player_statistics || []).filter(s => !(s.player_id === sId && s.sport_type === sport)).concat(savedStats ? [savedStats] : []);
      liveCache.coach_feedback = (liveCache.coach_feedback || []).filter(f => f.player_id !== sId).concat(savedFB ? [savedFB] : []);
      liveCache.analytics = (liveCache.analytics || []).concat(savedAnalytic ? [savedAnalytic] : []);

      showToast("Performance report evaluation, statistics, and goals saved to Supabase!", "success");
    } catch (err) {
      console.error("Error saving evaluation to Supabase:", err);
      showToast("Error saving evaluation: " + err.message, "error");
    }
  } else {
    // Local DB update
    const mockDB = getLocalDB();

    const repIdx = mockDB.performance_reports.findIndex(r => r.player_id === sId);
    if (repIdx !== -1) mockDB.performance_reports[repIdx] = report;
    else mockDB.performance_reports.push(report);

    const statIdx = mockDB.player_statistics.findIndex(s => s.player_id === sId && s.sport_type === sport);
    if (statIdx !== -1) mockDB.player_statistics[statIdx] = statObj;
    else mockDB.player_statistics.push(statObj);

    const fbIdx = mockDB.coach_feedback.findIndex(f => f.player_id === sId);
    if (fbIdx !== -1) mockDB.coach_feedback[fbIdx] = feedbackObj;
    else mockDB.coach_feedback.push(feedbackObj);

    mockDB.analytics.push(analyticObj);

    saveLocalDB(mockDB);
    showToast("Performance report evaluation, statistics, and goals saved and synced!", "success");
  }

  // Reset fields
  document.getElementById("evalFeedback").value = "";
  document.getElementById("evalNewGoal").value = "";
}

// Coach Session planning routines
async function handleCoachSessionSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("sessionTitle").value.trim();
  const date = document.getElementById("sessionDate").value;
  const topic = document.getElementById("sessionTopic").value.trim();
  const drillsStr = document.getElementById("sessionDrills").value;
  const drills = drillsStr ? drillsStr.split(",").map(d => d.trim()) : [];

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const newPlan = {
        coach_id: currentUser.id,
        title,
        date,
        topic,
        drills
      };
      const { data, error } = await client
        .from("session_plans")
        .insert(newPlan)
        .select()
        .single();
      if (error) throw error;
      liveCache.session_plans.unshift(data);
      showToast("New training session plan created in Supabase!", "success");
    } catch (err) {
      console.error("Error creating session plan in Supabase:", err);
      showToast("Error creating session plan: " + err.message, "error");
    }
  } else {
    const db = getLocalDB();
    const newPlan = {
      id: `plan-${Date.now()}`,
      coach_id: currentUser.id,
      title,
      date,
      topic,
      drills
    };
    db.session_plans.push(newPlan);
    saveLocalDB(db);
    showToast("New training session plan created!", "success");
  }

  // Reset Form
  document.getElementById("sessionTitle").value = "";
  document.getElementById("sessionDate").value = "";
  document.getElementById("sessionTopic").value = "";
  document.getElementById("sessionDrills").value = "";

  syncCoachSessionPlansList();
}

function syncCoachSessionPlansList() {
  const db = isMockSession ? getLocalDB() : liveCache;
  const list = document.getElementById("coachSessionPlansList");
  list.innerHTML = "";

  if (db.session_plans.length > 0) {
    db.session_plans.forEach(plan => {
      const drillTags = plan.drills.map(d => `<span class="drill-tag">${d}</span>`).join(" ");
      list.innerHTML += `
        <div class="plan-item-card mb-2">
          <h4>${plan.title}</h4>
          <div class="plan-meta">
            <span>📅 Date: ${plan.date}</span>
            <span>⚾ Topic: ${plan.topic || "General"}</span>
          </div>
          <div class="plan-drills">${drillTags || "<span class='text-muted' style='font-size:0.7rem;'>No drills logged</span>"}</div>
        </div>
      `;
    });
  } else {
    list.innerHTML = `<p class="text-muted">No scheduled training sessions logged.</p>`;
  }
}

// Announcements Broadcast submit
async function handleCoachAnnouncementSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("announceTitle").value.trim();
  const target = document.getElementById("announceTarget").value;
  const content = document.getElementById("announceContent").value.trim();
  const dateStr = new Date().toISOString();

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const newNotice = {
        author_id: currentUser.id,
        title,
        target_role: target,
        content,
        created_at: dateStr
      };
      const { data, error } = await client
        .from("announcements")
        .insert(newNotice)
        .select()
        .single();
      if (error) throw error;
      liveCache.announcements.unshift(data);
      showToast("Notice broadcast successfully published in Supabase!", "success");
    } catch (err) {
      console.error("Error creating notice in Supabase:", err);
      showToast("Error creating notice: " + err.message, "error");
    }
  } else {
    const db = getLocalDB();
    const newNotice = {
      id: `announce-${Date.now()}`,
      author_id: currentUser.id,
      title,
      target_role: target,
      content,
      created_at: dateStr
    };
    db.announcements.unshift(newNotice);
    saveLocalDB(db);
    showToast("Notice broadcast successfully published!", "success");
  }

  // Reset fields
  document.getElementById("announceTitle").value = "";
  document.getElementById("announceContent").value = "";
}

// Issue dynamic certificates routines
async function handleCoachCertificateSubmit(e) {
  e.preventDefault();
  const sId = document.getElementById("certStudentSelect").value;
  const title = document.getElementById("certTitle").value.trim();
  const badge = document.getElementById("certBadge").value;
  const description = document.getElementById("certDescription").value.trim();
  const date = new Date().toISOString().split("T")[0];

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const newCert = {
        player_id: sId,
        title,
        badge_type: badge,
        date_issued: date,
        description
      };
      const { data, error } = await client
        .from("certificates")
        .insert(newCert)
        .select()
        .single();
      if (error) throw error;
      liveCache.certificates.push(data);
      showToast("Achievement certificate issued to athlete successfully in Supabase!", "success");
    } catch (err) {
      console.error("Error issuing certificate in Supabase:", err);
      showToast("Error issuing certificate: " + err.message, "error");
    }
  } else {
    const db = getLocalDB();
    const newCert = {
      id: `cert-${Date.now()}`,
      player_id: sId,
      title,
      badge_type: badge,
      date_issued: date,
      description
    };
    db.certificates.push(newCert);
    saveLocalDB(db);
    showToast("Achievement certificate issued to athlete successfully!", "success");
  }

  // Reset Form
  document.getElementById("certTitle").value = "";
  document.getElementById("certDescription").value = "";
}

// ==========================================================================
// D. GENERAL PORTAL MODAL DIALOG FLOWS (UPI PAYMENTS & CERTIFICATES PRINT)
// ==========================================================================

// --- UPI PAYMENT MODAL ---
let portalAppliedCoupon = null;
let originalInvoiceAmount = 0;

function openPaymentModal(invoiceId, amount) {
  document.getElementById("payingInvoiceId").value = invoiceId;
  document.getElementById("upiTxnId").value = "";
  
  portalAppliedCoupon = null;
  originalInvoiceAmount = parseFloat(amount) || 0;
  
  const couponInput = document.getElementById("portalCouponCode");
  if (couponInput) couponInput.value = "";
  
  const msgEl = document.getElementById("portalCouponMessage");
  if (msgEl) {
    msgEl.style.display = "none";
    msgEl.textContent = "";
  }
  
  updatePortalPaymentDisplay(originalInvoiceAmount);
  document.getElementById("paymentModal").style.display = "flex";
}

function closePaymentModal() {
  document.getElementById("paymentModal").style.display = "none";
}

async function confirmPayment(e) {
  e.preventDefault();
  const invId = document.getElementById("payingInvoiceId").value;
  const txnId = document.getElementById("upiTxnId").value.trim();

  if (txnId.length < 6) {
    showToast("Invalid transaction ID reference. Must be a valid receipt code.", "error");
    return;
  }

  const discountAmount = portalAppliedCoupon ? Math.round(originalInvoiceAmount * (portalAppliedCoupon.discountPercent / 100)) : 0;
  const finalPaidAmount = originalInvoiceAmount - discountAmount;

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const { error } = await client
        .from("payment_history")
        .update({ status: "paid" })
        .eq("id", invId);
      if (error) throw error;

      // Log coupon usage in database
      if (portalAppliedCoupon) {
        let couponId = portalAppliedCoupon.id;
        
        // Fetch coupon ID if not present
        const { data: couponData } = await client
          .from("coupon_codes")
          .select("id, uses_count")
          .eq("code", portalAppliedCoupon.code)
          .maybeSingle();

        if (couponData) {
          couponId = couponData.id;
          // Increment claims
          await client
            .from("coupon_codes")
            .update({ uses_count: couponData.uses_count + 1 })
            .eq("id", couponData.id);

          await client
            .from("coupon_usage")
            .insert([{
              coupon_id: couponId,
              user_id: currentUser ? currentUser.id : null,
              applied_to: 'academy',
              reference_id: invId,
              discount_amount: discountAmount
            }]);
        }
      }

      const idx = liveCache.payment_history.findIndex(p => p.id === invId);
      let amount = finalPaidAmount;
      let invoiceNum = "INV";
      if (idx !== -1) {
        liveCache.payment_history[idx].status = "paid";
        amount = liveCache.payment_history[idx].amount - discountAmount;
        invoiceNum = liveCache.payment_history[idx].invoice_number;
      }
      showToast("UPI Transaction reference logged. Invoice status updated to Paid in Supabase!", "success");
      closePaymentModal();

      // Write audit log
      if (window.writeAuditLog) {
        await window.writeAuditLog(null, 'payment_confirm', 'user', {
          invoice_id: invId,
          invoice_number: invoiceNum,
          amount: amount,
          txn_id: txnId,
          user_id: currentUser.id,
          coupon_applied: portalAppliedCoupon ? portalAppliedCoupon.code : null,
          discount_amount: discountAmount
        });
      }

      // Dispatch real-time payment notification
      if (window.NotificationDispatcher) {
        await window.NotificationDispatcher.dispatch({
          userId: currentUser.id,
          type: 'payment_confirmation',
          title: 'Payment Confirmed',
          message: `Your payment of INR ${amount} for Invoice ${invoiceNum} has been verified. Reference TXN ID: ${txnId}`,
          channels: ['push', 'whatsapp', 'email'],
          profileDetails: {
            name: currentUser.name,
            phone: currentUser.phone || "+919731134665",
            email: currentUser.email
          },
          bookingDetails: {
            invoice: invoiceNum,
            amount: amount
          }
        });
      }

      // Reload active user dashboard
      if (currentUser.role === "player") {
        await syncPlayerDashboardData(currentUser.id);
      } else if (currentUser.role === "parent") {
        await parentSelectStudent();
      }
    } catch (err) {
      console.error("Error performing payment in Supabase:", err);
      showToast("Error updating invoice: " + err.message, "error");
    }
    return;
  }

  const db = getLocalDB();
  const idx = db.payment_history.findIndex(p => p.id === invId);
  if (idx !== -1) {
    db.payment_history[idx].status = "paid";
    const amount = finalPaidAmount;
    const invoiceNum = db.payment_history[idx].invoice_number;
    saveLocalDB(db);
    showToast("UPI Transaction reference logged. Invoice status updated to Paid!", "success");
    closePaymentModal();

    // Write audit log
    if (window.writeAuditLog) {
      window.writeAuditLog(null, 'payment_confirm', 'user', {
        invoice_id: invId,
        invoice_number: invoiceNum,
        amount: amount,
        txn_id: txnId,
        user_id: currentUser.id,
        coupon_applied: portalAppliedCoupon ? portalAppliedCoupon.code : null,
        discount_amount: discountAmount
      });
    }

    // Dispatch local notification
    if (window.NotificationDispatcher) {
      window.NotificationDispatcher.dispatch({
        userId: currentUser.id,
        type: 'payment_confirmation',
        title: 'Payment Confirmed',
        message: `Your payment of INR ${amount} for Invoice ${invoiceNum} has been verified. Reference TXN ID: ${txnId}`,
        channels: ['push', 'whatsapp', 'email'],
        profileDetails: {
          name: currentUser.name,
          phone: currentUser.phone || "+919731134665",
          email: currentUser.email
        },
        bookingDetails: {
          invoice: invoiceNum,
          amount: amount
        }
      });
    }

    // Reload active user dashboard
    if (currentUser.role === "player") {
      syncPlayerDashboardData(currentUser.id);
    } else if (currentUser.role === "parent") {
      parentSelectStudent();
    }
  }
}

// --- CERTIFICATES GENERATION & PRINT MODAL ---
function openCertificateModal(certId) {
  const db = isMockSession ? getLocalDB() : liveCache;
  const cert = db.certificates.find(c => c.id === certId);
  if (!cert) return;

  const student = db.profiles.find(p => p.id === cert.player_id) || { name: "RSA Athlete" };
  const printableArea = document.getElementById("printableCertificateContent");

  // Format dynamic badge emoji
  let badgeEmoji = "🎖️";
  if (cert.badge_type === "Gold") badgeEmoji = "🥇";
  else if (cert.badge_type === "Silver") badgeEmoji = "🥈";
  else if (cert.badge_type === "Bronze") badgeEmoji = "🥉";
  else if (cert.badge_type === "Elite") badgeEmoji = "💎";

  printableArea.innerHTML = `
    <img src="assets/images/logo.png" alt="RSA Logo" class="cert-logo">
    <h1 class="cert-main-title">RENEGADES SPORTS ARENA</h1>
    <h3 class="cert-subtitle">Certificate of Athletic Achievement</h3>
    <p class="cert-present">This credential is proudly presented to</p>
    <div class="cert-recipient">${student.name}</div>
    <p class="cert-text">For outstanding performance and technical mastery in securing the <strong>${cert.title}</strong>, demonstrating dedication, sportsmanship, and elite athletic standard during training sessions.</p>
    
    <div class="cert-footer-row">
      <div class="cert-sig-box">
        <img src="https://images.squarespace-cdn.com/content/v1/5be08a5cb27e3943fcf3e1d6/1541819777265-F6R1SMR2Q474S3B5V1M7/Signature.png" class="cert-sig-img" alt="Coach Signature">
        <strong>Rahul Dravid</strong><br>Head Coach
      </div>
      <div class="cert-badge-box">
        <div class="cert-badge-sticker">${badgeEmoji}</div>
        <span style="font-size:0.7rem; font-weight:bold; letter-spacing:1px; color:#FFD700; text-transform:uppercase;">${cert.badge_type} Rank</span>
      </div>
      <div class="cert-sig-box">
        <span style="display:block; height:40px; line-height:40px; font-weight:bold; font-style:italic;">OFFICIAL SEAL</span>
        <strong>Renegades Arena Board</strong><br>Date: ${cert.date_issued}
      </div>
    </div>
  `;

  document.getElementById("certModal").style.display = "flex";
}

function closeCertModal() {
  document.getElementById("certModal").style.display = "none";
}

function printCertificate() {
  window.print();
}

// ==========================================================================
// E. SPORT TOGGLES & METRICS VIEW SYNC
// ==========================================================================
function togglePlayerSport(sport) {
  const cricketBtn = document.getElementById("playerCricketBtn");
  const baseballBtn = document.getElementById("playerBaseballBtn");
  if (cricketBtn && baseballBtn) {
    cricketBtn.classList.toggle("active", sport === "cricket");
    baseballBtn.classList.toggle("active", sport === "baseball");
  }

  const cricketItems = document.querySelectorAll("#playerPortal .cricket-stat-item");
  const baseballItems = document.querySelectorAll("#playerPortal .baseball-stat-item");
  cricketItems.forEach(el => el.style.display = sport === "cricket" ? "flex" : "none");
  baseballItems.forEach(el => el.style.display = sport === "baseball" ? "flex" : "none");

  syncSportStatsView("player", sport);
}

function toggleParentSport(sport) {
  const cricketBtn = document.getElementById("parentCricketBtn");
  const baseballBtn = document.getElementById("parentBaseballBtn");
  if (cricketBtn && baseballBtn) {
    cricketBtn.classList.toggle("active", sport === "cricket");
    baseballBtn.classList.toggle("active", sport === "baseball");
  }

  const cricketItems = document.querySelectorAll("#parentPortal .parent-cricket-item");
  const baseballItems = document.querySelectorAll("#parentPortal .parent-baseball-item");
  cricketItems.forEach(el => el.style.display = sport === "cricket" ? "flex" : "none");
  baseballItems.forEach(el => el.style.display = sport === "baseball" ? "flex" : "none");

  syncSportStatsView("parent", sport);
}

function syncSportStatsView(role, sport) {
  const db = isMockSession ? getLocalDB() : liveCache;
  let studentId = "";

  if (role === "player") {
    studentId = currentUser.id;
  } else {
    const selector = document.getElementById("parentStudentSelector");
    studentId = selector ? selector.value : "";
  }

  if (!studentId) return;

  const stat = db.player_statistics.find(s => s.player_id === studentId && s.sport_type === sport);

  if (role === "player") {
    if (sport === "cricket") {
      document.getElementById("statBatAvg").textContent = stat ? stat.batting_average.toFixed(1) : "0.0";
      document.getElementById("statBatRuns").textContent = stat
        ? `Runs: ${stat.runs_scored} | Strike Rate: ${stat.strike_rate || 0}`
        : "Runs: 0 | Strike Rate: 0";
      document.getElementById("statBowlWkts").textContent = stat ? stat.wickets_taken : "0";
      document.getElementById("statBowlEcon").textContent = stat
        ? `Econ: ${stat.economy_rate.toFixed(2)} | Avg: ${stat.bowling_average.toFixed(1)}`
        : "Econ: 0.00 | Avg: 0.0";
    } else {
      document.getElementById("statBaseBatAvg").textContent = stat ? `.${Math.round(stat.batting_average * 1000)}` : ".000";
      document.getElementById("statBaseHits").textContent = stat
        ? `Hits: ${Math.round(stat.runs_scored * 1.5)} | Runs: ${stat.runs_scored}`
        : "Hits: 0 | Runs: 0";
      document.getElementById("statBaseEra").textContent = stat ? stat.pitching_era.toFixed(2) : "0.00";
      document.getElementById("statBaseKs").textContent = stat
        ? `Innings: ${stat.pitching_innings.toFixed(1)} | SO: ${stat.pitching_strikeouts || 0}`
        : "Innings: 0.0 | SO: 0";
    }
  } else {
    // Parent View
    if (sport === "cricket") {
      document.getElementById("parentStatBatAvg").textContent = stat ? stat.batting_average.toFixed(1) : "0.0";
      document.getElementById("parentStatBatRuns").textContent = stat
        ? `Runs: ${stat.runs_scored} | SR: ${stat.strike_rate || 0}`
        : "Runs: 0 | SR: 0";
      document.getElementById("parentStatBowlWkts").textContent = stat ? stat.wickets_taken : "0";
      document.getElementById("parentStatBowlEcon").textContent = stat
        ? `Econ: ${stat.economy_rate.toFixed(2)} | Avg: ${stat.bowling_average.toFixed(1)}`
        : "Econ: 0.00 | Avg: 0.0";
    } else {
      document.getElementById("parentStatBaseBatAvg").textContent = stat ? `.${Math.round(stat.batting_average * 1000)}` : ".000";
      document.getElementById("parentStatBaseHits").textContent = stat
        ? `Hits: ${Math.round(stat.runs_scored * 1.5)} | Runs: ${stat.runs_scored}`
        : "Hits: 0 | Runs: 0";
      document.getElementById("parentStatBaseEra").textContent = stat ? stat.pitching_era.toFixed(2) : "0.00";
      document.getElementById("parentStatBaseKs").textContent = stat
        ? `Innings: ${stat.pitching_innings.toFixed(1)} | SO: ${stat.pitching_strikeouts || 0}`
        : "Innings: 0.0 | SO: 0";
    }
  }
}

// ==========================================================================
// F. COACH EVALUATOR VIEW HANDLERS
// ==========================================================================
function toggleCoachEvalSport() {
  const sport = document.getElementById("evalSportType").value;
  document.getElementById("coachCricketStatsFields").style.display = sport === "cricket" ? "grid" : "none";
  document.getElementById("coachBaseballStatsFields").style.display = sport === "baseball" ? "grid" : "none";
  loadStudentStatsForCoach(); // Reload student statistics fields matching selection
}

async function loadStudentStatsForCoach() {
  const sId = document.getElementById("evalStudentSelect").value;
  if (!sId) return;

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const [
        { data: statsData },
        { data: feedbackData }
      ] = await Promise.all([
        client.from("player_statistics").select("*").eq("player_id", sId),
        client.from("coach_feedback").select("*").eq("player_id", sId)
      ]);

      liveCache.player_statistics = (liveCache.player_statistics || []).filter(s => s.player_id !== sId).concat(statsData || []);
      liveCache.coach_feedback = (liveCache.coach_feedback || []).filter(f => f.player_id !== sId).concat(feedbackData || []);
    } catch (err) {
      console.error("Error loading student stats for coach:", err);
    }
  }

  const db = isMockSession ? getLocalDB() : liveCache;
  const performance = db.performance_reports.find(p => p.player_id === sId) || {
    batting: 5, bowling: 5, fielding: 5, fitness: 5, feedback: ""
  };

  document.getElementById("evalBatting").value = performance.batting;
  document.getElementById("evalBowling").value = performance.bowling;
  document.getElementById("evalFielding").value = performance.fielding;
  document.getElementById("evalFitness").value = performance.fitness;
  document.getElementById("evalFeedback").value = performance.feedback || "";

  const sport = document.getElementById("evalSportType").value;
  const stats = db.player_statistics.find(s => s.player_id === sId && s.sport_type === sport);

  if (sport === "cricket") {
    document.getElementById("evalCricketMatches").value = stats ? stats.matches_played : 0;
    document.getElementById("evalCricketRuns").value = stats ? stats.runs_scored : 0;
    document.getElementById("evalCricketWickets").value = stats ? stats.wickets_taken : 0;
    document.getElementById("evalCricketEcon").value = stats ? stats.economy_rate.toFixed(2) : "0.00";
  } else {
    document.getElementById("evalBaseballMatches").value = stats ? stats.matches_played : 0;
    document.getElementById("evalBaseballHits").value = stats ? Math.round(stats.runs_scored * 1.5) : 0;
    document.getElementById("evalBaseballInnings").value = stats ? stats.pitching_innings.toFixed(1) : "0.0";
    document.getElementById("evalBaseballEra").value = stats ? stats.pitching_era.toFixed(2) : "0.00";
  }
}

// ==========================================================================
// G. SIMULATED COMMUNICATION DISPATCHER
// ==========================================================================
function applyAlertTemplate() {
  const template = document.getElementById("alertTemplateSelector").value;
  const studentSelect = document.getElementById("alertStudentSelect");
  const studentId = studentSelect ? studentSelect.value : "";
  const db = isMockSession ? getLocalDB() : liveCache;
  const student = db.profiles.find(p => p.id === studentId) || { name: "Virat Kohli" };

  let subject = "";
  let body = "";

  switch (template) {
    case "tournament_alert":
      subject = "🏆 Academy Tournament Registration Open";
      body = `Hi ${student.name}, registrations for the upcoming RSA Winter Championship U-15 tournament are now open! Please secure your team slot in the portal.`;
      break;
    case "match_reminder":
      subject = "🏏 Upcoming Match Schedule";
      body = `Hello ${student.name}, you have a match scheduled this Saturday at 8:00 AM on Ground A. Please report to the academy in full uniform by 7:15 AM.`;
      break;
    case "fee_reminder":
      subject = "💳 Outstanding Fee Invoice Reminder";
      body = `Dear Parent, the training fee invoice of INR 1,500 for ${student.name} is outstanding. Please clear it via the portal UPI gateway.`;
      break;
    case "attendance_alert":
      subject = "⚠️ Low Attendance Warning Alert";
      body = `Attention: ${student.name}'s attendance has dropped below 75% this month. Consistent presence is critical for development.`;
      break;
    case "session_update":
      subject = "📅 Training Session Rescheduled";
      body = `Please note: The evening practice session for today has been rescheduled to 5:00 PM due to weather forecasts.`;
      break;
    case "trial_confirmation":
      subject = "⚾ Trial Session Booking Confirmation";
      body = `Congratulations! Your free trial session at Renegades Sports Arena is confirmed for tomorrow. We look forward to seeing you!`;
      break;
    case "birthday_wish":
      subject = "🎂 Happy Birthday from RSA!";
      body = `Wishing a very Happy Birthday to our star player ${student.name}! Keep shining and training hard!`;
      break;
    case "achievement_certificate":
      subject = "🥇 Performance Badge Certificate Achievement";
      body = `Fantastic news! A new rank certificate has been issued for ${student.name} in the certificates panel. View and print it now.`;
      break;
    case "performance_report":
      subject = "📈 Performance Evaluation Report Published";
      body = `Coach Rahul Dravid has published the monthly performance assessment report for ${student.name}. Access stats in the dashboard.`;
      break;
    case "emergency_announcement":
      subject = "🚨 Emergency Weather Academy Closure Notice";
      body = `EMERGENCY NOTICE: The academy will remain closed tomorrow due to heavy rainfall alerts. Online drills will be shared by coaches.`;
      break;
  }

  document.getElementById("alertTitleInput").value = subject;
  document.getElementById("alertBodyInput").value = body;
}

async function dispatchSimulatedNotification(e) {
  e.preventDefault();
  const studentId = document.getElementById("alertStudentSelect").value;
  const title = document.getElementById("alertTitleInput").value.trim();
  const body = document.getElementById("alertBodyInput").value.trim();
  const templateType = document.getElementById("alertTemplateSelector").value;

  const chkWhatsApp = document.getElementById("alertChannelWhatsApp").checked;
  const chkEmail = document.getElementById("alertChannelEmail").checked;
  const chkPush = document.getElementById("alertChannelPush").checked;

  if (!chkWhatsApp && !chkEmail && !chkPush) {
    showToast("Please select at least one delivery channel.", "error");
    return;
  }

  if (!studentId || !title || !body) {
    showToast("Please fill in all recipient and alert fields.", "error");
    return;
  }

  const channels = [];
  if (chkWhatsApp) channels.push("whatsapp");
  if (chkEmail) channels.push("email");
  if (chkPush) channels.push("push");

  const db = isMockSession ? getLocalDB() : liveCache;
  const student = db.profiles.find(p => p.id === studentId) || {};

  if (window.NotificationDispatcher) {
    await window.NotificationDispatcher.dispatch({
      userId: studentId,
      type: templateType,
      title: title,
      message: body,
      channels: channels,
      profileDetails: {
        name: student.name,
        phone: student.phone || "+919731134665",
        email: student.email
      }
    });

    if (currentUser && currentUser.id === studentId) {
      await syncNotificationsList(currentUser.role, currentUser.id);
    }
  }

  // Clear inputs
  document.getElementById("alertTitleInput").value = "";
  document.getElementById("alertBodyInput").value = "";
}

async function syncNotificationsList(role, userId) {
  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      let data = [];
      if (role === "player") {
        const { data: nData } = await client.from("notifications").select("*").eq("user_id", userId);
        data = nData || [];
      } else {
        const { data: rels } = await client.from("parent_student_relations").select("player_id").eq("parent_id", userId);
        const childIds = (rels || []).map(r => r.player_id);
        const userIds = [userId, ...childIds];
        const { data: nData } = await client.from("notifications").select("*").in("user_id", userIds);
        data = nData || [];
      }
      liveCache.notifications = data;
    } catch (err) {
      console.error("Error fetching live notifications:", err);
    }
  }

  const db = isMockSession ? getLocalDB() : liveCache;
  let notifications = [];

  if (role === "player") {
    notifications = db.notifications.filter(n => n.user_id === userId);
  } else {
    // Parent sees notifications for parent profile + linked child profiles
    const relations = db.parent_student_relations.filter(r => r.parent_id === userId);
    const childIds = relations.map(r => r.player_id);
    const targetUserIds = [userId, ...childIds];
    notifications = db.notifications.filter(n => targetUserIds.includes(n.user_id));
  }

  // Sort descending
  notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const listElement = document.getElementById(role === "player" ? "playerNotificationsList" : "parentNotificationsList");
  if (!listElement) return;

  listElement.innerHTML = "";

  if (notifications.length > 0) {
    notifications.forEach(n => {
      let borderClass = "border-left-push";
      let channelIcon = "🔔";
      if (n.channel === "whatsapp") {
        borderClass = "border-left-whatsapp";
        channelIcon = "💬";
      } else if (n.channel === "email") {
        borderClass = "border-left-email";
        channelIcon = "✉️";
      }

      let readButton = "";
      if (n.status === "unread") {
        readButton = `<button class="btn btn-outline-cyan btn-sm mt-2" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;" onclick="markNotificationRead('${role}', '${n.id}')">Mark as Read</button>`;
      } else {
        readButton = `<span class="text-success mt-2" style="font-size:0.75rem; font-weight:bold; display:block;">Read ✓</span>`;
      }

      const isUnread = n.status === "unread" ? "unread" : "";

      listElement.innerHTML += `
        <div class="notification-card ${isUnread} ${borderClass}">
          <div class="notification-meta">
            <span class="channel-tag">${channelIcon} ${n.channel.toUpperCase()}</span>
            <span>${new Date(n.created_at).toLocaleString()}</span>
          </div>
          <h4 class="notification-title">${n.title}</h4>
          <p class="notification-msg">${n.message}</p>
          ${readButton}
        </div>
      `;
    });
  } else {
    listElement.innerHTML = `<p class="text-center text-muted p-4">No notification alerts in your inbox.</p>`;
  }

  await updateUnreadNotificationsBadge(role, userId);
}

async function markNotificationRead(role, notId) {
  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const { error } = await client
        .from("notifications")
        .update({ status: "read", is_read: true })
        .eq("id", notId);
      if (error) throw error;
      const idx = liveCache.notifications.findIndex(n => n.id === notId);
      if (idx !== -1) {
        liveCache.notifications[idx].status = "read";
        liveCache.notifications[idx].is_read = true;
      }
      showToast("Notification marked as read.", "success");
      await syncNotificationsList(role, currentUser.id);
      await syncHeaderNotifications(currentUser.id, role);
    } catch (err) {
      console.error("Error marking notification read:", err);
      showToast("Error updating notification status.", "error");
    }
    return;
  }

  const db = getLocalDB();
  const idx = db.notifications.findIndex(n => n.id === notId);
  if (idx !== -1) {
    db.notifications[idx].status = "read";
    db.notifications[idx].is_read = true;
    saveLocalDB(db);
    showToast("Notification marked as read.", "success");
    await syncNotificationsList(role, currentUser.id);
    await syncHeaderNotifications(currentUser.id, role);
  }
}

async function updateUnreadNotificationsBadge(role, userId) {
  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      let data = [];
      if (role === "player") {
        const { data: nData } = await client.from("notifications").select("*").eq("user_id", userId);
        data = nData || [];
      } else {
        const { data: rels } = await client.from("parent_student_relations").select("player_id").eq("parent_id", userId);
        const childIds = (rels || []).map(r => r.player_id);
        const userIds = [userId, ...childIds];
        const { data: nData } = await client.from("notifications").select("*").in("user_id", userIds);
        data = nData || [];
      }
      liveCache.notifications = data;
    } catch (err) {
      console.error("Error fetching live notifications for badge:", err);
    }
  }

  const db = isMockSession ? getLocalDB() : liveCache;
  let notifications = [];

  if (role === "player") {
    notifications = db.notifications.filter(n => n.user_id === userId);
  } else {
    const relations = db.parent_student_relations.filter(r => r.parent_id === userId);
    const childIds = relations.map(r => r.player_id);
    const targetUserIds = [userId, ...childIds];
    notifications = db.notifications.filter(n => targetUserIds.includes(n.user_id));
  }

  const unreadCount = notifications.filter(n => n.status === "unread" || n.is_read === false).length;
  const badge = document.getElementById(role === "player" ? "playerUnreadCount" : "parentUnreadCount");
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }
}

async function markAllNotificationsAsRead() {
  if (!currentUser) return;
  const role = currentUser.role;
  const userId = currentUser.id;

  if (!isMockSession) {
    try {
      const client = window.supabaseClient;

      let query;
      if (role === "player") {
        query = client.from("notifications").update({ status: "read", is_read: true }).eq("user_id", userId);
      } else {
        const { data: rels } = await client.from("parent_student_relations").select("player_id").eq("parent_id", userId);
        const childIds = (rels || []).map(r => r.player_id);
        const userIds = [userId, ...childIds];
        query = client.from("notifications").update({ status: "read", is_read: true }).in("user_id", userIds);
      }

      const { error } = await query;
      if (error) throw error;

      liveCache.notifications.forEach(n => {
        n.status = "read";
        n.is_read = true;
      });

      showToast("All notifications marked as read.", "success");

      await syncNotificationsList(role, userId);
      await syncHeaderNotifications(userId, role);
    } catch (err) {
      console.error("Error marking all notifications read:", err);
      showToast("Error updating notifications.", "error");
    }
  } else {
    const db = getLocalDB();
    db.notifications.forEach(n => {
      if (role === "player") {
        if (n.user_id === userId) {
          n.status = "read";
          n.is_read = true;
        }
      } else {
        const relations = db.parent_student_relations.filter(r => r.parent_id === userId);
        const childIds = relations.map(r => r.player_id);
        const targetUserIds = [userId, ...childIds];
        if (targetUserIds.includes(n.user_id)) {
          n.status = "read";
          n.is_read = true;
        }
      }
    });
    saveLocalDB(db);
    showToast("All notifications marked as read.", "success");
    await syncNotificationsList(role, userId);
    await syncHeaderNotifications(userId, role);
  }
}

async function syncHeaderNotifications(userId, role) {
  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      let data = [];
      if (role === "player") {
        const { data: nData } = await client.from("notifications").select("*").eq("user_id", userId);
        data = nData || [];
      } else {
        const { data: rels } = await client.from("parent_student_relations").select("player_id").eq("parent_id", userId);
        const childIds = (rels || []).map(r => r.player_id);
        const userIds = [userId, ...childIds];
        const { data: nData } = await client.from("notifications").select("*").in("user_id", userIds);
        data = nData || [];
      }
      liveCache.notifications = data;
    } catch (err) {
      console.error("Error fetching live notifications for header:", err);
    }
  }

  const db = isMockSession ? getLocalDB() : liveCache;
  let notifications = [];

  if (role === "player") {
    notifications = db.notifications.filter(n => n.user_id === userId);
  } else {
    const relations = db.parent_student_relations.filter(r => r.parent_id === userId);
    const childIds = relations.map(r => r.player_id);
    const targetUserIds = [userId, ...childIds];
    notifications = db.notifications.filter(n => targetUserIds.includes(n.user_id));
  }

  // Sort descending
  notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Update badge count
  const unreadNotifications = notifications.filter(n => n.is_read === false || n.status === "unread");
  const unreadCount = unreadNotifications.length;

  const badge = document.getElementById("headerNotificationBadge");
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "block";
    } else {
      badge.style.display = "none";
    }
  }

  // Populate list
  const listElement = document.getElementById("headerNotificationList");
  if (!listElement) return;

  listElement.innerHTML = "";

  // Render recent 5 notifications
  const recentNotifs = notifications.slice(0, 5);

  if (recentNotifs.length > 0) {
    recentNotifs.forEach(n => {
      const isUnreadStatus = (n.is_read === false || n.status === "unread") ? "background: rgba(255, 107, 0, 0.05); font-weight: bold;" : "";
      listElement.innerHTML += `
        <div style="padding: 0.75rem; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.2s; ${isUnreadStatus}">
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            <span>🔔 ${n.type.toUpperCase().replace('_', ' ')}</span>
            <span>${new Date(n.created_at).toLocaleDateString()}</span>
          </div>
          <h5 style="margin: 0; font-size: 0.85rem; color: #fff;">${n.title}</h5>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${n.message}</p>
        </div>
      `;
    });
  } else {
    listElement.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 1rem; margin: 0;">No notifications.</p>`;
  }
}

// Bind to window to allow notifications dispatcher to access
window.syncHeaderNotifications = syncHeaderNotifications;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;

// ==========================================================================
// H. STATEFUL ATHLETIC GOALS SETTINGS
// ==========================================================================
async function toggleGoalCompletion(playerId, idx, checked) {
  if (!isMockSession) {
    try {
      const client = window.supabaseClient;
      const feedback = liveCache.coach_feedback.find(f => f.player_id === playerId);
      if (feedback) {
        if (!feedback.goals_completed) {
          feedback.goals_completed = [];
        }
        if (checked) {
          if (!feedback.goals_completed.includes(idx)) {
            feedback.goals_completed.push(idx);
          }
        } else {
          feedback.goals_completed = feedback.goals_completed.filter(i => i !== idx);
        }

        const { error } = await client
          .from("coach_feedback")
          .update({ goals_completed: feedback.goals_completed })
          .eq("id", feedback.id);
        if (error) throw error;
        showToast("Goal challenge status updated in Supabase!", "success");
        await syncPlayerDashboardData(playerId);
      }
    } catch (err) {
      console.error("Error updating goal completion in Supabase:", err);
      showToast("Error updating goal status.", "error");
    }
    return;
  }

  const db = getLocalDB();
  const feedback = db.coach_feedback.find(f => f.player_id === playerId);
  if (feedback) {
    if (!feedback.goals_completed) {
      feedback.goals_completed = [];
    }
    if (checked) {
      if (!feedback.goals_completed.includes(idx)) {
        feedback.goals_completed.push(idx);
      }
    } else {
      feedback.goals_completed = feedback.goals_completed.filter(i => i !== idx);
    }
    saveLocalDB(db);
    showToast("Goal challenge status updated!", "success");
    syncPlayerDashboardData(playerId);
  }
}

// ==========================================================================
// I. CUSTOM CANVAS DATA DRAWINGS (LINE & BAR GRAPHS)
// ==========================================================================
function renderFitnessChart(canvasId, playerId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const db = isMockSession ? getLocalDB() : liveCache;
  const logs = db.analytics.filter(a => a.player_id === playerId);
  const weights = logs.filter(a => a.metric_name === "fitness_weight_kg").sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const sprints = logs.filter(a => a.metric_name === "fitness_sprint_sec").sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  let weightData = weights.map(w => w.metric_value);
  let sprintData = sprints.map(s => s.metric_value);
  let dates = weights.map(w => w.timestamp);

  if (weightData.length === 0) {
    weightData = [68, 67.5, 67, 66.8];
    sprintData = [7.4, 7.2, 7.1, 6.9];
    dates = ["2026-06-01", "2026-06-05", "2026-06-10", "2026-06-12"];
  }

  // Draw Grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = 40 + (canvas.height - 80) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }

  // Plot Weight Line (Scale min 60 to max 75)
  ctx.beginPath();
  weightData.forEach((w, idx) => {
    const x = 40 + (canvas.width - 80) * (idx / (weightData.length - 1));
    const y = canvas.height - 50 - (w - 60) * ((canvas.height - 100) / 15);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "rgba(255, 107, 0, 0.85)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Plot Sprint Line (Scale min 6.0 to max 8.5)
  ctx.beginPath();
  sprintData.forEach((s, idx) => {
    const x = 40 + (canvas.width - 80) * (idx / (sprintData.length - 1));
    const y = canvas.height - 50 - (s - 6) * ((canvas.height - 100) / 2.5);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "rgba(0, 229, 255, 0.85)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Dots & Value Annotations
  weightData.forEach((w, idx) => {
    const x = 40 + (canvas.width - 80) * (idx / (weightData.length - 1));
    const y = canvas.height - 50 - (w - 60) * ((canvas.height - 100) / 15);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FF6B00";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(`${w}kg`, x - 12, y - 8);
  });

  sprintData.forEach((s, idx) => {
    const x = 40 + (canvas.width - 80) * (idx / (sprintData.length - 1));
    const y = canvas.height - 50 - (s - 6) * ((canvas.height - 100) / 2.5);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#00E5FF";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(`${s}s`, x - 8, y + 14);
  });

  // Date Labels on X Axis
  dates.forEach((d, idx) => {
    const x = 40 + (canvas.width - 80) * (idx / (dates.length - 1));
    ctx.fillStyle = "#888";
    ctx.font = "9px sans-serif";
    const label = new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    ctx.fillText(label, x - 15, canvas.height - 15);
  });

  // Legend
  ctx.fillStyle = "#FF6B00";
  ctx.fillRect(40, 15, 12, 6);
  ctx.fillStyle = "#888";
  ctx.font = "10px sans-serif";
  ctx.fillText("Weight (kg)", 58, 21);

  ctx.fillStyle = "#00E5FF";
  ctx.fillRect(150, 15, 12, 6);
  ctx.fillStyle = "#888";
  ctx.fillText("30m Sprint (sec)", 168, 21);
}

function renderAttendanceChart(canvasId, playerId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const db = isMockSession ? getLocalDB() : liveCache;
  const reports = db.attendance_reports.filter(r => r.player_id === playerId).sort((a, b) => new Date(a.month) - new Date(b.month));

  let data = reports;
  if (data.length === 0) {
    data = [
      { month: "2026-05-01", total_sessions: 12, present_sessions: 11, absent_sessions: 0, excused_sessions: 1, percentage: 91.6 },
      { month: "2026-06-01", total_sessions: 4, present_sessions: 3, absent_sessions: 1, excused_sessions: 0, percentage: 75.0 }
    ];
  }

  // Draw Grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = 40 + (canvas.height - 80) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }

  const barWidth = 10;
  const gap = 3;

  data.forEach((r, idx) => {
    const cx = 70 + idx * 110;
    const yBase = canvas.height - 40;

    // Scale heights to max 15 sessions
    const maxVal = 15;
    const hPres = (r.present_sessions / maxVal) * (canvas.height - 100);
    const hAbs = (r.absent_sessions / maxVal) * (canvas.height - 100);
    const hExc = (r.excused_sessions / maxVal) * (canvas.height - 100);

    // Present (Green)
    ctx.fillStyle = "#10B981";
    ctx.fillRect(cx - barWidth - gap, yBase - hPres, barWidth, hPres);

    // Absent (Red)
    ctx.fillStyle = "#EF4444";
    ctx.fillRect(cx, yBase - hAbs, barWidth, hAbs);

    // Excused (Orange)
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(cx + barWidth + gap, yBase - hExc, barWidth, hExc);

    // Percentage Label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(`${Math.round(r.percentage)}%`, cx - 12, yBase - Math.max(hPres, hAbs, hExc) - 8);

    // X Axis Labels
    ctx.fillStyle = "#888";
    ctx.font = "9px sans-serif";
    const label = new Date(r.month).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    ctx.fillText(label, cx - 18, yBase + 15);
    ctx.fillText(`(Total: ${r.total_sessions})`, cx - 22, yBase + 27);
  });

  // Legend
  ctx.fillStyle = "#10B981"; ctx.fillRect(20, 15, 10, 6);
  ctx.fillStyle = "#888"; ctx.font = "9px sans-serif"; ctx.fillText("Present", 34, 21);
  ctx.fillStyle = "#EF4444"; ctx.fillRect(100, 15, 10, 6);
  ctx.fillStyle = "#888"; ctx.fillText("Absent", 114, 21);
  ctx.fillStyle = "#F59E0B"; ctx.fillRect(180, 15, 10, 6);
  ctx.fillStyle = "#888"; ctx.fillText("Excused", 194, 21);
}

function renderCoachTeamStatsChart() {
  const canvas = document.getElementById("coachTeamStatsChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const db = isMockSession ? getLocalDB() : liveCache;
  const players = db.profiles.filter(p => p.role === "player");

  const ratings = players.map(p => {
    const perf = db.performance_reports.find(r => r.player_id === p.id);
    const avg = perf ? ((perf.batting + perf.bowling + perf.fielding + perf.fitness) / 4) : 5.0;
    return { name: p.name.split(" ")[0], rating: avg };
  });

  // Draw Grid Lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 5; i++) {
    const y = 40 + (canvas.height - 80) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }

  // Draw Benchmarks
  // Elite Standard (9.0)
  const yElite = canvas.height - 40 - (9.0 / 10) * (canvas.height - 80);
  ctx.strokeStyle = "#00E5FF";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(30, yElite);
  ctx.lineTo(canvas.width - 20, yElite);
  ctx.stroke();
  ctx.fillStyle = "#00E5FF";
  ctx.font = "8px sans-serif";
  ctx.fillText("Elite Std (9.0)", canvas.width - 80, yElite - 4);

  // Average Standard (6.5)
  const yAvg = canvas.height - 40 - (6.5 / 10) * (canvas.height - 80);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.beginPath();
  ctx.moveTo(30, yAvg);
  ctx.lineTo(canvas.width - 20, yAvg);
  ctx.stroke();
  ctx.fillStyle = "#888";
  ctx.fillText("Acad Avg (6.5)", canvas.width - 80, yAvg - 4);

  ctx.setLineDash([]); // Reset dash

  // Draw Rating Bars
  const numPlayers = ratings.length;
  const barWidth = 24;
  ratings.forEach((p, idx) => {
    const spacing = (canvas.width - 80) / Math.max(1, numPlayers);
    const cx = 50 + idx * spacing + spacing / 2;
    const h = (p.rating / 10) * (canvas.height - 80);
    const yBase = canvas.height - 40;

    // Fill rating bar
    ctx.fillStyle = p.rating >= 9.0 ? "var(--accent-primary)" : "rgba(255, 107, 0, 0.65)";
    ctx.fillRect(cx - barWidth / 2, yBase - h, barWidth, h);

    // Value text
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(p.rating.toFixed(1), cx - 8, yBase - h - 6);

    // Name label
    ctx.fillStyle = "#888";
    ctx.fillText(p.name, cx - 12, yBase + 15);
  });
}

// ==========================================================================
// J. TOURNAMENTS PERFORMANCE STANDINGS
// ==========================================================================
function syncCoachTournamentStats() {
  const select = document.getElementById("coachTournamentSelector");
  if (!select) return;

  const activeTournaments = [
    { id: "t-1", name: "RSA Winter League Championship U-15", sport: "Cricket" },
    { id: "t-2", name: "Major League Baseball Youth Pathway India", sport: "Baseball" }
  ];

  const tournamentTeams = {
    "t-1": [
      { name: "RSA Renegades", played: 6, won: 5, lost: 1, ratio: "83.3%" },
      { name: "HSR Hawks", played: 6, won: 4, lost: 2, ratio: "66.7%" },
      { name: "Indiranagar Invaders", played: 6, won: 2, lost: 4, ratio: "33.3%" },
      { name: "Whitefield Warriors", played: 6, won: 1, lost: 5, ratio: "16.7%" }
    ],
    "t-2": [
      { name: "RSA Renegades Baseball", played: 8, won: 7, lost: 1, ratio: "87.5%" },
      { name: "Mumbai Sluggers", played: 8, won: 5, lost: 3, ratio: "62.5%" },
      { name: "Delhi Blue Jays", played: 8, won: 3, lost: 5, ratio: "37.5%" },
      { name: "Bangalore Red Sox", played: 8, won: 1, lost: 7, ratio: "12.5%" }
    ]
  };

  // Populate Selector if empty
  if (select.innerHTML.trim() === "") {
    activeTournaments.forEach(t => {
      select.innerHTML += `<option value="${t.id}">${t.name} (${t.sport})</option>`;
    });
  }

  const selectedTourney = select.value || "t-1";
  const standings = tournamentTeams[selectedTourney] || [];
  const tbody = document.getElementById("coachTournamentStandingsBody");
  if (tbody) {
    tbody.innerHTML = "";
    standings.forEach(team => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${team.name}</strong></td>
          <td>${team.played}</td>
          <td>${team.won}</td>
          <td>${team.lost}</td>
          <td><span class="badge-status paid">${team.ratio}</span></td>
        </tr>
      `;
    });
  }
}

// ==========================================================================
// K. PERFORMANCE COMPARATIVE BENCHMARKING
// ==========================================================================
function updatePlayerComparison() {
  updateRoleComparison("player");
}

function updateParentComparison() {
  updateRoleComparison("parent");
}

function updateRoleComparison(role) {
  const db = isMockSession ? getLocalDB() : liveCache;
  let studentId = "";

  if (role === "player") {
    studentId = currentUser.id;
  } else {
    const selector = document.getElementById("parentStudentSelector");
    studentId = selector ? selector.value : "";
  }

  if (!studentId) return;

  const perf = db.performance_reports.find(p => p.player_id === studentId);
  const rating = perf ? ((perf.batting + perf.bowling + perf.fielding + perf.fitness) / 4) : 5.0;

  const targetSelector = document.getElementById(role === "player" ? "compareTargetSelector" : "parentCompareTargetSelector");
  const targetType = targetSelector ? targetSelector.value : "elite";
  const benchmarkVal = targetType === "elite" ? 9.0 : 6.5;
  const benchmarkName = targetType === "elite" ? "Elite Academy Standard" : "Academy Average Standard";

  const athletePct = rating * 10;
  const benchmarkPct = benchmarkVal * 10;
  const diff = (rating - benchmarkVal).toFixed(1);

  const remark = diff >= 0
    ? `<p style="color:#10B981; font-size:0.85rem; font-weight:bold; margin-top:0.75rem;">✓ Outperforming ${benchmarkName} by +${diff} points.</p>`
    : `<p style="color:var(--accent-primary); font-size:0.85rem; font-weight:bold; margin-top:0.75rem;">⚠️ Behind ${benchmarkName} by ${Math.abs(diff)} points.</p>`;

  const container = document.getElementById(role === "player" ? "playerComparisonResults" : "parentComparisonResults");
  if (container) {
    container.innerHTML = `
      <div class="comp-bar-list">
        <div class="comp-bar-item">
          <div class="comp-bar-label">
            <span>Your Technical Score</span>
            <span>${rating.toFixed(1)} / 10</span>
          </div>
          <div class="comp-bar-tracks-container">
            <div class="comp-bar-player" style="width: ${athletePct}%;"></div>
            <div class="comp-bar-target" style="width: ${benchmarkPct}%;"></div>
          </div>
        </div>
        <div class="comp-bar-item mt-2">
          <div class="comp-bar-label">
            <span>${benchmarkName}</span>
            <span>${benchmarkVal.toFixed(1)} / 10</span>
          </div>
          <div class="comp-bar-tracks-container" style="opacity:0.6;">
            <div class="comp-bar-player" style="width: ${benchmarkPct}%; background:#00E5FF;"></div>
          </div>
        </div>
      </div>
      ${remark}
    `;
  }
}

// ==========================================================================
// L. DEVELOPMENT REPORT PLAIN-TEXT DIGEST DOWNLOADS
// ==========================================================================
function downloadDevelopmentReport(role) {
  const db = isMockSession ? getLocalDB() : liveCache;
  let studentId = "";

  if (role === "player") {
    studentId = currentUser.id;
  } else {
    const selector = document.getElementById("parentStudentSelector");
    studentId = selector ? selector.value : "";
  }

  if (!studentId) {
    showToast("No active student selected for download.", "error");
    return;
  }

  const student = db.profiles.find(p => p.id === studentId);
  const performance = db.performance_reports.find(p => p.player_id === studentId);
  const feedbackRecord = db.coach_feedback.find(f => f.player_id === studentId);
  const attendance = db.attendance.filter(a => a.player_id === studentId);
  const presentCount = attendance.filter(a => a.status === "Present").length;
  const presenceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  const reportText = `=====================================================
RENEGADES SPORTS ARENA - MONTHLY DEVELOPMENT REPORT
=====================================================
Student Name: ${student ? student.name : 'N/A'}
Role: Athlete Profile (Level 1)
Report Month: June 2026
Published By: Coach Rahul Dravid
Date: June 12, 2026

TECHNICAL ASSESSMENTS (Scale 0 - 10)
-----------------------------------------------------
Batting / Hitting score:  ${performance ? performance.batting : 0}/10
Bowling / Pitching score: ${performance ? performance.bowling : 0}/10
Fielding capability:      ${performance ? performance.fielding : 0}/10
Fitness / Stamina:        ${performance ? performance.fitness : 0}/10

ACADEMY PARTICIPATION SUMMARY
-----------------------------------------------------
Session Presence Rate: ${presenceRate}%
Marked Presence:      ${presentCount} Sessions

COACH DEVELOPMENT CRITIQUE NOTES
-----------------------------------------------------
"${performance ? performance.feedback : 'Log critiques and positions regularly.'}"

ACTIVE CHALLENGES & MILESTONE GOALS ASSIGNED
-----------------------------------------------------
${feedbackRecord && feedbackRecord.goals_set.length > 0
      ? feedbackRecord.goals_set.map((g, idx) => `${idx + 1}. [${feedbackRecord.goals_completed && feedbackRecord.goals_completed.includes(idx) ? 'X' : ' '}] ${g}`).join("\n")
      : "No specific goals assigned."}

=====================================================
Renegades Sports Arena - Developing Elite Sports Talent
=====================================================`;

  const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `RSA_Development_Report_${student ? student.name.replace(/\s+/g, '_') : 'Athlete'}_June2026.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("Monthly Development Report downloaded successfully!", "success");
}

// ==========================================================================
// PORTAL UPGRADES: ID CARD & LEADERBOARDS ENGINE
// ==========================================================================

function getPlayerName(playerId) {
  const db = isMockSession ? getLocalDB() : liveCache;
  const profile = db.profiles ? db.profiles.find(p => p.id === playerId || p.user_id === playerId) : null;
  return profile ? profile.name : `Player (${playerId.substring(0, 4)})`;
}

function generateMockQRCodeSVG(data) {
  const size = 21;
  const grid = Array(size).fill().map(() => Array(size).fill(0));
  
  const setFinderPattern = (row, col) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          grid[row + r][col + c] = 1;
        }
      }
    }
  };
  
  setFinderPattern(0, 0); // Top-Left
  setFinderPattern(0, size - 7); // Top-Right
  setFinderPattern(size - 7, 0); // Bottom-Left
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = data.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isFinder = (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);
      if (!isFinder) {
        const bit = ((hash >> (r * c)) & 1) ^ (((r + c) % 2) === 0 ? 1 : 0);
        grid[r][c] = bit;
      }
    }
  }
  
  const boxSize = 10;
  let paths = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 1) {
        paths += `M${c * boxSize},${r * boxSize} h${boxSize} v${boxSize} h-${boxSize} z `;
      }
    }
  }
  
  return `
    <svg viewBox="0 0 ${size * boxSize} ${size * boxSize}" style="width:100%; height:100%;" fill="#000000">
      <path d="${paths}" />
    </svg>
  `;
}

function initPlayerIdCard(profile) {
  const container = document.getElementById("playerIdCardContainer");
  if (!container) return;

  const idLink = `https://renegadessportsarena.com/verify-athlete?id=${profile.id}`;
  const qrCodeSVG = generateMockQRCodeSVG(idLink);

  container.innerHTML = `
    <div class="athlete-id-card" id="printableIdCard">
      <div class="id-card-header">
        <div class="id-card-logo-text">RENEGADES <span>ARENA</span></div>
        <span class="id-card-badge">OFFICIAL ID</span>
      </div>
      <div class="id-card-body">
        <div class="id-card-photo-wrapper">
          <img class="id-card-photo" src="${profile.avatar_url || DEFAULT_BLANK_AVATAR}" alt="${profile.name}">
        </div>
        <div class="id-card-details">
          <h4 class="id-card-name">${profile.name}</h4>
          <span class="id-card-role">${profile.role || 'ATHLETE'}</span>
          <div class="id-card-meta-row">
            <span><strong>Age:</strong> ${profile.age || 'N/A'}</span>
            <span><strong>School:</strong> ${profile.school || 'N/A'}</span>
            <span><strong>UID:</strong> ${profile.id ? profile.id.substring(0, 8).toUpperCase() : 'N/A'}</span>
          </div>
        </div>
      </div>
      <div class="id-card-footer">
        <div class="id-card-qr-box">
          ${qrCodeSVG}
        </div>
        <button class="id-card-print-btn" onclick="printIdCard()">
          Print ID Card
        </button>
      </div>
    </div>
  `;
}

window.printIdCard = function () {
  window.print();
};

function initLeaderboard() {
  const container = document.getElementById("portalLeaderboardContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="leaderboard-wrapper">
      <div class="leaderboard-tabs">
        <button class="leaderboard-tab-btn active" onclick="switchLeaderboardTab('runs')">🏏 Top Runs</button>
        <button class="leaderboard-tab-btn" onclick="switchLeaderboardTab('wickets')">🔴 Top Wickets</button>
        <button class="leaderboard-tab-btn" onclick="switchLeaderboardTab('attendance')">📅 Attendance</button>
      </div>
      <div class="leaderboard-table-container">
        <table class="leaderboard-table">
          <thead>
            <tr id="leaderboardHeader">
              <!-- Header populated dynamically -->
            </tr>
          </thead>
          <tbody id="leaderboardBody">
            <!-- Rows populated dynamically -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  switchLeaderboardTab("runs");
}

window.switchLeaderboardTab = function (category) {
  const tabs = document.querySelectorAll(".leaderboard-tab-btn");
  tabs.forEach(tab => {
    tab.classList.remove("active");
    if (category === "runs" && tab.textContent.includes("Runs")) tab.classList.add("active");
    if (category === "wickets" && tab.textContent.includes("Wickets")) tab.classList.add("active");
    if (category === "attendance" && tab.textContent.includes("Attendance")) tab.classList.add("active");
  });

  const header = document.getElementById("leaderboardHeader");
  const body = document.getElementById("leaderboardBody");
  if (!header || !body) return;

  const db = isMockSession ? getLocalDB() : liveCache;
  const statsList = db.player_statistics || [];
  const attendanceReports = db.attendance_reports || [];

  // Show Skeleton loader while preparing data
  body.innerHTML = `
    <tr>
      <td colspan="4" style="padding: 1.5rem 1rem;">
        <div class="skeleton-loader skeleton-text" style="height: 14px; margin-bottom: 0.8rem; border-radius: 4px;"></div>
        <div class="skeleton-loader skeleton-text short" style="height: 14px; width: 60%; border-radius: 4px;"></div>
      </td>
    </tr>
  `;

  setTimeout(() => {
    let rowsHTML = "";
    if (category === "runs") {
      header.innerHTML = `
        <th>Rank</th>
        <th>Player</th>
        <th>Matches</th>
        <th>Runs Scored</th>
      `;

      const cricketStats = statsList
        .filter(s => s.sport_type === "cricket")
        .sort((a, b) => (b.runs_scored || 0) - (a.runs_scored || 0));

      if (cricketStats.length === 0) {
        body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No runs statistics logged yet.</td></tr>`;
        return;
      }

      cricketStats.forEach((stat, index) => {
        const rank = index + 1;
        const name = getPlayerName(stat.player_id);
        const rankClass = rank <= 3 ? `top-rank-${rank}` : "";
        rowsHTML += `
          <tr class="${rankClass}">
            <td><span class="rank-badge">${rank}</span></td>
            <td><strong>${name}</strong></td>
            <td>${stat.matches_played || 0}</td>
            <td><strong>${stat.runs_scored || 0}</strong></td>
          </tr>
        `;
      });
    } else if (category === "wickets") {
      header.innerHTML = `
        <th>Rank</th>
        <th>Player</th>
        <th>Matches</th>
        <th>Wickets</th>
      `;

      const cricketStats = statsList
        .filter(s => s.sport_type === "cricket")
        .sort((a, b) => (b.wickets_taken || 0) - (a.wickets_taken || 0));

      if (cricketStats.length === 0) {
        body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No wickets statistics logged yet.</td></tr>`;
        return;
      }

      cricketStats.forEach((stat, index) => {
        const rank = index + 1;
        const name = getPlayerName(stat.player_id);
        const rankClass = rank <= 3 ? `top-rank-${rank}` : "";
        rowsHTML += `
          <tr class="${rankClass}">
            <td><span class="rank-badge">${rank}</span></td>
            <td><strong>${name}</strong></td>
            <td>${stat.matches_played || 0}</td>
            <td><strong>${stat.wickets_taken || 0}</strong></td>
          </tr>
        `;
      });
    } else if (category === "attendance") {
      header.innerHTML = `
        <th>Rank</th>
        <th>Player</th>
        <th>Month</th>
        <th>Percentage</th>
      `;

      const sortedReports = [...attendanceReports].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

      if (sortedReports.length === 0) {
        body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No attendance reports logged yet.</td></tr>`;
        return;
      }

      sortedReports.forEach((report, index) => {
        const rank = index + 1;
        const name = getPlayerName(report.player_id);
        const rankClass = rank <= 3 ? `top-rank-${rank}` : "";
        rowsHTML += `
          <tr class="${rankClass}">
            <td><span class="rank-badge">${rank}</span></td>
            <td><strong>${name}</strong></td>
            <td>${report.month ? new Date(report.month).toLocaleString('default', { month: 'short', year: '2-digit' }) : 'N/A'}</td>
            <td><strong>${report.percentage || 0}%</strong></td>
          </tr>
        `;
      });
    }

    body.innerHTML = rowsHTML;
  }, 400); // Small aesthetic loading delay
};

// ==========================================================================
// PORTAL COUPON CODES INVOICES INTEGRATION
// ==========================================================================

async function validatePortalCouponCode(code) {
  if (isMockSession || !window.supabaseClient) {
    if (code.toUpperCase() === 'WELCOME8') {
      return { valid: true, discountPercent: 8, message: "Welcome Coupon Applied! (8% Off)" };
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

    if (data.usage_limit !== null && data.uses_count >= data.usage_limit) {
      return { valid: false, message: "This coupon usage limit has been reached." };
    }

    return {
      valid: true,
      discountPercent: data.discount_percent,
      id: data.id,
      message: `Coupon Applied! (${data.discount_percent}% Off)`
    };
  } catch (err) {
    console.error("Coupon validation error:", err);
    return { valid: false, message: "Error validating coupon. Please try again." };
  }
}

function updatePortalPaymentDisplay(amt) {
  const amountText = document.getElementById("portalPaymentAmountText");
  const qrImg = document.getElementById("portalPaymentQrImg");
  const invId = document.getElementById("payingInvoiceId").value;
  
  if (amountText) {
    amountText.textContent = `Amount: ₹${amt.toLocaleString('en-IN')}`;
  }
  
  if (qrImg) {
    const upiLink = `upi://pay?pa=renegades@upi&pn=Renegades%20Sports%20Arena&am=${amt}&cu=INR&tn=${encodeURIComponent(invId)}`;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`;
  }
}

function initPortalCouponVerification() {
  const applyBtn = document.getElementById("btnApplyPortalCoupon");
  if (!applyBtn) return;

  applyBtn.addEventListener("click", async () => {
    const codeInput = document.getElementById("portalCouponCode");
    const code = codeInput.value.trim().toUpperCase();
    const msgEl = document.getElementById("portalCouponMessage");
    
    if (!code) {
      msgEl.textContent = "Please enter a coupon code.";
      msgEl.style.color = "#EF4444";
      msgEl.style.display = "block";
      return;
    }

    applyBtn.disabled = true;
    applyBtn.textContent = "Checking...";

    const res = await validatePortalCouponCode(code);
    
    applyBtn.disabled = false;
    applyBtn.textContent = "Apply";

    if (res.valid) {
      portalAppliedCoupon = {
        code: code,
        discountPercent: res.discountPercent,
        id: res.id
      };
      const discAmt = Math.round(originalInvoiceAmount * (res.discountPercent / 100));
      const finalAmt = originalInvoiceAmount - discAmt;
      
      updatePortalPaymentDisplay(finalAmt);
      
      msgEl.textContent = `Applied! ${res.discountPercent}% flat discount. Saved ₹${discAmt.toLocaleString('en-IN')}`;
      msgEl.style.color = "#10B981";
      msgEl.style.display = "block";
    } else {
      portalAppliedCoupon = null;
      updatePortalPaymentDisplay(originalInvoiceAmount);
      msgEl.textContent = res.message;
      msgEl.style.color = "#EF4444";
      msgEl.style.display = "block";
    }
  });
}
