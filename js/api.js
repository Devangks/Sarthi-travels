// ✅ SECURITY: Backend API client with proper error handling
const API = {
    call: async (endpoint, method = 'GET', body = null) => {
        try {
            const options = {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('auth_token') || ''}`
                }
            };
            if (body) options.body = JSON.stringify(body);
            const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, options);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    },

    auth: {
        requestOTP: (phone, name) => API.call('/auth/request-otp', 'POST', { phone, name }),
        verifyOTP: (phone, otp) => API.call('/auth/verify-otp', 'POST', { phone, otp })
    },

    booking: {
        searchSeats: (from, to, date, time) => API.call(`/bookings/search?from=${from}&to=${to}&date=${date}&time=${time}`),
        confirm: (seats, passengers, mode) => API.call('/bookings/confirm', 'POST', { seats, passengers, mode }),
        getTrips: () => API.call('/bookings/trips'),
        cancel: (pnr) => API.call(`/bookings/${pnr}`, 'DELETE')
    },

    admin: {
        getManifest: (date, time) => API.call(`/admin/manifest?date=${date}&time=${time}`),
        markPaid: (pnr, mode) => API.call(`/admin/bookings/${pnr}/paid`, 'PATCH', { mode }),
        blockSeats: (date, time, seats, name) => API.call('/admin/block-seats', 'POST', { date, time, seats, name }),
        saveUPI: (upiId) => API.call('/admin/upi-id', 'POST', { upiId })
    }
};