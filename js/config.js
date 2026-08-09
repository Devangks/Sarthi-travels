// ✅ SECURITY: Credentials via environment variables, NOT exposed in client
const CONFIG = {
    API_BASE: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api'
        : 'https://api.sarthitravels.com/api',
    FARE: 200,
    ADMIN_WHATSAPP: '6269385198',
    MAX_SEATS: 6,
    TOTAL_SEATS: 9,
    ROUTES: [
        { from: 'Alampur', to: 'Gwalior', times: ['08:00 AM', '04:00 PM'] },
        { from: 'Gwalior', to: 'Alampur', times: ['07:00 AM', '04:00 PM'] }
    ]
};