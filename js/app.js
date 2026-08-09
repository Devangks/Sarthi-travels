// ✅ Main app initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Hide splash screen
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        splash.classList.add('hide');
        setTimeout(() => splash.style.display = 'none', 400);
    }, 1200);

    // Check if logged in
    if (Auth.isLoggedIn()) {
        document.getElementById('userNameDisplay').innerHTML = 
            `<i class="fa-solid fa-user-circle" style="color:var(--primary);"></i> ${Utils.escapeHTML(Auth.state.name)}`;
        document.getElementById('botNav').style.display = 'flex';
        UI.switchScreen('homeScreen');
    } else {
        // Render auth screen
        const authScreen = document.getElementById('authScreen');
        authScreen.innerHTML = `
            <div style="text-align:center; margin:40px 0;">
                <h1 style="font-size: 42px; font-weight: 900;">Sarthi Travels</h1>
                <p style="color:var(--primary); font-size:12px; font-weight: 800;">VIP DAILY COMMUTE</p>
            </div>
            <div class="glass-card" id="loginBox">
                <p style="text-align:center; margin-bottom:25px; font-size:15px; font-weight: 700; color:var(--text-muted);">Enter your details to book</p>
                <div class="input-group">
                    <label>PASSENGER NAME</label>
                    <input type="text" id="nameInput" class="input" placeholder="Full Name" style="font-weight: 700;">
                </div>
                <div class="input-group">
                    <label>MOBILE NUMBER</label>
                    <input type="tel" id="phoneInput" class="input" placeholder="10-digit number" maxlength="10" style="font-weight: 700;">
                </div>
                <button class="btn btn-primary" id="getOtpBtn" onclick="Auth.requestOTP()">
                    <span>Continue Securely</span> <i class="fa-solid fa-shield-halved"></i>
                </button>
            </div>
            <div class="glass-card" id="otpBox" style="display:none;">
                <p style="text-align:center; margin-bottom:20px; font-weight: 700; color:var(--primary);">Enter 4-digit OTP</p>
                <input type="number" id="otpInput" class="input" placeholder="0000" style="text-align:center; letter-spacing:8px; font-size: 28px; font-weight: 900;">
                <button class="btn btn-green" onclick="Auth.verifyOTP()" id="verifyBtn">
                    <span>Verify Identity</span> <i class="fa-solid fa-fingerprint"></i>
                </button>
            </div>
            <div style="flex-grow:1;"></div>
            <div style="padding: 15px; text-align: center; border-radius: 100px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
                <span style="font-size:12px; color:var(--text-muted); font-weight: 700;">24/7 Helpline: </span>
                <span style="color:var(--primary); font-weight: 900; font-size: 14px;">9098567628</span>
            </div>
            <a href="#" onclick="Admin.openPanel(); return false;" style="text-align:center; display:block; margin-top:10px; color:var(--text-muted); font-size:12px; text-decoration:underline;">Driver Portal</a>
        `;
    }

    // Render navigation
    if (Auth.isLoggedIn()) {
        document.getElementById('botNav').innerHTML = `
            <div class="nav-item active" onclick="UI.switchScreen('homeScreen')" style="cursor:pointer;">
                <i class="fa-solid fa-house"></i> <span>Home</span>
            </div>
            <div class="nav-item" onclick="UI.switchScreen('tripsScreen')" style="cursor:pointer;">
                <i class="fa-solid fa-ticket-simple"></i> <span>Trips</span>
            </div>
            <div class="nav-item" onclick="Auth.logout()" style="cursor:pointer;">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> <span>Logout</span>
            </div>
        `;
    }

    // Render home screen
    const homeScreen = document.getElementById('homeScreen');
    homeScreen.innerHTML = `
        <h2 style="font-size:36px; font-weight: 900; margin-bottom:25px; line-height: 1.1;">Where to today?</h2>
        <div class="glass-card" style="padding: 30px 24px;">
            <div style="position:relative; margin-bottom: 15px;">
                <div style="color:var(--text-muted); font-size: 10px; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px;">DEPARTURE</div>
                <input type="text" id="fromInput" class="input" value="Alampur" readonly style="font-weight:900; font-size: 22px;">
                <div style="color:var(--text-muted); font-size: 10px; font-weight: 800; letter-spacing: 1px; margin-top: 20px; margin-bottom: 8px;">DESTINATION</div>
                <input type="text" id="toInput" class="input" value="Gwalior" readonly style="font-weight:900; font-size: 22px;">
            </div>
            <div style="display:flex; gap:15px; margin-top: 25px;">
                <div class="input-group" style="flex:1;">
                    <label>DATE</label>
                    <input type="date" id="dateInput" class="input">
                </div>
                <div class="input-group" style="flex:1;">
                    <label>TIME</label>
                    <select id="timeInput" class="input">
                        <option>08:00 AM</option>
                        <option>04:00 PM</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primary" onclick="Booking.searchBuses()" id="searchBtn">
                <span>Find Available Seats</span>
            </button>
        </div>
    `;

    // Set today as min date
    const today = Utils.getISTDate().toISOString().split('T')[0];
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
    }
});