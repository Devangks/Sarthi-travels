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
        
        try {
            const manifest = await API.admin.getManifest(date, time);
            const list = document.getElementById('manifestList');
            list.innerHTML = '';
            
            manifest.bookings.forEach(booking => {
                list.innerHTML += `
                    <div class="glass-card">
                        <div style="font-weight:900; color:var(--primary);">${booking.pnr}</div>
                        <div style="font-size:13px; color:var(--text-muted);">${booking.passengers.length} seats</div>
                        <div style="margin-top:10px; display:flex; gap:10px;">
                            <button class="btn btn-dark" style="flex:1; padding:8px;" onclick="Admin.markPaid('${booking.pnr}')">Verify</button>
                        </div>
                    </div>
                `;
            });
        } catch (err) {
            UI.showToast('Failed to load manifest.', 'error');
        }
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