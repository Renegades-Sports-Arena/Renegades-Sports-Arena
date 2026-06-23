// Renegades Sports Arena - Configuration Database
// This file controls all the text, numbers, images, and features on the website.
// The Admin Panel will update these values in localStorage for live previews,
// and allow exporting this file to persist changes permanently.

const DEFAULT_CONFIG = {
  general: {
    academyName: "RENEGADES SPORTS ARENA",
    tagline: "Train Like a Champion. Play Like a Renegade.",
    phone: "+91 97311 34665",
    email: "renegadessportsarena@gmail.com",
    address: "Byandahalli, Bengaluru, Karnataka 562130",
    whatsappNumber: "919731134665",
    whatsappNumber2: "",
    googleMapsEmbed: "https://maps.google.com/maps?q=Byandahalli%2C%20Bengaluru%2C%20Karnataka%20562130&t=&z=14&ie=UTF8&iwloc=&output=embed",
    instagramUrl: "https://www.instagram.com/p/DYlwjXOxmg2/?igsh=MThxNWJkbWRqNDRodA==",
    facebookUrl: "https://facebook.com/renegadessports",
    youtubeUrl: "https://youtube.com/c/renegadessports",
    googleBusinessUrl: "https://g.page/renegades-sports-arena/review",
    announcementEnabled: true,
    announcementText: "🔥 Admissions open for the 2026 Season! Book a free turf trial session now.",
    announcementBgColor: "#FF6B00",
    announcementLink: "#contact"
  },
  hero: {
    title: "RENEGADES SPORTS ARENA",
    subheading: "Train. Get Exposure. Get Equipped. Get Opportunities.",
    tagline: "Building Cricketers. Creating Opportunities. Connecting Talent to Competitive Cricket.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cricket-batsman-hitting-a-ball-40294-large.mp4",
    fallbackImageUrl: "assets/images/facility_turf.jpg",
    primaryCtaText: "JOIN THE ACADEMY",
    secondaryCtaText: "BOOK A FREE TRIAL",
    shopCtaText: "EXPLORE THE SHOP"
  },
  whyChooseUs: {
    title: "Why Players Choose Renegades",
    cards: [
      {
        icon: "🏏",
        title: "Professional Cricket Coaching",
        description: "Professional division league players delivering personalized training plans for players of all age groups."
      },
      {
        icon: "🏟️",
        title: "Advanced Turf & Box Net Training",
        description: "Practice in premium all-weather Astro Turf grounds and modern box nets."
      },
      {
        icon: "🏆",
        title: "Match Exposure Opportunities",
        description: "Participate in local tournaments, friendly league matches, and internal academy championships regularly."
      },
      {
        icon: "🧠",
        title: "Physical & Mental Development",
        description: "Integrated strength & conditioning programs, dietary counseling, and sports mental health guidance."
      },
      {
        icon: "📊",
        title: "Performance Tracking",
        description: "State-of-the-art video analysis sessions, speed radar measurements, and regular digital reports."
      },
      {
        icon: "🚀",
        title: "Career Development Pathways",
        description: "Direct talent-scouting links and structural pathways into KSCA-affiliated division clubs and league selections."
      }
    ]
  },
  futureArena: {
    badge: "NEW TURF GROUND PROJECT",
    title: "THE FUTURE STARS PRACTICE ARENA",
    subtitle: "Double Turf Wicket Ground Development",
    description: "Renegades Sports Arena is proud to announce our upcoming Turf Ground in preparation. This premier facility is being custom-built specifically for our future star players' practice sessions and realistic high-performance training. Transitioning players from enclosed nets to real-match conditions, the ground features state-of-the-art turf pitches and boundary drill zones designed to nurture the next generation of champions.",
    image: "assets/images/cricket_ground_backdrop.jpg",
    features: [
      "Double-Turf Wicket Pitch (Engineered for professional bounce & spin)",
      "Full-Scale Fielding & Boundary Practice Zones",
      "Professional Match Simulation Setup",
      "Interactive Player Performance Analysis Vantage Points"
    ]
  },
  clubs: {
    title: "ASSOCIATED CLUB NETWORK",
    subheading: "Renegades Sports Arena works closely with multiple KSCA-registered cricket clubs, creating opportunities for deserving players to gain valuable match exposure and competitive cricket experience.",
    disclaimer: "Selection opportunities are based on player performance, commitment, and available club requirements.",
    list: [
      { name: "Jolly Cricket Club", logoText: "JCC" },
      { name: "Cavaliers CC", logoText: "CCC" },
      { name: "Bangalore Sports Club", logoText: "BSC" },
      { name: "Rajajinagar Cricketers", logoText: "RC" },
      { name: "Victory CC", logoText: "VCC" }
    ]
  },
  programs: {
    title: "PLAYER DEVELOPMENT PROGRAMS",
    subheading: "Structured development curricula designed to cultivate champions from grassroots to high-performance league standards.",
    list: [
      {
        category: "junior",
        title: "Junior Cricket Development",
        ageGroup: "Under-10 / Under-14 / Under-16 / Under-19",
        description: "Grassroots training targeting basic techniques, coordination, and game concepts.",
        benefits: ["Structured program guidelines", "Weekly internal match play", "Fundamental coordination drills"],
        icon: "👶"
      },
      {
        category: "elite",
        title: "Elite Performance Program",
        ageGroup: "Age 15 & Above",
        description: "Intense, tactical program preparing players for division selection and state-level cricket.",
        benefits: ["Advanced video analytics", "Specific tactical scenarios", "High-intensity fitness trials"],
        icon: "⚡"
      },
      {
        category: "junior",
        title: "Weekend Coaching Program",
        ageGroup: "All Age Groups",
        description: "Flexible, weekend sessions for schoolgoers focusing on core batting and bowling skills.",
        benefits: ["Coaches match scenario training", "Turf net access", "Flexible schedule"],
        icon: "📅"
      },
      {
        category: "specialist",
        title: "Personal Coaching Sessions",
        ageGroup: "All Age Groups",
        description: "One-on-one intensive sessions with master coaches to resolve technique errors.",
        benefits: ["1-on-1 personalized attention", "Custom bowler/batsman focus", "Rapid error correction"],
        icon: "👤"
      },
      {
        category: "specialist",
        title: "Batting Excellence Program",
        ageGroup: "Age 12 & Above",
        description: "Specialized training dealing with spin play, pacing innings, stroke selection, and power-hitting.",
        benefits: ["Bowling machine practice", "Range hitting drills", "Mental triggers calibration"],
        icon: "🏏"
      },
      {
        category: "specialist",
        title: "Fast Bowling Development",
        ageGroup: "Age 12 & Above",
        description: "Biomechanical reviews, run-up optimization, speed measurement, and line-length command.",
        benefits: ["Injury prevention screens", "Radar speed testing", "Variations mastery"],
        icon: "🔥"
      },
      {
        category: "specialist",
        title: "Spin Bowling Development",
        ageGroup: "Age 12 & Above",
        description: "Spin revolutions management, flight/dip tactics, variations, and crease usage.",
        benefits: ["Target bowling drill grids", "Mental tactical mapping", "Release angle diagnostics"],
        icon: "🌀"
      },
      {
        category: "specialist",
        title: "Match Preparation Program",
        ageGroup: "Age 14 & Above",
        description: "Real-game simulations, pressure scenario management, and leadership skills.",
        benefits: ["Turf match practice", "Scenario simulations", "Post-match video reviews"],
        icon: "🏆"
      },
      {
        category: "elite",
        title: "Women's Cricket Program",
        ageGroup: "All Age Groups",
        description: "High-performance training curriculum for women cricketers, focusing on tactical drills, physical fitness, and direct paths to league trials.",
        benefits: ["Dedicated coaching panels", "Match simulation exposure", "Trials with KSCA-affiliated clubs"],
        icon: "assets/images/logo_women.png"
      }
    ]
  },
  renegadesPathway: {
    title: "From Beginner to Competitive Cricket",
    tagline: "TRAIN. DEVELOP. PERFORM. PROGRESS.",
    description: "Renegades Sports Arena provides structured development pathways and exposure opportunities through our established network within the KSCA cricket ecosystem. We do not guarantee selections or placements.",
    steps: [
      {
        step: "Step 1",
        title: "Join Renegades Sports Arena",
        description: "Begin your journey by joining the academy, assessing your core skills, and setting your growth benchmarks."
      },
      {
        step: "Step 2",
        title: "Professional Coaching & Skill Development",
        description: "Receive elite technical training from certified coaches and division league players to establish robust batting and bowling mechanics."
      },
      {
        step: "Step 3",
        title: "Performance Tracking & Match Analytics",
        description: "Leverage state-of-the-art video diagnostics and bowling speed radars to analyze technique and record metrics."
      },
      {
        step: "Step 4",
        title: "Competitive Match Exposure",
        description: "Participate in simulated pressure nets, weekend leagues, and local match fixtures to apply technical changes."
      },
      {
        step: "Step 5",
        title: "KSCA League Trials & Recommendations",
        description: "Obtain guidance and recommendations for trials with KSCA-registered division cricket clubs based on raw performance."
      },
      {
        step: "Step 6",
        title: "Long-Term Cricket Development",
        description: "Transition into higher-level division selections, club registrations, and professional cricket career pathways."
      }
    ]
  },
  whyParentsChoose: {
    title: "Why Parents Choose Renegades",
    subheading: "We build character, discipline, and high-performance athletic skills in a premium, supportive environment.",
    list: [
      {
        title: "Professional Coaching Environment",
        description: "Coached by active division league cricketers who understand modern competitive standards."
      },
      {
        title: "Competitive Match Exposure",
        description: "Regular friendly fixtures, internal tournament play, and trials in league networks."
      },
      {
        title: "Structured Player Development",
        description: "Structured progressive curriculums custom-designed for different age groups and athletic skill tiers."
      },
      {
        title: "Performance Analytics & Statistics",
        description: "Interactive video reviews, radar speed diagnostics, and periodic development metrics."
      },
      {
        title: "Premium Cricket Infrastructure",
        description: "High-quality Astro Turf nets, bowling machines, and physical conditioning layouts."
      },
      {
        title: "Equipment and Merchandise Support",
        description: "Direct access to high-performance cricket gear and custom training apparel."
      },
      {
        title: "Strong Cricketing Network",
        description: "Alignments and recommendations for registered KSCA club division networks."
      },
      {
        title: "Holistic Development and Mentorship",
        description: "Nurturing character, leadership, sportsmanship, and mental strength to succeed in all aspects of life."
      }
    ]
  },
  visionMission: {
    vision: "To become one of Karnataka’s most respected high-performance sports institutions that develops disciplined athletes and creates meaningful sporting opportunities.",
    mission: "To nurture young athletes through professional coaching, structured development, and competitive exposure while building character, leadership, and sporting excellence."
  },
  shop: {
    title: "RENEGADES PRO SHOP",
    subheading: "Premium cricket equipment, protective gear, and official academy merchandise.",
    categories: [
      { id: "all", name: "All Products" },
      { id: "bats", name: "🏏 Bats" },
      { id: "pads", name: "🥊 Pads" },
      { id: "gloves", name: "🧤 Gloves" },
      { id: "protection", name: "🦵 Thigh Guards" },
      { id: "bags", name: "🎒 Kit Bags" },
      { id: "merchandise", name: "👕 Merchandise" }
    ],
    products: [
      { id: "bat-willow", category: "bats", name: "Premium English Willow Bat", originalPrice: 5500, price: 4125, image: "https://xucrozyigmtkmabvfeba.supabase.co/storage/v1/object/public/product-images/bats%202.jpeg", badge: "⭐ Coach Recommended", stock: "in-stock" },
      { id: "pads-mrf", category: "pads", name: "MRF Pro Pads", originalPrice: 3200, price: 2400, image: "", badge: "🔥 Best Seller", stock: "in-stock" },
      { id: "pads-bas", category: "pads", name: "BAS Vampire Pads", originalPrice: 3200, price: 2400, image: "", badge: "", stock: "in-stock" },
      { id: "pads-sg", category: "pads", name: "SG Test Pads", originalPrice: 3200, price: 2400, image: "", badge: "", stock: "in-stock" },
      { id: "pads-ss-opener", category: "pads", name: "SS Test Opener Pads", originalPrice: 3200, price: 2400, image: "", badge: "✨ New Arrival", stock: "in-stock" },
      { id: "pads-ss-sunridges", category: "pads", name: "SS Sunridges Pads", originalPrice: 3200, price: 2400, image: "", badge: "", stock: "in-stock" },
      { id: "gloves-mrf", category: "gloves", name: "MRF Pro Gloves", originalPrice: 2800, price: 2100, image: "", badge: "", stock: "in-stock" },
      { id: "gloves-bas", category: "gloves", name: "BAS Bow Gloves", originalPrice: 2800, price: 2100, image: "", badge: "", stock: "in-stock" },
      { id: "gloves-sg-klr", category: "gloves", name: "SG KLR-1 Gloves", originalPrice: 2800, price: 2100, image: "", badge: "🔥 Best Seller", stock: "in-stock" },
      { id: "gloves-ss-dragon", category: "gloves", name: "SS Dragon Gloves", originalPrice: 2800, price: 2100, image: "", badge: "✨ New Arrival", stock: "in-stock" },
      { id: "gloves-sg-white", category: "gloves", name: "SG Test White Gloves", originalPrice: 2800, price: 2100, image: "", badge: "", stock: "in-stock" },
      { id: "gloves-gray-nicolls", category: "gloves", name: "Gray-Nicolls Gloves", originalPrice: 2800, price: 2100, image: "", badge: "", stock: "in-stock" },
      { id: "thigh-moonwalkr", category: "protection", name: "Moonwalkr Thigh Guards", originalPrice: 1200, price: 900, image: "", badge: "🏏 Academy Exclusive", stock: "in-stock" },
      { id: "bag-sg", category: "bags", name: "SG Premium Backpack", originalPrice: 4350, price: 3260, image: "", badge: "", stock: "in-stock" },
      { id: "bag-nb", category: "bags", name: "New Balance Wheelie Bag", originalPrice: 4350, price: 3260, image: "", badge: "⭐ Coach Recommended", stock: "in-stock" },
      { id: "merchandise-shirt", category: "merchandise", name: "Official Renegades Training Jersey", originalPrice: 1500, price: 999, image: "assets/images/logo.png", badge: "🏏 Academy Exclusive", stock: "in-stock" },
      { id: "merchandise-cap", category: "merchandise", name: "Official Renegades Cap", originalPrice: 800, price: 499, image: "assets/images/logo.png", badge: "✨ New Arrival", stock: "in-stock" }
    ]
  },
  coaches: {
    title: "Meet The Coaches",
    subheading: "Learn from top-tier professionals with decades of competitive and coaching experience.",
    list: [
      {
        name: "Coach Darshan S",
        designation: "Founder & Elite Head Coach",
        experience: "Division League Specialist",
        specialization: "Fast Bowling, Power Hitting, and Strength Training",
        achievements: "Royal Challengers Bengaluru (RCB) Net Bowler, MLB Baseball India's Longest Hitter, Division League Athlete",
        image: "assets/images/coach_profile_poster.jpg",
        instagram: "https://www.instagram.com/p/C7_hUfoSK6Z/?igsh=bGpzeDkweHNxaGti",
        twitter: "#"
      }
    ]
  },
  facilities: {
    title: "World-Class Training Facilities",
    subheading: "Train under premium conditions with high-performance equipment modeled after international stadiums.",
    list: [
      {
        title: "Turf Ground (In Preparation)",
        image: "assets/images/cricket_ground_backdrop.jpg",
        description: "Our double-turf wicket cricket ground is currently under active preparation and development. This premium playing field is engineered to mirror international turf conditions for realistic, full-ground matches."
      },
      {
        title: "Cricket Box Nets",
        image: "assets/images/current_box_nets.jpg",
        description: "Fully-enclosed, synthetic net lanes setup allowing distraction-free batting and bowling reps."
      },
      {
        title: "Future Upcoming Setup",
        image: "assets/images/future_upcoming_setup.jpg",
        description: "A new two-turf wicket pitch ground is currently being developed. Professional bowling machines are to be introduced soon. Additionally, our dedicated fitness training area is shortly being made available, and fielding practice zones will be updated soon."
      },
      {
        title: "Fitness Training Area",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
        description: "Our specialized fitness training area is shortly being made available to all academy students."
      },
      {
        title: "Fielding Practice Zones",
        image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
        description: "High-rebound catch practice nets and turf patches. This zone will be updated and expanded soon."
      },
      {
        title: "Match Simulation Training",
        image: "assets/images/training_batting.jpg",
        description: "Specialized training area built for set tactical defenses, field-placement scenarios, and target defense."
      }
    ]
  },
  gallery: {
    title: "GALLERY",
    subheading: "A visual record of our achievements, training rigor, and competitive match experiences.",
    albums: ["training", "matches", "events", "players", "achievements"],
    list: [
      { category: "players", url: "assets/images/girls_team_pride.jpg", title: "Renegades Queens - Kadamba Tournament Finalists", type: "image" },
      { category: "training", url: "assets/images/girl_bowling_nets.jpg", title: "Technical Bowling Drift Training", type: "image" },
      { category: "training", url: "assets/images/boy_bowling_nets.jpg", title: "Fast Bowling Biomechanics Check", type: "image" },
      { category: "training", url: "assets/images/agility_running_drills.jpg", title: "Agility & Lateral Conditioning Drills", type: "image" },
      { category: "training", url: "assets/images/coach_sidearm_training.jpg", title: "Side-Arm Throw Practice with Coach Darshan", type: "image" },
      { category: "matches", url: "assets/images/queens_vs_kapil_tournament.jpg", title: "Kadamba U-15 Women's Tournament Final - Renegades Queens vs Kapil Cricket Academy", type: "image" },
      { category: "players", url: "assets/images/batting_net_practice.jpg", title: "Net Batting Practice & Drill Session", type: "image" },
      { category: "training", url: "assets/images/bowling_coaching_net.jpg", title: "Bowling Action & Release Optimization Training", type: "image" },
      { category: "training", url: "assets/images/kids_cricket_training.jpg", title: "Junior Academy - Stance and Technique Drills", type: "image" },
      { category: "training", url: "assets/images/training_coaching.jpg", title: "Technical Coaching Session", type: "image" },
      { category: "training", url: "assets/images/group_warmup.jpg", title: "Group Fitness & Drills Session", type: "image" },
      { category: "training", url: "assets/images/net_wide_shot.jpg", title: "Astro Turf Net Area Overview", type: "image" },
      { category: "players", url: "assets/images/front_foot_drive.jpg", title: "Front Foot Drive Technique", type: "image" },
      { category: "training", url: "assets/images/turf_long_view.jpg", title: "Wide Fielding & Catching Zone", type: "image" },
      { category: "matches", url: "assets/images/turf_empty_pitch.jpg", title: "Astro Turf Pitch Overview", type: "image" },
      { category: "training", url: "https://assets.mixkit.co/videos/preview/mixkit-cricket-batsman-hitting-a-ball-40294-large.mp4", title: "High Performance Bowling Mechanics", type: "video" },
      { category: "matches", url: "https://www.instagram.com/reel/C7_hUfoSK6Z/", title: "Renegades Arena Match Exposure Highlight", type: "reel" }
    ]
  },
  reviews: {
    title: "What Our Players & Parents Say",
    subheading: "Trusted by parents, players, and professionals across South India.",
    list: [
      {
        name: "Satish Hegde",
        relation: "Parent of U-14 Student",
        date: "2 Weeks Ago",
        rating: 5,
        text: "Renegades has transformed my son's attitude and technique. The coaches don't just teach cricket, they build character. The facilities are the best in Bengaluru."
      },
      {
        name: "Ananya Krishnan",
        relation: "U-19 Girls Team Captain",
        date: "1 Month Ago",
        rating: 5,
        text: "The turf netting sessions under lights combined with bowling machine practice corrected errors in my backfoot play. Exceptional technical support by Coach Rajesh."
      },
      {
        name: "Dinesh Gowda",
        relation: "Club Captain & Elite Student",
        date: "3 Weeks Ago",
        rating: 5,
        text: "The path into the KSCA leagues is real. Thanks to the Renegades team, I was scouted and registered with a top division club this season. Best decision ever!"
      }
    ]
  },
  achievements: {
    title: "Numbers That Matter",
    list: [
      { label: "Hours of Coaching", count: 1000, suffix: "+" },
      { label: "Training Sessions", count: 500, suffix: "+" },
      { label: "Athletes Mentored", count: 100, suffix: "+" },
      { label: "Tournament Participations", count: 50, suffix: "+" },
      { label: "KSCA Division Club Relationships", count: 5, suffix: "+" }
    ]
  },
  hallOfFame: [
    {
      name: "Rohan Sharma",
      role: "All-Rounder",
      badge: "KSCA Division Player",
      scholarship: "100% Scholarship",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
      achievement: "Kadamba Cup MVP",
      stats: [
        { val: "450", lbl: "Runs" },
        { val: "18", lbl: "Wickets" },
        { val: "135.2", lbl: "S/R" },
        { val: "24", lbl: "Matches" }
      ]
    },
    {
      name: "Harshith",
      role: "Leg Spinner",
      badge: "Under-16 Star",
      scholarship: "50% Scholarship",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
      achievement: "Best Bowler U-16",
      stats: [
        { val: "85", lbl: "Runs" },
        { val: "32", lbl: "Wkts" },
        { val: "4.12", lbl: "Econ" },
        { val: "20", lbl: "Matches" }
      ]
    },
    {
      name: "Priyanka Sen",
      role: "Top-Order Batter",
      badge: "State Selector Camp",
      scholarship: "Elite Athlete",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
      achievement: "Highest Run-Scorer",
      stats: [
        { val: "620", lbl: "Runs" },
        { val: "44.2", lbl: "Avg" },
        { val: "122.5", lbl: "S/R" },
        { val: "18", lbl: "Matches" }
      ]
    }
  ]
};

// Expose default config globally for self-healing fallbacks
window.RENEGADES_DEFAULT_CONFIG = DEFAULT_CONFIG;

// Deep merge loaded configuration with DEFAULT_CONFIG
function deepMergeConfig(defaultConfig, loadedConfig) {
  if (!loadedConfig) return { ...defaultConfig };

  const merged = { ...defaultConfig };

  for (const key in defaultConfig) {
    if (loadedConfig[key] !== undefined) {
      if (Array.isArray(defaultConfig[key])) {
        merged[key] = Array.isArray(loadedConfig[key]) && loadedConfig[key].length > 0
          ? loadedConfig[key]
          : defaultConfig[key];
      } else if (typeof defaultConfig[key] === 'object' && defaultConfig[key] !== null) {
        merged[key] = { ...defaultConfig[key], ...loadedConfig[key] };
      } else {
        merged[key] = loadedConfig[key];
      }
    }
  }
  return merged;
}

// Retrieve configuration from local storage if edited in admin, otherwise default
const configSource = localStorage.getItem("renegades_config");
let loadedConfig = configSource ? JSON.parse(configSource) : DEFAULT_CONFIG;
window.RENEGADES_CONFIG = deepMergeConfig(DEFAULT_CONFIG, loadedConfig);

// Expose getHallOfFameData following priority chain CMS -> Supabase -> Fallback
window.getHallOfFameData = function () {
  const localConfigStr = localStorage.getItem("renegades_config");
  if (localConfigStr) {
    try {
      const localConfig = JSON.parse(localConfigStr);
      if (localConfig.hallOfFame && Array.isArray(localConfig.hallOfFame) && localConfig.hallOfFame.length > 0) {
        return localConfig.hallOfFame;
      }
    } catch (e) {
      console.error("Error parsing local CMS config:", e);
    }
  }

  if (window.RENEGADES_CONFIG && window.RENEGADES_CONFIG.hallOfFame && Array.isArray(window.RENEGADES_CONFIG.hallOfFame) && window.RENEGADES_CONFIG.hallOfFame.length > 0) {
    return window.RENEGADES_CONFIG.hallOfFame;
  }

  return DEFAULT_CONFIG.hallOfFame || [];
};

async function loadSupabaseConfig() {
  if (!window.supabaseClient) {
    console.log("Supabase client not ready, retrying...");
    setTimeout(loadSupabaseConfig, 500);
    return;
  }
  const { data, error } = await window.supabaseClient
    .from("website_config")
    .select("data")
    .eq("id", 1)
    .single();
  if (!error && data) {
    window.RENEGADES_CONFIG = deepMergeConfig(DEFAULT_CONFIG, data.data);
    console.log("Loaded from Supabase");

    /* setTimeout(() => {
       // Re-initialize all sections to dynamically reflect Supabase changes
       if (typeof initAnnouncement === "function") initAnnouncement(window.RENEGADES_CONFIG.general);
       if (typeof initGeneral === "function") initGeneral(window.RENEGADES_CONFIG.general);
       if (typeof initHero === "function") initHero(window.RENEGADES_CONFIG.hero);
       if (typeof initWhyChooseUs === "function") initWhyChooseUs(window.RENEGADES_CONFIG.whyChooseUs);
       if (typeof initFutureArena === "function") initFutureArena(window.RENEGADES_CONFIG.futureArena);
       if (typeof initClubs === "function") initClubs(window.RENEGADES_CONFIG.clubs);
       if (typeof initPrograms === "function") initPrograms(window.RENEGADES_CONFIG.programs);
       if (typeof initPathway === "function") initPathway(window.RENEGADES_CONFIG.renegadesPathway);
       if (typeof initParentsChoose === "function") initParentsChoose(window.RENEGADES_CONFIG.whyParentsChoose);
       if (typeof initVisionMission === "function") initVisionMission(window.RENEGADES_CONFIG.visionMission);
       if (typeof initFacilities === "function") initFacilities(window.RENEGADES_CONFIG.facilities);
       if (typeof initGallery === "function") initGallery(window.RENEGADES_CONFIG.gallery);
       if (typeof initReviews === "function") initReviews(window.RENEGADES_CONFIG.reviews);
       if (typeof initAchievements === "function") initAchievements(window.RENEGADES_CONFIG.achievements);
       if (typeof initHallOfFame === "function") initHallOfFame(window.getHallOfFameData());
       if (typeof initProShop === "function") initProShop(window.RENEGADES_CONFIG.shop);
       if (typeof initCoaches === "function") {
         const coachData = window.RENEGADES_CONFIG?.coaches?.list?.length
           ? window.RENEGADES_CONFIG.coaches
           : DEFAULT_CONFIG.coaches;
         initCoaches(coachData);
       }
     }, 500);*/
  } else {
    console.log("Using localStorage/default config");
  }
}

window.addEventListener("load", () => {
  setTimeout(loadSupabaseConfig, 1000);
  if (typeof initScrollEffects === "function") {
    initScrollEffects();
  }
});

// Ensure new gallery images from DEFAULT_CONFIG are present in loadedConfig
if (configSource && loadedConfig && loadedConfig.gallery && Array.isArray(loadedConfig.gallery.list)) {
  const loadedUrls = new Set(loadedConfig.gallery.list.map(item => item.url));
  const toAdd = [];
  DEFAULT_CONFIG.gallery.list.forEach(item => {
    if (!loadedUrls.has(item.url)) {
      toAdd.push(item);
    }
  });
  if (toAdd.length > 0) {
    loadedConfig.gallery.list = [...toAdd, ...loadedConfig.gallery.list];
    try {
      localStorage.setItem("renegades_config", JSON.stringify(loadedConfig));
    } catch (e) {
      console.error("Failed to sync new default gallery items to local storage", e);
    }
  }
}



