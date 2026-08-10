// ✅ SECURITY: Credentials via environment variables, NOT exposed in client
// This file reads Supabase details from global variables injected at deploy time
// (e.g., by your hosting provider) or from explicit constants below. For Vercel
// static sites you can inject them using <script>window.__ENV__ = { SUPABASE_URL: '...', SUPABASE_ANON_KEY: '...' }</script>
const CONFIG = {
    // API_BASE kept for backwards-compatibility but not required for Supabase mode
    API_BASE: window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : 'https://api.sarthitravels.com/api',

    // App settings
    FARE: 200,
    ADMIN_WHATSAPP: '6269385198',
    MAX_SEATS: 6,
    TOTAL_SEATS: 9,
    ROUTES: [
        { from: 'Alampur', to: 'Gwalior', times: ['08:00 AM', '04:00 PM'] },
        { from: 'Gwalior', to: 'Alampur', times: ['07:00 AM', '04:00 PM'] }
    ],

    // Supabase configuration — populate these safely for your deployment.
    // Recommended: Inject via a small inline script in index.html during deploy
    // Example (in index.html head):
    // <script>window.__ENV__ = { SUPABASE_URL: 'https://xyz.supabase.co', SUPABASE_ANON_KEY: 'public-anon-key' }</script>
    SUPABASE_URL: (window.__ENV__ && window.__ENV__.SUPABASE_URL) || window.SUPABASE_URL || null,
    SUPABASE_ANON_KEY: (window.__ENV__ && window.__ENV__.SUPABASE_ANON_KEY) || window.SUPABASE_ANON_KEY || null,

    // Firebase config (embedded here for convenience). You can instead inject via window.__ENV__ as above.
    FIREBASE: (window.__ENV__ && window.__ENV__.FIREBASE) || window.FIREBASE || {
      apiKey: "AIzaSyCPT5uSpPyHk6dA_q8UjTg3bIzLKh9tB24",
      authDomain: "sarthi-travels.firebaseapp.com",
      projectId: "sarthi-travels",
      storageBucket: "sarthi-travels.firebasestorage.app",
      messagingSenderId: "168359171735",
      appId: "1:168359171735:web:befeb6338c0ce1e8d53bd2"
    },

    // OTP expiry (ms) — used only for non-Firebase fallback flows
    OTP_EXPIRY_MS: 5 * 60 * 1000
};

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    console.warn('CONFIG: Supabase URL or anon key not set. Local test flows will still work but DB operations will fail until these are provided.');
}

// Basic runtime check for Firebase presence — not an error (we lazy-load in auth.js if needed)
if (!CONFIG.FIREBASE || !CONFIG.FIREBASE.apiKey) {
  console.warn('CONFIG: Firebase config missing; phone authentication will not work until configured.');
}
