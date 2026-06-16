const SUPABASE_URL = "https://xucrozyigmtkmabvfeba.supabase.co";

const SUPABASE_KEY = "sb_publishable_UKG7P8c5dbk6gAKpeD3xgA_OAyNA1Ki";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase Connected");