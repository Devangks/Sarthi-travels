// ✅ Admin driver panel with authentication
const Admin = {
    state: { isAdmin: false },
    PIN: '2003', // Change in production

    openPanel: () => {
        const pin = prompt('Driver PIN:');
        if (pin === Admin.PIN) {
            Admin.state.isAdmin = true;
            document.getElementById('adminTag').style.display = 'inline';
            document.getElementById('botNav').style.display = 'none';
            UI.switchScreen('adminScreen');
            Admin.loadManifest();
        } else {
            UI.showToast('Invalid PIN.', 'error');
        }
    },

    loadManifest: async () => {
        const date = document.getElementById('admDate')?.value;
        const time = document.getElementById('admTime')?.value || 'ALL';

        // getManifest now returns an array (or [] on error). Support both legacy shapes.
        let bookings = [];
        try {
            const manifest = await API.admin.getManifest(date, time);
            if (Array.isArray(manifest)) bookings = manifest;
            else if (manifest && Array.isArray(manifest.bookings)) bookings = manifest.bookings;
            else bookings = [];
        } catch (err) {
            // Don't block the driver UI with an error modal. Fall back to empty list.
            console.warn('Admin.loadManifest: failed to get manifest', err);
            bookings = [];
        }

        const list = document.getElementById('manifestList');
        if (!list) return;
        list.innerHTML = '';

        if (bookings.length === 0) {
            list.innerHTML = '<div class="glass-card">No bookings found for the selected date/time.</div>';
            return;
        }

        bookings.forEach(booking => {
            list.innerHTML += `
                <div class="glass-card">
                    <div style="font-weight:900; color:var(--primary);">${booking.pnr}</div>
                    <div style="font-size:13px; color:var(--text-muted);">${(booking.passengers || []).length} seats</div>
                    <div style="margin-top:10px; display:flex; gap:10px;">
                        <button class="btn btn-dark" style="flex:1; padding:8px;" onclick="Admin.markPaid('${booking.pnr}')">Verify</button>
                    </div>
                </div>
            `;
        });
    },

    markPaid: async (pnr) => {
        if (confirm('Mark as paid?')) {
            try {
                await API.admin.markPaid(pnr, 'CASH_PAID');
                UI.showToast('Payment verified!', 'success');
                Admin.loadManifest();
            } catch (err) {
                UI.showToast('Error updating payment.', 'error');
            }
        }
    },

    exitPanel: () => {
        Admin.state.isAdmin = false;
        document.getElementById('adminTag').style.display = 'none';
        UI.switchScreen('authScreen');
    }
};
