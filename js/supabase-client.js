/* ==========================================
   Bsmart Knowledge Repository - Supabase Client
   Browser-side Supabase configuration
   ========================================== */

// Supabase configuration - replace with your project values
const SUPABASE_URL = 'https://cxcqwdccapzftfhbxzja.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Get from Supabase Dashboard -> Settings -> API

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other scripts
window.supabaseClient = supabaseClient;
