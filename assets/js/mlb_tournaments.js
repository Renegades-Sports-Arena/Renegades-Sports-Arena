/* ==========================================================================
   RENEGADES SPORTS ARENA - MLB & TOURNAMENT MANAGEMENT MODULE
   Core Logic, Supabase Integration, Payments, and Real-Time scores
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Particles Background
  initFloatingParticles("mlb-particles", 20);

  // 2. Initialize Tournament Dashboard Tabs
  initDashboardTabs();

  // 3. Wait for Supabase to connect and initialize database loading
  initDatabaseData();
  initTourCouponVerification();
});

/* ==========================================================================
   PARTICLE BACKGROUND ENGINE
   ========================================================================== */
function initFloatingParticles(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "floating-particle";
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    p.style.animationDuration = `${5 + Math.random() * 5}s`;
    container.appendChild(p);
  }
}

/* ==========================================================================
   TABS NAVIGATION
   ========================================================================== */
function initDashboardTabs() {
  const tabBtns = document.querySelectorAll(".dash-tab-btn");
  const tabContents = document.querySelectorAll(".tournament-tab-content");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.style.display = "none");

      btn.classList.add("active");
      const targetTab = btn.getAttribute("data-tab");
      const targetContent = document.getElementById(`tabContent-${targetTab}`);
      if (targetContent) {
        targetContent.style.display = "block";
      }
    });
  });
}

/* ==========================================================================
   DATABASE OPERATIONS & REAL-TIME FLOW
   ========================================================================== */
let globalTournaments = [];
let globalFixtures = [];
let globalTeams = [];
let globalResults = [];

async function initDatabaseData() {
  if (!window.supabaseClient) {
    console.log("Supabase client not ready, retrying homepage data fetch...");
    setTimeout(initDatabaseData, 500);
    return;
  }

  // Initial Fetch
  await fetchAllData();

  // Render Page Content
  renderMlbPrograms();
  renderTournaments();
  renderLiveScores();
  populateTournamentSelectors();
  renderFixturesAndBrackets();
  renderPointsStandings();

  // Establish Supabase Real-Time Subscriptions for updates
  subscribeRealTimeUpdates();
}

async function fetchAllData() {
  try {
    // 1. Fetch tournaments
    const { data: tournaments, error: tErr } = await window.supabaseClient
      .from("tournaments")
      .select("*")
      .order("start_date", { ascending: true });
    if (!tErr) globalTournaments = tournaments || [];

    // 2. Fetch teams
    const { data: teams, error: tmErr } = await window.supabaseClient
      .from("teams")
      .select("*");
    if (!tmErr) globalTeams = teams || [];

    // 3. Fetch fixtures
    const { data: fixtures, error: fErr } = await window.supabaseClient
      .from("fixtures")
      .select("*")
      .order("match_date", { ascending: true });
    if (!fErr) globalFixtures = fixtures || [];

    // 4. Fetch results
    const { data: results, error: rErr } = await window.supabaseClient
      .from("results")
      .select("*");
    if (!rErr) globalResults = results || [];

  } catch (err) {
    console.error("Failed to load tournament data from Supabase:", err);
  }
}

function subscribeRealTimeUpdates() {
  // Subscribe to fixtures and results changes
  window.supabaseClient
    .channel("tournament-realtime-scores")
    .on("postgres_changes", { event: "*", schema: "public", table: "fixtures" }, async (payload) => {
      console.log("Real-time match updates received:", payload);
      await fetchAllData();
      renderLiveScores();
      renderFixturesAndBrackets();
      renderPointsStandings();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "results" }, async (payload) => {
      console.log("Real-time results updates received:", payload);
      await fetchAllData();
      renderLiveScores();
      renderFixturesAndBrackets();
      renderPointsStandings();
    })
    .subscribe();
}

/* ==========================================================================
   MLB PROGRAMS RENDERER
   ========================================================================== */
async function renderMlbPrograms() {
  const container = document.getElementById("mlbProgramsGrid");
  if (!container) return;

  try {
    const { data, error } = await window.supabaseClient
      .from("mlb_programs")
      .select("*")
      .eq("status", "published");

    if (error || !data || data.length === 0) {
      console.log("Using static default MLB programs fallback.");
      return; // Keep index.html default placeholders
    }

    container.innerHTML = "";
    data.forEach((p, idx) => {
      const card = document.createElement("div");
      card.className = `mlb-card reveal-element delay-${(idx % 2) + 1} revealed`;
      card.innerHTML = `
        <div class="mlb-card-icon">${p.icon || "⚾"}</div>
        <h3 class="mlb-card-title">${p.title}</h3>
        <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">${p.description}</p>
        ${Array.isArray(p.benefits) ? p.benefits.map(b => `
          <div class="mlb-card-bullet">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${b}</span>
          </div>
        `).join("") : ""}
        ${p.coach_name ? `<div style="margin-top: 1.5rem; font-size: 0.8rem; border-top: 1px dashed var(--glass-border); padding-top: 0.75rem;"><strong style="color: var(--accent-primary);">Coach:</strong> ${p.coach_name}</div>` : ""}
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading MLB programs:", err);
  }
}

/* ==========================================================================
   ACTIVE TOURNAMENTS RENDERER
   ========================================================================== */
function renderTournaments() {
  const container = document.getElementById("homepageTournamentsGrid");
  if (!container) return;

  container.innerHTML = "";
  if (globalTournaments.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">
        No active tournaments listed at this moment. Stay tuned!
      </div>
    `;
    return;
  }

  globalTournaments.forEach((t) => {
    const card = document.createElement("div");
    card.className = "tournament-card reveal-element revealed";
    
    // Status text and class mapping
    const regStatus = t.registration_status || "open";
    const statusText = regStatus.toUpperCase();

    // Default backdrop poster fallback
    const poster = t.poster_url || "https://images.unsplash.com/photo-1540747737956-37872404471d?auto=format&fit=crop&w=400&q=80";

    card.innerHTML = `
      <div class="tournament-card-header" style="background-image: url('${poster}');">
        <span class="tournament-sport-badge">${t.sport_type}</span>
        <span class="tournament-status-badge ${regStatus}">${statusText}</span>
        <h3 class="tournament-name-title">${t.name}</h3>
      </div>
      <div class="tournament-card-body">
        <div class="tournament-meta-detail">
          <span>📍</span> <span>${t.venue}</span>
        </div>
        <div class="tournament-meta-detail">
          <span>📅</span> <span>${t.start_date} to ${t.end_date}</span>
        </div>
        <div class="tournament-meta-detail">
          <span>👦</span> <span>Category: ${t.age_category}</span>
        </div>
      </div>
      <div class="tournament-card-actions">
        ${regStatus === 'open' 
          ? `<button class="btn btn-primary" onclick="openRegistrationFlow('${t.id}', '${t.name}', '${t.age_category}')">REGISTER</button>`
          : `<button class="btn btn-secondary" disabled style="opacity: 0.5; cursor: not-allowed;">CLOSED</button>`
        }
        <button class="btn btn-outline-orange" onclick="switchDashboardTab('brackets', '${t.id}')">FIXTURES</button>
        <button class="btn btn-outline-orange" onclick="switchDashboardTab('standings', '${t.id}')">STANDINGS</button>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ==========================================================================
   LIVE MATCH SCORE TICKER
   ========================================================================== */
function renderLiveScores() {
  const container = document.getElementById("homepageLiveScoresGrid");
  if (!container) return;

  const liveMatches = globalFixtures.filter(f => f.status === "live");
  container.innerHTML = "";

  if (liveMatches.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">
        No matches are currently live. Check the Fixtures tab for schedule records.
      </div>
    `;
    return;
  }

  liveMatches.forEach(m => {
    const teamA = globalTeams.find(t => t.id === m.team_a_id)?.name || "Team A";
    const teamB = globalTeams.find(t => t.id === m.team_b_id)?.name || "Team B";
    const isCricket = m.cricket_runs_a !== undefined || m.cricket_wickets_a !== undefined;

    const card = document.createElement("div");
    card.className = "live-score-card";

    let scoringHtml = "";
    if (isCricket) {
      scoringHtml = `
        <div class="live-score-teams">
          <div class="live-team-score-row">
            <div class="live-team-info">🏏 ${teamA}</div>
            <div class="live-team-score-value">${m.cricket_runs_a}/${m.cricket_wickets_a} <span style="font-size:0.75rem; font-weight:400; color:var(--text-grey);">(${m.cricket_overs_a} ov)</span></div>
          </div>
          <div class="live-team-score-row">
            <div class="live-team-info">🏏 ${teamB}</div>
            <div class="live-team-score-value">${m.cricket_runs_b}/${m.cricket_wickets_b} <span style="font-size:0.75rem; font-weight:400; color:var(--text-grey);">(${m.cricket_overs_b} ov)</span></div>
          </div>
        </div>
        <div class="live-score-details-row">
          <span>${m.current_innings_status || "Match in Progress"}</span>
          <span>Venue: ${m.venue}</span>
        </div>
      `;
    } else {
      // Baseball scoring
      scoringHtml = `
        <div class="live-score-teams">
          <div class="live-team-score-row">
            <div class="live-team-info">⚾ ${teamA}</div>
            <div class="live-team-score-value">${m.baseball_runs_a}</div>
          </div>
          <div class="live-team-score-row">
            <div class="live-team-info">⚾ ${teamB}</div>
            <div class="live-team-score-value">${m.baseball_runs_b}</div>
          </div>
        </div>
        
        <div class="baseball-diamond-card">
          <span style="font-size:0.8rem; font-weight:700; color:var(--accent-primary);">Inning: ${m.baseball_innings}th (${m.current_innings_status || 'Live'})</span>
          <table class="baseball-runs-hits-errors-table">
            <thead>
              <tr><th></th><th>R</th><th>H</th><th>E</th></tr>
            </thead>
            <tbody>
              <tr><td>A</td><td>${m.baseball_runs_a}</td><td>${m.baseball_hits_a}</td><td>${m.baseball_errors_a}</td></tr>
              <tr><td>B</td><td>${m.baseball_runs_b}</td><td>${m.baseball_hits_b}</td><td>${m.baseball_errors_b}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="live-score-details-row">
          <span>Venue: ${m.venue}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="live-score-header">
        <div><span class="live-indicator-dot"></span>LIVE MATCH</div>
        <span style="text-transform: uppercase; letter-spacing: 1px;">Championship Series</span>
      </div>
      ${scoringHtml}
    `;
    container.appendChild(card);
  });
}

/* ==========================================================================
   SELECT TOURNAMENTS DROP-DOWNS
   ========================================================================== */
function populateTournamentSelectors() {
  const bracketSelect = document.getElementById("bracketTournamentSelect");
  const standingsSelect = document.getElementById("standingsTournamentSelect");

  if (!bracketSelect || !standingsSelect) return;

  bracketSelect.innerHTML = "";
  standingsSelect.innerHTML = "";

  if (globalTournaments.length === 0) {
    const opt = `<option value="">No Active Tournaments</option>`;
    bracketSelect.innerHTML = opt;
    standingsSelect.innerHTML = opt;
    return;
  }

  globalTournaments.forEach(t => {
    const opt = `<option value="${t.id}">${t.name} (${t.sport_type})</option>`;
    bracketSelect.innerHTML += opt;
    standingsSelect.innerHTML += opt;
  });

  bracketSelect.addEventListener("change", renderFixturesAndBrackets);
  standingsSelect.addEventListener("change", renderPointsStandings);
}

/* ==========================================================================
   KNOCKOUT BRACKET VISUALIZER
   ========================================================================== */
function renderFixturesAndBrackets() {
  const container = document.getElementById("tournamentBracketContainer");
  const select = document.getElementById("bracketTournamentSelect");
  if (!container || !select) return;

  const tournamentId = select.value;
  if (!tournamentId) {
    container.innerHTML = `<div style="text-align: center; width:100%; color: var(--text-secondary);">Select a tournament to view fixtures bracket list.</div>`;
    return;
  }

  const tournament = globalTournaments.find(t => t.id === tournamentId);
  const matches = globalFixtures.filter(f => f.tournament_id === tournamentId);

  container.innerHTML = "";

  if (matches.length === 0) {
    container.innerHTML = `<div style="text-align: center; width:100%; color: var(--text-secondary); padding: 2rem;">No fixtures scheduled yet for this tournament.</div>`;
    return;
  }

  // Separate matches by date/round groupings. If there are exactly 7 or 15 fixtures, we format as single-elimination.
  // Otherwise, we output a listing grouped by date.
  const isKnockout = matches.length === 1 || matches.length === 3 || matches.length === 7 || matches.length === 15;

  if (isKnockout) {
    // Basic Bracket Builder
    // Group matches into levels. Standard hierarchy for 7 matches (8 teams) is 4 Quarterfinals, 2 Semifinals, 1 Final.
    let rounds = []; // Round 1: Quarters, Round 2: Semis, Round 3: Final
    
    // Sort matches by date
    const sorted = [...matches].sort((a,b) => new Date(a.match_date) - new Date(b.match_date));
    
    if (matches.length === 7) {
      rounds = [
        { name: "Quarterfinals", matches: sorted.slice(0, 4) },
        { name: "Semifinals", matches: sorted.slice(4, 6) },
        { name: "Championship Final", matches: sorted.slice(6, 7) }
      ];
    } else if (matches.length === 3) {
      rounds = [
        { name: "Semifinals", matches: sorted.slice(0, 2) },
        { name: "Championship Final", matches: sorted.slice(2, 3) }
      ];
    } else {
      rounds = [
        { name: "Championship Final", matches: sorted }
      ];
    }

    rounds.forEach(round => {
      const roundCol = document.createElement("div");
      roundCol.className = "bracket-round";
      
      const title = document.createElement("div");
      title.className = "bracket-round-title";
      title.textContent = round.name;
      roundCol.appendChild(title);

      round.matches.forEach(m => {
        const teamA = globalTeams.find(t => t.id === m.team_a_id)?.name || "To Be Decided";
        const teamB = globalTeams.find(t => t.id === m.team_b_id)?.name || "To Be Decided";
        const result = globalResults.find(r => r.fixture_id === m.id);

        const isAWinner = result && result.winner_id === m.team_a_id;
        const isBWinner = result && result.winner_id === m.team_b_id;

        const scoreA = isCricketMatch(m) ? m.cricket_runs_a : m.baseball_runs_a;
        const scoreB = isCricketMatch(m) ? m.cricket_runs_b : m.baseball_runs_b;

        const matchDiv = document.createElement("div");
        matchDiv.className = "bracket-match";
        matchDiv.innerHTML = `
          <div class="bracket-team-row ${isAWinner ? 'winner' : ''}">
            <span class="bracket-team-name">${teamA}</span>
            <span class="bracket-team-score">${m.status === 'completed' ? scoreA : '-'}</span>
          </div>
          <div class="bracket-team-row ${isBWinner ? 'winner' : ''}">
            <span class="bracket-team-name">${teamB}</span>
            <span class="bracket-team-score">${m.status === 'completed' ? scoreB : '-'}</span>
          </div>
          <div style="font-size:0.6rem; color:var(--text-grey); margin-top:0.4rem; padding-left:0.5rem; border-top: 1px dashed rgba(255,255,255,0.04); padding-top:0.3rem;">
            ${new Date(m.match_date).toLocaleDateString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})} | ${m.venue}
          </div>
        `;
        roundCol.appendChild(matchDiv);
      });
      container.appendChild(roundCol);
    });
  } else {
    // Normal List-based visualizer grouped by Date
    const containerCol = document.createElement("div");
    containerCol.className = "bracket-round";
    containerCol.style.width = "100%";
    containerCol.style.maxWidth = "700px";
    containerCol.style.margin = "0 auto";

    const title = document.createElement("div");
    title.className = "bracket-round-title";
    title.textContent = "Scheduled Fixtures Roster";
    containerCol.appendChild(title);

    matches.forEach(m => {
      const teamA = globalTeams.find(t => t.id === m.team_a_id)?.name || "To Be Decided";
      const teamB = globalTeams.find(t => t.id === m.team_b_id)?.name || "To Be Decided";
      const result = globalResults.find(r => r.fixture_id === m.id);

      const scoreA = isCricketMatch(m) 
        ? `${m.cricket_runs_a}/${m.cricket_wickets_a} (${m.cricket_overs_a})` 
        : `Runs: ${m.baseball_runs_a}`;
      const scoreB = isCricketMatch(m) 
        ? `${m.cricket_runs_b}/${m.cricket_wickets_b} (${m.cricket_overs_b})` 
        : `Runs: ${m.baseball_runs_b}`;

      const card = document.createElement("div");
      card.className = "bracket-match";
      card.style.margin = "1rem 0";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
          <span style="font-size:0.7rem; color:var(--accent-primary); text-transform:uppercase; font-weight:800;">${m.status.toUpperCase()} MATCH</span>
          <span style="font-size:0.7rem; color:var(--text-grey);">${new Date(m.match_date).toLocaleDateString('en-IN', {day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <div class="bracket-team-row ${result?.winner_id === m.team_a_id ? 'winner' : ''}">
          <span class="bracket-team-name">${teamA}</span>
          <span class="bracket-team-score">${m.status !== 'scheduled' ? scoreA : '-'}</span>
        </div>
        <div class="bracket-team-row ${result?.winner_id === m.team_b_id ? 'winner' : ''}">
          <span class="bracket-team-name">${teamB}</span>
          <span class="bracket-team-score">${m.status !== 'scheduled' ? scoreB : '-'}</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.5rem; text-align:right;">
          📍 Venue: ${m.venue} ${result?.score_details ? ` | <strong style="color:var(--accent-primary);">${result.score_details}</strong>` : ''}
        </div>
      `;
      containerCol.appendChild(card);
    });
    container.appendChild(containerCol);
  }
}

function isCricketMatch(m) {
  return m.cricket_runs_a !== undefined || m.cricket_wickets_a !== undefined;
}

/* ==========================================================================
   POINTS TABLE RENDERER
   ========================================================================== */
function renderPointsStandings() {
  const tbody = document.getElementById("tournamentStandingsTableBody");
  const select = document.getElementById("standingsTournamentSelect");
  if (!tbody || !select) return;

  const tournamentId = select.value;
  if (!tournamentId) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Select a tournament to view table standings.</td></tr>`;
    return;
  }

  // Filter teams and fixtures for this tournament
  const teams = globalTeams.filter(t => t.tournament_id === tournamentId);
  const matches = globalFixtures.filter(f => f.tournament_id === tournamentId && f.status === "completed");

  tbody.innerHTML = "";

  if (teams.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No teams registered for this tournament.</td></tr>`;
    return;
  }

  // Calculate points on the fly
  const tableData = teams.map(team => {
    let played = 0;
    let won = 0;
    let lost = 0;
    let points = 0;
    let form = []; // Array of 'W' or 'L'

    // Find all completed matches for this team
    const teamMatches = matches.filter(m => m.team_a_id === team.id || m.team_b_id === team.id);
    
    // Sort matches by date to get chronological order for form
    const sortedMatches = [...teamMatches].sort((a,b) => new Date(a.match_date) - new Date(b.match_date));

    sortedMatches.forEach(m => {
      const result = globalResults.find(r => r.fixture_id === m.id);
      if (result) {
        played++;
        if (result.winner_id === team.id) {
          won++;
          points += 2;
          form.push("W");
        } else if (result.winner_id === null) {
          // Draw/Tie
          points += 1;
          form.push("D");
        } else {
          lost++;
          form.push("L");
        }
      }
    });

    return {
      name: team.name,
      played,
      won,
      lost,
      points,
      form: form.slice(-4) // Last 4 matches
    };
  });

  // Sort by Points (descending), then by Wins
  tableData.sort((a, b) => b.points - a.points || b.won - a.won);

  tableData.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${idx + 1}</strong></td>
      <td><strong>${row.name}</strong></td>
      <td>${row.played}</td>
      <td>${row.won}</td>
      <td>${row.lost}</td>
      <td><span style="color:var(--accent-primary); font-weight:800;">${row.points}</span></td>
      <td>
        <div style="display:flex; gap:0.25rem;">
          ${row.form.map(f => `<span class="badge-status ${f === 'W' ? 'paid' : f === 'D' ? 'pending' : 'cancelled'}" style="padding:0.15rem 0.4rem; font-size:0.6rem;">${f}</span>`).join("")}
          ${row.form.length === 0 ? '<span style="color:var(--text-grey); font-size:0.75rem;">-</span>' : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ==========================================================================
   REGISTRATION SYSTEM & UPI PAYMENT SCANNER FLOW
   ========================================================================== */
let tourAppliedCoupon = null;
const originalTourFee = 1500;

window.openRegistrationFlow = function(tournamentId, name, ageCategory) {
  const modal = document.getElementById("registrationModal");
  if (!modal) return;

  // Set hidden values and labels
  document.getElementById("regTournamentId").value = tournamentId;
  document.getElementById("regAgeGroup").value = ageCategory;
  
  // Clear coupon inputs and messages
  tourAppliedCoupon = null;
  const couponInput = document.getElementById("regCouponCode");
  if (couponInput) couponInput.value = "";
  
  const msgEl = document.getElementById("regCouponMessage");
  if (msgEl) {
    msgEl.style.display = "none";
    msgEl.textContent = "";
  }

  // Set default Step 1 visible
  showRegStep(1);
  modal.classList.add("active");
};

// Switch between panels helper
function showRegStep(stepNum) {
  const steps = document.querySelectorAll(".registration-step");
  const dots = document.querySelectorAll(".step-dot");

  steps.forEach(s => s.classList.remove("active"));
  dots.forEach(d => d.classList.remove("active", "completed"));

  const targetStep = document.getElementById(`regStep-${stepNum}`);
  if (targetStep) targetStep.classList.add("active");

  for (let i = 1; i <= 3; i++) {
    const d = document.getElementById(`dot-step${i}`);
    if (d) {
      if (i < stepNum) d.classList.add("completed");
      if (i === stepNum) d.classList.add("active");
    }
  }
}

// Close Modal Bindings
const modalCloseBtn = document.getElementById("closeRegistrationModal");
if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", () => {
    document.getElementById("registrationModal").classList.remove("active");
  });
}

// Step 1 Submit: Proceed to Payment
const regForm = document.getElementById("tournamentRegistrationForm");
if (regForm) {
  regForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();

    if (!name || !email || !phone) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    const discAmt = tourAppliedCoupon ? Math.round(originalTourFee * (tourAppliedCoupon.discountPercent / 100)) : 0;
    const finalAmount = originalTourFee - discAmt;

    // Load QR Code dynamically for simulated UPI
    const paymentQrContainer = document.getElementById("paymentQrCodeContainer");
    const upiLink = `upi://pay?pa=renegadessportsarena@okaxis&pn=Renegades%20Sports%20Arena&am=${finalAmount}&cu=INR&tn=Tournament%20Registration`;
    paymentQrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiLink)}" alt="Scan to Pay">`;

    // Update final amount label in step 2
    const step2P = document.querySelector("#regStep-2 p");
    if (step2P) {
      step2P.innerHTML = `Scan the QR code below from any UPI app (GPay, PhonePe, Paytm) to complete registration fees of <strong class="text-orange">₹${finalAmount.toLocaleString('en-IN')}</strong>.`;
    }

    showRegStep(2);
  });
}

// Back to Form
const btnBackToForm = document.getElementById("btnBackToForm");
if (btnBackToForm) {
  btnBackToForm.addEventListener("click", () => showRegStep(1));
}

// Simulate mock payment
const btnSimulatePayment = document.getElementById("btnSimulatePayment");
if (btnSimulatePayment) {
  btnSimulatePayment.addEventListener("click", async () => {
    btnSimulatePayment.disabled = true;
    btnSimulatePayment.textContent = "PROCESSING...";

    const tournamentId = document.getElementById("regTournamentId").value;
    const regType = document.getElementById("regType").value;
    const registrantName = document.getElementById("regName").value;
    const contactEmail = document.getElementById("regEmail").value;
    const contactPhone = document.getElementById("regPhone").value;
    const ageCategory = document.getElementById("regAgeGroup").value;
    const passCode = "RSA-" + Math.random().toString(36).substr(2, 5).toUpperCase();
    const selectedTournament = globalTournaments.find(t => t.id === tournamentId);
    
    const discAmt = tourAppliedCoupon ? Math.round(originalTourFee * (tourAppliedCoupon.discountPercent / 100)) : 0;
    const finalAmount = originalTourFee - discAmt;

    try {
      // 1. Save registration into Supabase
      const { data, error } = await window.supabaseClient
        .from("registrations")
        .insert([{
          tournament_id: tournamentId,
          registration_type: regType,
          registrant_name: registrantName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          age_category: ageCategory,
          payment_status: "paid",
          qr_pass_code: passCode
        }])
        .select();

      if (error) throw error;

      // 2. Increment coupon uses and insert coupon usage
      if (tourAppliedCoupon && window.supabaseClient) {
        let couponId = tourAppliedCoupon.id;
        
        // Fetch coupon ID if not present
        const { data: couponData } = await window.supabaseClient
          .from("coupon_codes")
          .select("id, uses_count")
          .eq("code", tourAppliedCoupon.code)
          .maybeSingle();

        if (couponData) {
          couponId = couponData.id;
          
          await window.supabaseClient
            .from("coupon_codes")
            .update({ uses_count: couponData.uses_count + 1 })
            .eq("id", couponData.id);

          await window.supabaseClient
            .from("coupon_usage")
            .insert([{
              coupon_id: couponId,
              user_id: null,
              applied_to: 'tournament',
              reference_id: data[0].id,
              discount_amount: discAmt
            }]);
        }
      }

      // 3. Generate and display print ticket pass
      document.getElementById("ticketTournamentName").textContent = selectedTournament?.name || "RSA Championship";
      document.getElementById("ticketRegistrantName").textContent = registrantName;
      document.getElementById("ticketCategory").textContent = ageCategory;
      document.getElementById("ticketPassCodeText").textContent = passCode;

      // QR Pass code encoder
      const ticketQrContainer = document.getElementById("ticketQrImageContainer");
      ticketQrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(passCode)}" alt="RSA Pass QR">`;

      // 4. Send dispatches (email and WhatsApp)
      if (window.sendRegistrationConfirmationEmail) {
        window.sendRegistrationConfirmationEmail(contactEmail, registrantName, selectedTournament?.name || "Renegades Tournament", passCode, ageCategory);
      }
      if (window.WhatsAppNotificationService && window.WhatsAppNotificationService.send) {
        window.WhatsAppNotificationService.send(contactPhone, 'tournament_registration', {
          name: registrantName,
          tournamentName: selectedTournament?.name || "Tournament",
          passCode: passCode
        });
      }

      // 5. Move to Step 3 and trigger success celebrations (confetti)
      btnSimulatePayment.disabled = false;
      btnSimulatePayment.textContent = "CONFIRM MOCK PAYMENT";
      showRegStep(3);

      if (typeof confetti === "function") {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

    } catch (err) {
      console.error("Payment confirmation failed:", err);
      btnSimulatePayment.disabled = false;
      btnSimulatePayment.textContent = "CONFIRM MOCK PAYMENT";
      alert("Error confirming payment. Please retry.");
    }
  });
}

// Print Pass PDF / Layout
const btnPrintTicketPass = document.getElementById("btnPrintTicketPass");
if (btnPrintTicketPass) {
  btnPrintTicketPass.addEventListener("click", () => {
    const box = document.getElementById("ticketPassBox").innerHTML;
    const win = window.open("", "Print Pass", "height=500,width=700");
    win.document.write("<html><head><title>Print Pass - Renegades Arena</title>");
    win.document.write("<style>");
    win.document.write(`
      body { background: #fff; color: #000; font-family: sans-serif; padding: 20px; }
      .ticket-pass { border: 2px dashed #FF6B00; border-radius: 12px; padding: 20px; width: 450px; margin: 0 auto; background: #fafafa; }
      .ticket-header { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px; display: flex; align-items: center; }
      .ticket-body-grid { display: flex; justify-content: space-between; }
      .ticket-details { display: flex; flex-direction: column; gap: 8px; }
      .ticket-info-group { font-size: 11px; color: #555; }
      .ticket-info-group strong { display: block; font-size: 14px; color: #000; }
      .ticket-qr-container { display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .ticket-pass-id { font-size: 12px; font-weight: bold; color: #FF6B00; margin-top: 5px; }
    `);
    win.document.write("</style></head><body>");
    win.document.write(`<div class="ticket-pass">${box}</div>`);
    win.document.write("</body></html>");
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 500);
  });
}

// Done Flow
const btnFinishRegistration = document.getElementById("btnFinishRegistration");
if (btnFinishRegistration) {
  btnFinishRegistration.addEventListener("click", () => {
    document.getElementById("registrationModal").classList.remove("active");
    regForm.reset();
  });
}

// Action button helper to scroll/switch
window.switchDashboardTab = function(tabName, selectTournamentId = null) {
  const btn = document.querySelector(`.dash-tab-btn[data-tab="${tabName}"]`);
  if (btn) btn.click();

  if (selectTournamentId) {
    if (tabName === "brackets") {
      const select = document.getElementById("bracketTournamentSelect");
      if (select) {
        select.value = selectTournamentId;
        renderFixturesAndBrackets();
      }
    } else if (tabName === "standings") {
      const select = document.getElementById("standingsTournamentSelect");
      if (select) {
        select.value = selectTournamentId;
        renderPointsStandings();
      }
    }
  }

  const section = document.getElementById("tournaments");
  if (section) {
    const headerHeight = document.querySelector(".header").clientHeight;
    window.scrollTo({
      top: section.offsetTop - headerHeight,
      behavior: "smooth"
    });
  }
};

// ==========================================================================
// TOURNAMENT COUPON CODES MANAGER
// ==========================================================================

async function validateTourCouponCode(code) {
  if (!window.supabaseClient) {
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

function initTourCouponVerification() {
  const applyBtn = document.getElementById("btnApplyRegCoupon");
  if (!applyBtn) return;

  applyBtn.addEventListener("click", async () => {
    const codeInput = document.getElementById("regCouponCode");
    const code = codeInput.value.trim().toUpperCase();
    const msgEl = document.getElementById("regCouponMessage");
    
    if (!code) {
      msgEl.textContent = "Please enter a coupon code.";
      msgEl.style.color = "#EF4444";
      msgEl.style.display = "block";
      return;
    }

    applyBtn.disabled = true;
    applyBtn.textContent = "Checking...";

    const res = await validateTourCouponCode(code);
    
    applyBtn.disabled = false;
    applyBtn.textContent = "Apply";

    if (res.valid) {
      tourAppliedCoupon = {
        code: code,
        discountPercent: res.discountPercent,
        id: res.id
      };
      
      msgEl.textContent = res.message;
      msgEl.style.color = "#10B981";
      msgEl.style.display = "block";
    } else {
      tourAppliedCoupon = null;
      msgEl.textContent = res.message;
      msgEl.style.color = "#EF4444";
      msgEl.style.display = "block";
    }
  });
}
