/* ==========================================================================
   RENEGADES SPORTS ARENA - ADMIN PORTAL CMS EXTENSIONS
   Logic for MLB Programs, Tournaments, Team Rosters, Bracket Scheduling, Live Match Scoring, and Payments.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Wait for Supabase to connect and initialize database loading
  initAdminExtensions();
});

let adminTournaments = [];
let adminTeams = [];
let adminFixtures = [];
let adminResults = [];

async function initAdminExtensions() {
  if (!window.supabaseClient) {
    console.log("Supabase client not ready, retrying admin extensions init...");
    setTimeout(initAdminExtensions, 500);
    return;
  }

  // 1. Initial load
  await fetchAdminData();

  // 2. Setup MLB Programs CMS
  initMlbProgramsCMS();

  // 3. Setup Tournament CMS
  initTournamentCMS();

  // 4. Setup Fixture Scheduling & Scoring
  initFixtureScoringCMS();

  // 5. Setup Registrations Manager
  initRegistrationsCMS();

  console.log("Admin Extensions initialized successfully.");
}

async function fetchAdminData() {
  try {
    const { data: tournaments } = await window.supabaseClient.from("tournaments").select("*").order("start_date", { ascending: true });
    adminTournaments = tournaments || [];

    const { data: teams } = await window.supabaseClient.from("teams").select("*");
    adminTeams = teams || [];

    const { data: fixtures } = await window.supabaseClient.from("fixtures").select("*").order("match_date", { ascending: true });
    adminFixtures = fixtures || [];

    const { data: results } = await window.supabaseClient.from("results").select("*");
    adminResults = results || [];
  } catch (err) {
    console.error("Error fetching database tables in admin console:", err);
  }
}

/* ==========================================================================
   MLB PROGRAMS CMS
   ========================================================================== */
async function initMlbProgramsCMS() {
  const container = document.getElementById("adminMlbProgramsList");
  const addBtn = document.getElementById("adminAddMlbProgramBtn");
  if (!container || !addBtn) return;

  async function renderPrograms() {
    container.innerHTML = "";
    try {
      const { data, error } = await window.supabaseClient.from("mlb_programs").select("*").order("created_at", { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = `<p style="color:var(--text-grey); padding: 1rem;">No baseball programs found in database. Create one below.</p>`;
        return;
      }

      data.forEach((p, idx) => {
        const row = document.createElement("div");
        row.className = "list-item-row";
        row.innerHTML = `
          <div class="list-item-header">
            <span class="list-item-index">Program ${idx + 1} - ${p.title} (${p.status.toUpperCase()})</span>
            <button type="button" class="btn-remove-item" onclick="deleteMlbProgram('${p.id}')">Delete Program</button>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Program Name</label>
              <input type="text" class="form-input p-title" value="${p.title}" onchange="updateMlbProgramField('${p.id}', 'title', this.value)">
            </div>
            <div class="form-group">
              <label class="form-label">Age Group Division</label>
              <input type="text" class="form-input p-age" value="${p.age_group}" onchange="updateMlbProgramField('${p.id}', 'age_group', this.value)">
            </div>
            <div class="form-group">
              <label class="form-label">Emoji Icon</label>
              <input type="text" class="form-input p-icon" value="${p.icon}" onchange="updateMlbProgramField('${p.id}', 'icon', this.value)">
            </div>
            <div class="form-group">
              <label class="form-label">Coaching Lead</label>
              <input type="text" class="form-input p-coach" value="${p.coach_name || ''}" onchange="updateMlbProgramField('${p.id}', 'coach_name', this.value)">
            </div>
            <div class="form-group form-group-full">
              <label class="form-label">Description</label>
              <textarea class="form-input p-desc" onchange="updateMlbProgramField('${p.id}', 'description', this.value)">${p.description}</textarea>
            </div>
            <div class="form-group form-group-full">
              <label class="form-label">Key Features/Benefits (Comma separated)</label>
              <input type="text" class="form-input p-benefits" value="${p.benefits ? p.benefits.join(', ') : ''}" onchange="updateMlbProgramBenefits('${p.id}', this.value)">
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input p-status" onchange="updateMlbProgramField('${p.id}', 'status', this.value)">
                <option value="published" ${p.status === 'published' ? 'selected' : ''}>Published</option>
                <option value="draft" ${p.status === 'draft' ? 'selected' : ''}>Draft</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Highlights Achievements</label>
              <input type="text" class="form-input p-achievements" value="${p.achievements || ''}" onchange="updateMlbProgramField('${p.id}', 'achievements', this.value)">
            </div>
            <div class="form-group form-group-full">
              <label class="form-label">Program Poster Image Link</label>
              <input type="text" class="form-input p-img" id="mlb-img-${p.id}" value="${p.image_url || ''}" onchange="updateMlbProgramField('${p.id}', 'image_url', this.value)">
              <input type="file" class="form-input" accept="image/*" onchange="uploadMlbImage(this, '${p.id}')" style="margin-top:0.5rem;">
            </div>
          </div>
        `;
        container.appendChild(row);
      });
    } catch (err) {
      console.error("Error rendering MLB programs:", err);
    }
  }

  window.deleteMlbProgram = async (id) => {
    if (!confirm("Are you sure you want to delete this MLB program?")) return;
    try {
      const { error } = await window.supabaseClient.from("mlb_programs").delete().eq("id", id);
      if (error) throw error;
      renderPrograms();
    } catch (err) {
      alert("Failed to delete program: " + err.message);
    }
  };

  window.updateMlbProgramField = async (id, field, value) => {
    try {
      const updates = {};
      updates[field] = value;
      const { error } = await window.supabaseClient.from("mlb_programs").update(updates).eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update MLB program:", err);
    }
  };

  window.updateMlbProgramBenefits = async (id, commaString) => {
    const arr = commaString.split(",").map(b => b.trim()).filter(b => b.length > 0);
    try {
      const { error } = await window.supabaseClient.from("mlb_programs").update({ benefits: arr }).eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update benefits list:", err);
    }
  };

  window.uploadMlbImage = function (input, id) {
    const file = input.files[0];
    if (!file) return;
    compressAdminImage(file, async (base64) => {
      document.getElementById(`mlb-img-${id}`).value = base64;
      await window.updateMlbProgramField(id, "image_url", base64);
    });
  };

  addBtn.addEventListener("click", async () => {
    try {
      const { error } = await window.supabaseClient.from("mlb_programs").insert([{
        title: "New Baseball Program Title",
        age_group: "U-11 / U-13",
        description: "Standard training details for the newly created program.",
        benefits: ["Mechanics checking", "Fun drills", "Speed profiling"],
        icon: "⚾",
        status: "draft"
      }]);
      if (error) throw error;
      renderPrograms();
    } catch (err) {
      alert("Failed to create MLB program: " + err.message);
    }
  });

  // Initial load
  renderPrograms();
}

/* ==========================================================================
   TOURNAMENTS CMS & TEAM ROSTERS
   ========================================================================== */
function initTournamentCMS() {
  const form = document.getElementById("adminTournamentForm");
  const tbody = document.getElementById("adminTournamentsTableBody");
  const rosterSelect = document.getElementById("adminRosterTournamentSelect");

  if (!form || !tbody) return;

  // Render list of tournaments in admin table
  function renderTournaments() {
    tbody.innerHTML = "";
    rosterSelect.innerHTML = "";

    if (adminTournaments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No tournaments scheduled. Create one above!</td></tr>`;
      rosterSelect.innerHTML = `<option value="">No Active Tournaments</option>`;
      return;
    }

    adminTournaments.forEach((t) => {
      const tr = document.createElement("tr");
      const poster = t.poster_url ? `<img src="${t.poster_url}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;">` : "N/A";

      tr.innerHTML = `
        <td>${poster}</td>
        <td><strong>${t.name}</strong></td>
        <td>${t.sport_type}</td>
        <td>${t.age_category}</td>
        <td>${t.start_date} to ${t.end_date}</td>
        <td><span class="badge-status ${t.registration_status}">${t.registration_status}</span></td>
        <td>
          <button type="button" class="btn-save-master" style="padding: 0.4rem 0.6rem; font-size:0.75rem;" onclick="editTournament('${t.id}')">Edit</button>
          <button type="button" class="btn-save-master" style="padding: 0.4rem 0.6rem; font-size:0.75rem; background:#EF4444; box-shadow:none;" onclick="deleteTournament('${t.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);

      // Populate select menus
      const opt = `<option value="${t.id}">${t.name} (${t.sport_type})</option>`;
      rosterSelect.innerHTML += opt;
    });

    // Load roster details for currently selected tournament
    renderRosterList();
  }

  // Handle image upload compression
  let uploadedPosterBase64 = "";
  const posterFileInput = document.getElementById("adminTournamentPosterFile");
  if (posterFileInput) {
    posterFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        compressAdminImage(file, (base64) => {
          uploadedPosterBase64 = base64;
          document.getElementById("adminTournamentPoster").value = base64;
        });
      }
    });
  }

  // Submit form handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("adminTournamentId").value;
    const name = document.getElementById("adminTournamentName").value.trim();
    const sport_type = document.getElementById("adminTournamentSport").value;
    const age_category = document.getElementById("adminTournamentAgeGroup").value;
    const venue = document.getElementById("adminTournamentVenue").value.trim();
    const start_date = document.getElementById("adminTournamentStartDate").value;
    const end_date = document.getElementById("adminTournamentEndDate").value;
    const registration_status = document.getElementById("adminTournamentRegStatus").value;
    const poster_url = document.getElementById("adminTournamentPoster").value.trim() || uploadedPosterBase64;

    if (!name || !venue || !start_date || !end_date) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    const payload = { name, sport_type, age_category, venue, start_date, end_date, registration_status, poster_url };

    try {
      if (id) {
        // Update
        const { error } = await window.supabaseClient.from("tournaments").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await window.supabaseClient.from("tournaments").insert([payload]);
        if (error) throw error;
      }

      form.reset();
      document.getElementById("adminTournamentId").value = "";
      uploadedPosterBase64 = "";
      await fetchAdminData();
      renderTournaments();
      refreshAllSelectors();
    } catch (err) {
      alert("Failed to save tournament: " + err.message);
    }
  });

  // Cancel button
  document.getElementById("adminCancelTournamentBtn").addEventListener("click", () => {
    form.reset();
    document.getElementById("adminTournamentId").value = "";
    uploadedPosterBase64 = "";
  });

  // Global bindings for actions
  window.editTournament = (id) => {
    const t = adminTournaments.find(x => x.id === id);
    if (!t) return;

    document.getElementById("adminTournamentId").value = t.id;
    document.getElementById("adminTournamentName").value = t.name;
    document.getElementById("adminTournamentSport").value = t.sport_type;
    document.getElementById("adminTournamentAgeGroup").value = t.age_category;
    document.getElementById("adminTournamentVenue").value = t.venue;
    document.getElementById("adminTournamentStartDate").value = t.start_date;
    document.getElementById("adminTournamentEndDate").value = t.end_date;
    document.getElementById("adminTournamentRegStatus").value = t.registration_status;
    document.getElementById("adminTournamentPoster").value = t.poster_url || "";
    uploadedPosterBase64 = t.poster_url || "";
  };

  window.deleteTournament = async (id) => {
    if (!confirm("Are you sure you want to delete this tournament? This will delete all registered teams, players, and fixtures!")) return;
    try {
      const { error } = await window.supabaseClient.from("tournaments").delete().eq("id", id);
      if (error) throw error;
      await fetchAdminData();
      renderTournaments();
      refreshAllSelectors();
    } catch (err) {
      alert("Failed to delete tournament: " + err.message);
    }
  };

  // ROSTER TEAM AND PLAYERS LIST
  const teamsContainer = document.getElementById("adminTeamsList");
  rosterSelect.addEventListener("change", renderRosterList);

  async function renderRosterList() {
    if (!teamsContainer) return;
    teamsContainer.innerHTML = "";

    const selectedTourId = rosterSelect.value;
    if (!selectedTourId) {
      teamsContainer.innerHTML = `<p style="color:var(--text-grey); padding: 1rem;">Select a tournament above to view its team roster list.</p>`;
      return;
    }

    const t = adminTournaments.find(x => x.id === selectedTourId);
    const tournamentTeams = adminTeams.filter(x => x.tournament_id === selectedTourId);

    if (tournamentTeams.length === 0) {
      teamsContainer.innerHTML = `<p style="color:var(--text-grey); padding: 1rem;">No teams registered for this tournament. Add a team below.</p>`;
      return;
    }

    for (let idx = 0; idx < tournamentTeams.length; idx++) {
      const team = tournamentTeams[idx];

      // Fetch players inside this team
      const { data: players, error } = await window.supabaseClient
        .from("players")
        .select("*")
        .eq("team_id", team.id)
        .order("created_at", { ascending: true });

      const playerList = players || [];

      const card = document.createElement("div");
      card.className = "list-item-row";
      card.innerHTML = `
        <div class="list-item-header">
          <span class="list-item-index">Team ${idx + 1} - ${team.name}</span>
          <button type="button" class="btn-remove-item" onclick="deleteTeam('${team.id}')">Delete Team</button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Team Name</label>
            <input type="text" class="form-input" value="${team.name}" onchange="updateTeamField('${team.id}', 'name', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Contact Email</label>
            <input type="email" class="form-input" value="${team.contact_email || ''}" onchange="updateTeamField('${team.id}', 'contact_email', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Contact Phone</label>
            <input type="tel" class="form-input" value="${team.contact_phone || ''}" onchange="updateTeamField('${team.id}', 'contact_phone', this.value)">
          </div>
        </div>

        <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-grey); padding-top: 1rem;">
          <h4 style="color:var(--accent); font-size:0.9rem; text-transform:none;">Player Roster (${playerList.length} Players)</h4>
          <div class="table-responsive" style="margin-top:0.75rem;">
            <table class="bookings-table" style="background: var(--bg-input);">
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Age</th>
                  <th>Role / Position</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="roster-players-${team.id}">
                ${playerList.map(p => `
                  <tr>
                    <td><input type="text" class="form-input" value="${p.name}" style="padding:0.4rem; font-size:0.85rem;" onchange="updatePlayerField('${p.id}', 'name', this.value)"></td>
                    <td><input type="number" class="form-input" value="${p.age || ''}" style="padding:0.4rem; font-size:0.85rem;" onchange="updatePlayerField('${p.id}', 'age', this.value)"></td>
                    <td><input type="text" class="form-input" value="${p.role || ''}" style="padding:0.4rem; font-size:0.85rem;" onchange="updatePlayerField('${p.id}', 'role', this.value)"></td>
                    <td><button type="button" class="btn-remove-item" onclick="deletePlayer('${p.id}', '${team.id}')">Delete</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          <button type="button" class="btn-add-item" style="margin-top:1rem; padding: 0.4rem 0.8rem; font-size:0.8rem;" onclick="addPlayerToTeam('${team.id}')">+ Add Player</button>
        </div>
      `;
      teamsContainer.appendChild(card);
    }
  }

  document.getElementById("adminAddTeamBtn").addEventListener("click", async () => {
    const selectedTourId = rosterSelect.value;
    if (!selectedTourId) {
      alert("Please select a tournament first.");
      return;
    }
    try {
      const { error } = await window.supabaseClient.from("teams").insert([{
        tournament_id: selectedTourId,
        name: "New Registered Team",
        contact_email: "team@domain.com",
        contact_phone: "9100000000"
      }]);
      if (error) throw error;
      await fetchAdminData();
      renderRosterList();
    } catch (err) {
      alert("Error adding team: " + err.message);
    }
  });

  window.deleteTeam = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team? All player associations will be removed!")) return;
    try {
      const { error } = await window.supabaseClient.from("teams").delete().eq("id", teamId);
      if (error) throw error;
      await fetchAdminData();
      renderRosterList();
    } catch (err) {
      alert("Failed to delete team: " + err.message);
    }
  };

  window.updateTeamField = async (teamId, field, value) => {
    try {
      const updates = {};
      updates[field] = value;
      const { error } = await window.supabaseClient.from("teams").update(updates).eq("id", teamId);
      if (error) throw error;
      await fetchAdminData();
    } catch (err) {
      console.error("Failed to update team:", err);
    }
  };

  window.addPlayerToTeam = async (teamId) => {
    try {
      const { error } = await window.supabaseClient.from("players").insert([{
        team_id: teamId,
        name: "Player Name",
        age: 12,
        role: "Batsman"
      }]);
      if (error) throw error;
      renderRosterList();
    } catch (err) {
      alert("Error adding player: " + err.message);
    }
  };

  window.deletePlayer = async (playerId, teamId) => {
    try {
      const { error } = await window.supabaseClient.from("players").delete().eq("id", playerId);
      if (error) throw error;
      renderRosterList();
    } catch (err) {
      alert("Failed to delete player: " + err.message);
    }
  };

  window.updatePlayerField = async (playerId, field, value) => {
    try {
      const updates = {};
      updates[field] = value;
      const { error } = await window.supabaseClient.from("players").update(updates).eq("id", playerId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update player info:", err);
    }
  };

  // Run render first
  renderTournaments();
}

/* ==========================================================================
   FIXTURES SCHEDULING & SCORING CMS
   ========================================================================== */
function initFixtureScoringCMS() {
  const scoringSelect = document.getElementById("adminScoringTournamentSelect");
  const tbody = document.getElementById("adminFixturesTableBody");

  if (!scoringSelect || !tbody) return;

  function renderFixturesList() {
    tbody.innerHTML = "";
    const selectedTourId = scoringSelect.value;
    if (!selectedTourId) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Select a tournament above to view scheduled fixtures.</td></tr>`;
      return;
    }

    const tournamentFixtures = adminFixtures.filter(f => f.tournament_id === selectedTourId);
    if (tournamentFixtures.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No fixtures generated. Click a scheduling mode above to generate fixtures list.</td></tr>`;
      return;
    }

    tournamentFixtures.forEach((f) => {
      const teamA = adminTeams.find(t => t.id === f.team_a_id)?.name || "TBD";
      const teamB = adminTeams.find(t => t.id === f.team_b_id)?.name || "TBD";
      const matchDateStr = new Date(f.match_date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${matchDateStr}</td>
        <td><strong>${teamA} vs ${teamB}</strong></td>
        <td>${f.venue}</td>
        <td><span class="badge-status ${f.status}">${f.status}</span></td>
        <td>
          <button type="button" class="btn-save-master" style="padding:0.4rem 0.6rem; font-size:0.75rem; background:#FF6B00;" onclick="openMatchScoringConsole('${f.id}')">Score Match</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  scoringSelect.addEventListener("change", renderFixturesList);

  // AUTO SCHEDULER IMPLEMENTATION
  window.generateFixtures = async (mode) => {
    const selectedTourId = scoringSelect.value;
    if (!selectedTourId) {
      alert("Please select a tournament first.");
      return;
    }

    const t = adminTournaments.find(x => x.id === selectedTourId);
    const tournamentTeams = adminTeams.filter(x => x.tournament_id === selectedTourId);

    if (tournamentTeams.length < 2) {
      alert("Error: At least 2 registered teams are required in this tournament to schedule fixtures!");
      return;
    }

    if (!confirm(`Are you sure you want to auto-schedule fixtures using the ${mode} model? This will replace any existing fixtures for this tournament!`)) return;

    try {
      // 1. Clear old fixtures
      await window.supabaseClient.from("fixtures").delete().eq("tournament_id", selectedTourId);

      const generated = [];
      const venue = t.venue || "Renegades Sports Arena Turf";
      const baseDate = new Date(t.start_date);

      if (mode === 'knockout') {
        // Simple Knockout scheduler
        // Pairs teams sequentially. E.g. 4 teams -> Team 1 vs 2, Team 3 vs 4, and a final placeholder
        const teamCount = tournamentTeams.length;

        // Schedule Semifinals
        for (let i = 0; i < Math.floor(teamCount / 2); i++) {
          const matchDate = new Date(baseDate);
          matchDate.setHours(9 + i * 3, 0, 0); // 9:00 AM, 12:00 PM, etc.

          generated.push({
            tournament_id: selectedTourId,
            team_a_id: tournamentTeams[i * 2].id,
            team_b_id: tournamentTeams[i * 2 + 1].id,
            match_date: matchDate.toISOString(),
            venue,
            status: "scheduled"
          });
        }

        // Schedule Championship Final Placeholder (To be played by winners of Semis)
        const finalDate = new Date(baseDate);
        finalDate.setDate(finalDate.getDate() + 1); // Next day
        finalDate.setHours(15, 0, 0); // 3:00 PM

        // Insert placeholder teams or just re-add first two teams for bracket display
        generated.push({
          tournament_id: selectedTourId,
          team_a_id: tournamentTeams[0].id,
          team_b_id: tournamentTeams[1].id,
          match_date: finalDate.toISOString(),
          venue,
          status: "scheduled"
        });
      } else {
        // Round Robin schedule
        // Every team plays every other team once
        let dayOffset = 0;
        for (let i = 0; i < tournamentTeams.length; i++) {
          for (let j = i + 1; j < tournamentTeams.length; j++) {
            const matchDate = new Date(baseDate);
            matchDate.setDate(matchDate.getDate() + dayOffset);
            matchDate.setHours(16, 0, 0); // 4:00 PM evening slot

            generated.push({
              tournament_id: selectedTourId,
              team_a_id: tournamentTeams[i].id,
              team_b_id: tournamentTeams[j].id,
              match_date: matchDate.toISOString(),
              venue,
              status: "scheduled"
            });

            dayOffset++;
          }
        }
      }

      // Bulk insert into Supabase
      const { error } = await window.supabaseClient.from("fixtures").insert(generated);
      if (error) throw error;

      await fetchAdminData();
      renderFixturesList();
    } catch (err) {
      alert("Error scheduling fixtures: " + err.message);
    }
  };

  window.clearFixtures = async () => {
    const selectedTourId = scoringSelect.value;
    if (!selectedTourId) return;

    if (!confirm("Are you sure you want to clear all fixtures and scoring entries for this tournament?")) return;
    try {
      const { error } = await window.supabaseClient.from("fixtures").delete().eq("tournament_id", selectedTourId);
      if (error) throw error;
      await fetchAdminData();
      renderFixturesList();
    } catch (err) {
      alert("Error clearing fixtures: " + err.message);
    }
  };

  // LIVE SCORER CONSOLE PANEL BINDINGS
  const scorerConsole = document.getElementById("adminMatchScorerConsole");
  const scoringForm = document.getElementById("adminMatchScoringForm");

  window.openMatchScoringConsole = function (matchId) {
    const m = adminFixtures.find(x => x.id === matchId);
    if (!m) return;

    const t = adminTournaments.find(x => x.id === m.tournament_id);
    const teamA = adminTeams.find(x => x.id === m.team_a_id)?.name || "Team A";
    const teamB = adminTeams.find(x => x.id === m.team_b_id)?.name || "Team B";

    document.getElementById("scoringMatchId").value = m.id;
    document.getElementById("scoringSportType").value = t.sport_type;
    document.getElementById("scoringMatchHeader").textContent = `${teamA} vs ${teamB} (${t.sport_type})`;
    document.getElementById("scoringMatchStatus").value = m.status;
    document.getElementById("scoringInningsStatus").value = m.current_innings_status || "";

    // Toggle panels depending on sport type
    const isCricket = t.sport_type === "Cricket";
    document.getElementById("cricketScoringInputs").style.display = isCricket ? "block" : "none";
    document.getElementById("baseballScoringInputs").style.display = !isCricket ? "block" : "none";

    // Populate Cricket scoring inputs
    if (isCricket) {
      document.getElementById("lblCricketRunsA").textContent = `${teamA} Runs`;
      document.getElementById("lblCricketWicketsA").textContent = `${teamA} Wickets`;
      document.getElementById("lblCricketOversA").textContent = `${teamA} Overs`;
      document.getElementById("cricketRunsA").value = m.cricket_runs_a || 0;
      document.getElementById("cricketWicketsA").value = m.cricket_wickets_a || 0;
      document.getElementById("cricketOversA").value = m.cricket_overs_a || 0;

      document.getElementById("lblCricketRunsB").textContent = `${teamB} Runs`;
      document.getElementById("lblCricketWicketsB").textContent = `${teamB} Wickets`;
      document.getElementById("lblCricketOversB").textContent = `${teamB} Overs`;
      document.getElementById("cricketRunsB").value = m.cricket_runs_b || 0;
      document.getElementById("cricketWicketsB").value = m.cricket_wickets_b || 0;
      document.getElementById("cricketOversB").value = m.cricket_overs_b || 0;
    } else {
      // Baseball
      document.getElementById("baseballInningNum").value = m.baseball_innings || 1;

      document.getElementById("lblBaseballRunsA").textContent = `${teamA} Runs`;
      document.getElementById("lblBaseballHitsA").textContent = `${teamA} Hits`;
      document.getElementById("lblBaseballErrorsA").textContent = `${teamA} Errors`;
      document.getElementById("baseballRunsA").value = m.baseball_runs_a || 0;
      document.getElementById("baseballHitsA").value = m.baseball_hits_a || 0;
      document.getElementById("baseballErrorsA").value = m.baseball_errors_a || 0;

      document.getElementById("lblBaseballRunsB").textContent = `${teamB} Runs`;
      document.getElementById("lblBaseballHitsB").textContent = `${teamB} Hits`;
      document.getElementById("lblBaseballErrorsB").textContent = `${teamB} Errors`;
      document.getElementById("baseballRunsB").value = m.baseball_runs_b || 0;
      document.getElementById("baseballHitsB").value = m.baseball_hits_b || 0;
      document.getElementById("baseballErrorsB").value = m.baseball_errors_b || 0;
    }

    // Populate Winner drop down in complete section
    const winnerSelect = document.getElementById("scoringWinnerId");
    winnerSelect.innerHTML = `
      <option value="">Select Winner</option>
      <option value="${m.team_a_id}">${teamA}</option>
      <option value="${m.team_b_id}">${teamB}</option>
      <option value="draw">Draw / Tie / No Result</option>
    `;

    // Fetch existing result if completed
    const result = adminResults.find(r => r.fixture_id === m.id);
    if (result) {
      winnerSelect.value = result.winner_id || (result.score_details?.includes("Tie") || result.score_details?.includes("Draw") ? "draw" : "");
      document.getElementById("scoringResultDetails").value = result.score_details || "";
      document.getElementById("scoringMvp").value = result.mvp_player || "";
      document.getElementById("scoringAwards").value = result.awards_details || "";
      document.getElementById("scoringPhoto").value = result.photo_url || "";
    } else {
      document.getElementById("scoringResultDetails").value = "";
      document.getElementById("scoringMvp").value = "";
      document.getElementById("scoringAwards").value = "";
      document.getElementById("scoringPhoto").value = "";
    }

    // Show/Hide complete section based on status selection
    toggleCompleteInputs(m.status);

    scorerConsole.style.display = "block";
    scorerConsole.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Handle scoring photo file base64 uploads
  let scoringBase64Photo = "";
  const scoringPhotoFileInput = document.getElementById("scoringPhotoFile");
  if (scoringPhotoFileInput) {
    scoringPhotoFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        compressAdminImage(file, (base64) => {
          scoringBase64Photo = base64;
          document.getElementById("scoringPhoto").value = base64;
        });
      }
    });
  }

  // Toggle complete panel display helper
  function toggleCompleteInputs(statusVal) {
    document.getElementById("completedMatchInputs").style.display = statusVal === "completed" ? "block" : "none";
  }

  document.getElementById("scoringMatchStatus").addEventListener("change", (e) => {
    toggleCompleteInputs(e.target.value);
  });

  document.getElementById("adminCloseScorerBtn").addEventListener("click", () => {
    scorerConsole.style.display = "none";
    scoringForm.reset();
    scoringBase64Photo = "";
  });

  scoringForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("scoringMatchId").value;
    const sport = document.getElementById("scoringSportType").value;
    const status = document.getElementById("scoringMatchStatus").value;
    const current_innings_status = document.getElementById("scoringInningsStatus").value.trim();

    const updates = { status, current_innings_status };

    if (sport === 'Cricket') {
      updates.cricket_runs_a = parseInt(document.getElementById("cricketRunsA").value) || 0;
      updates.cricket_wickets_a = parseInt(document.getElementById("cricketWicketsA").value) || 0;
      updates.cricket_overs_a = parseFloat(document.getElementById("cricketOversA").value) || 0;

      updates.cricket_runs_b = parseInt(document.getElementById("cricketRunsB").value) || 0;
      updates.cricket_wickets_b = parseInt(document.getElementById("cricketWicketsB").value) || 0;
      updates.cricket_overs_b = parseFloat(document.getElementById("cricketOversB").value) || 0;
    } else {
      updates.baseball_innings = parseInt(document.getElementById("baseballInningNum").value) || 1;

      updates.baseball_runs_a = parseInt(document.getElementById("baseballRunsA").value) || 0;
      updates.baseball_hits_a = parseInt(document.getElementById("baseballHitsA").value) || 0;
      updates.baseball_errors_a = parseInt(document.getElementById("baseballErrorsA").value) || 0;

      updates.baseball_runs_b = parseInt(document.getElementById("baseballRunsB").value) || 0;
      updates.baseball_hits_b = parseInt(document.getElementById("baseballHitsB").value) || 0;
      updates.baseball_errors_b = parseInt(document.getElementById("baseballErrorsB").value) || 0;
    }

    try {
      // Call public.submit_fixture_scoring RPC for transactional consistency
      const winnerVal = status === 'completed' ? document.getElementById("scoringWinnerId").value : '';
      const winner_id = winnerVal === 'draw' || winnerVal === '' ? null : winnerVal;
      const score_details = status === 'completed' ? document.getElementById("scoringResultDetails").value.trim() : null;
      const mvp_player = status === 'completed' ? document.getElementById("scoringMvp").value.trim() : null;
      const awards_details = status === 'completed' ? document.getElementById("scoringAwards").value.trim() : null;
      const photo_url = status === 'completed' ? (document.getElementById("scoringPhoto").value.trim() || scoringBase64Photo) : null;

      const { error } = await window.supabaseClient.rpc("submit_fixture_scoring", {
        p_fixture_id: id,
        p_status: status,
        p_current_innings_status: current_innings_status,
        p_cricket_runs_a: updates.cricket_runs_a || 0,
        p_cricket_wickets_a: updates.cricket_wickets_a || 0,
        p_cricket_overs_a: updates.cricket_overs_a || 0.0,
        p_cricket_runs_b: updates.cricket_runs_b || 0,
        p_cricket_wickets_b: updates.cricket_wickets_b || 0,
        p_cricket_overs_b: updates.cricket_overs_b || 0.0,
        p_baseball_innings: updates.baseball_innings || 1,
        p_baseball_runs_a: updates.baseball_runs_a || 0,
        p_baseball_hits_a: updates.baseball_hits_a || 0,
        p_baseball_errors_a: updates.baseball_errors_a || 0,
        p_baseball_runs_b: updates.baseball_runs_b || 0,
        p_baseball_hits_b: updates.baseball_hits_b || 0,
        p_baseball_errors_b: updates.baseball_errors_b || 0,
        p_winner_id: winner_id,
        p_score_details: score_details,
        p_mvp_player: mvp_player,
        p_awards_details: awards_details,
        p_photo_url: photo_url
      });

      if (error) throw error;

      scorerConsole.style.display = "none";
      scoringForm.reset();
      scoringBase64Photo = "";

      await fetchAdminData();
      renderFixturesList();
    } catch (err) {
      alert("Failed to confirm match scores: " + err.message);
    }
  });

  // Initial load
  renderFixturesList();
}

/* ==========================================================================
   REGISTRATIONS CMS
   ========================================================================== */
function initRegistrationsCMS() {
  const regsSelect = document.getElementById("adminRegsTournamentSelect");
  const paymentFilter = document.getElementById("adminRegsPaymentFilter");
  const tbody = document.getElementById("adminRegistrationsTableBody");
  const exportBtn = document.getElementById("adminExportRegsCsvBtn");

  if (!regsSelect || !tbody) return;

  let tournamentRegistrations = [];

  async function renderRegistrations() {
    tbody.innerHTML = "";
    document.getElementById("adminRegsTableEmpty").style.display = "none";

    const selectedTourId = regsSelect.value;
    if (!selectedTourId) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Select a tournament above to view registrations.</td></tr>`;
      return;
    }

    try {
      const { data, error } = await window.supabaseClient
        .from("registrations")
        .select("*")
        .eq("tournament_id", selectedTourId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      tournamentRegistrations = data || [];

      // Filter by payment status selection
      const statusVal = paymentFilter.value;
      const filtered = statusVal === 'all'
        ? tournamentRegistrations
        : tournamentRegistrations.filter(r => r.payment_status === statusVal);

      // Render stats counters
      updateRegsStatsCounters(tournamentRegistrations);

      if (filtered.length === 0) {
        document.getElementById("adminRegsTableEmpty").style.display = "block";
        return;
      }

      filtered.forEach(r => {
        const tr = document.createElement("tr");
        const typeText = r.registration_type === 'team' ? "🏆 Team Entry" : "👤 Individual";
        const contactHtml = `Email: ${r.contact_email}<br>WA: ${r.contact_phone}`;
        const paymentBadge = `<span class="badge-status ${r.payment_status}">${r.payment_status}</span>`;

        tr.innerHTML = `
          <td><strong>${r.registrant_name}</strong></td>
          <td>${typeText}</td>
          <td><span style="font-size:0.8rem; line-height:1.2;">${contactHtml}</span></td>
          <td>${r.age_category}</td>
          <td><code style="color:var(--accent-primary);">${r.qr_pass_code}</code></td>
          <td>${paymentBadge}</td>
          <td>
            <button type="button" class="btn-save-master" style="padding:0.4rem; font-size:0.75rem;" onclick="toggleRegPayment('${r.id}', '${r.payment_status}')">Toggle Payment</button>
            <button type="button" class="btn-save-master" style="padding:0.4rem; font-size:0.75rem; background:#3B82F6;" onclick="triggerMockNotifyEmail('${r.registrant_name}', '${r.contact_email}')">Notify</button>
            <button type="button" class="btn-save-master" style="padding:0.4rem; font-size:0.75rem; background:#EF4444; box-shadow:none;" onclick="deleteRegistration('${r.id}')">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error("Failed to render registrations list:", err);
    }
  }

  function updateRegsStatsCounters(list) {
    const total = list.length;
    const paid = list.filter(r => r.payment_status === 'paid').length;
    const pending = total - paid;

    document.getElementById("totalRegsCount").textContent = total;
    document.getElementById("paidRegsCount").textContent = paid;
    document.getElementById("pendingRegsCount").textContent = pending;
  }

  regsSelect.addEventListener("change", renderRegistrations);
  paymentFilter.addEventListener("change", renderRegistrations);

  window.toggleRegPayment = async (id, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      const { error } = await window.supabaseClient.from("registrations").update({ payment_status: newStatus }).eq("id", id);
      if (error) throw error;
      renderRegistrations();
    } catch (err) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  window.deleteRegistration = async (id) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;
    try {
      const { error } = await window.supabaseClient.from("registrations").delete().eq("id", id);
      if (error) throw error;
      renderRegistrations();
    } catch (err) {
      alert("Failed to delete entry: " + err.message);
    }
  };

  // Mock notify trigger
  window.triggerMockNotifyEmail = (name, email) => {
    alert(`MOCK NOTIFICATION: Automated Confirmation QR Pass ticket has been dispatched successfully to: ${name} (${email})!`);
  };

  // CSV Exporter
  exportBtn.addEventListener("click", () => {
    const selectedTourId = regsSelect.value;
    if (!selectedTourId) return;

    const t = adminTournaments.find(x => x.id === selectedTourId);
    if (tournamentRegistrations.length === 0) {
      alert("No registrations available to export for this tournament.");
      return;
    }

    // Build CSV Content
    let csv = "Name,Registration Type,Email,Phone,Category,QR Passcode,Payment Status,Date Registered\n";
    tournamentRegistrations.forEach(r => {
      csv += `"${r.registrant_name}","${r.registration_type}","${r.contact_email}","${r.contact_phone}","${r.age_category}","${r.qr_pass_code}","${r.payment_status}","${r.created_at}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Registrations-${t?.name.replace(/[^a-zA-Z0-9]/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Populate Select Menu
  function populateRegsTournamentDropdown() {
    regsSelect.innerHTML = "";
    if (adminTournaments.length === 0) {
      regsSelect.innerHTML = `<option value="">No Active Tournaments</option>`;
      return;
    }
    adminTournaments.forEach(t => {
      regsSelect.innerHTML += `<option value="${t.id}">${t.name} (${t.sport_type})</option>`;
    });
  }

  // Initial load
  populateRegsTournamentDropdown();
  renderRegistrations();
}

/* ==========================================================================
   HELPER UTILITIES
   ========================================================================== */
function refreshAllSelectors() {
  const selectors = [
    document.getElementById("adminRosterTournamentSelect"),
    document.getElementById("adminScoringTournamentSelect"),
    document.getElementById("adminRegsTournamentSelect")
  ];

  selectors.forEach(select => {
    if (!select) return;
    const prevVal = select.value;
    select.innerHTML = "";

    if (adminTournaments.length === 0) {
      select.innerHTML = `<option value="">No Active Tournaments</option>`;
      return;
    }

    adminTournaments.forEach(t => {
      select.innerHTML += `<option value="${t.id}">${t.name} (${t.sport_type})</option>`;
    });

    // Re-select previous value if still exists
    if (adminTournaments.some(t => t.id === prevVal)) {
      select.value = prevVal;
    }
  });
}

// Image compression helper using Canvas
function compressAdminImage(file, callback) {
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
