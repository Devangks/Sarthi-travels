// ✅ SECURITY: Backend-based authentication with proper PIN verification
const Auth = {
    state: {
        phone: sessionStorage.getItem('user_phone'),
        name: sessionStorage.getItem('user_name'),
        token: sessionStorage.getItem('auth_token')
    },

    requestOTP: async () => {
        const name = document.getElementById('nameInput')?.value.trim();
        const phone = document.getElementById('phoneInput')?.value.trim();

        if (!Utils.validateName(name)) {
            return UI.showToast('Please enter a valid name (letters only).', 'error');
        }
        if (!Utils.validatePhone(phone)) {
            return UI.showToast('Valid 10-digit Indian mobile required.', 'error');
        }

        try {
            const btn = document.getElementById('getOtpBtn');
            UI.setLoading(btn, true, 'Sending OTP...');
            await API.auth.requestOTP(phone, name);
            document.getElementById('loginBox').style.display = 'none';
            document.getElementById('otpBox').style.display = 'block';
            UI.showToast('OTP sent to your mobile.', 'success');
            UI.setLoading(btn, false);
        } catch (err) {
            UI.showToast('Failed to send OTP. Try again.', 'error');
            UI.setLoading(document.getElementById('getOtpBtn'), false);
        }
    },

    verifyOTP: async () => {
        const otp = document.getElementById('otpInput')?.value.trim();
        const phone = document.getElementById('phoneInput')?.value.trim();

        if (!Utils.validateOTP(otp)) {
            return UI.showToast('Invalid OTP format.', 'error');
        }

        try {
            const btn = document.getElementById('verifyBtn');
            UI.setLoading(btn, true, 'Verifying...');
            const { token } = await API.auth.verifyOTP(phone, otp);
            
            Auth.state.phone = phone;
            Auth.state.name = document.getElementById('nameInput').value.trim();
            Auth.state.token = token;
            
            sessionStorage.setItem('user_phone', phone);
            sessionStorage.setItem('user_name', Auth.state.name);
            sessionStorage.setItem('auth_token', token);
            
            document.getElementById('userNameDisplay').innerHTML = 
                `<i class="fa-solid fa-user-circle" style="color:var(--primary); margin-right:5px;"></i> ${Utils.escapeHTML(Auth.state.name)}`;
            document.getElementById('botNav').style.display = 'flex';
            UI.showToast('Login successful!', 'success');
            UI.switchScreen('homeScreen');
            UI.setLoading(btn, false);
        } catch (err) {
            UI.showToast('Invalid OTP. Try again.', 'error');
            UI.setLoading(document.getElementById('verifyBtn'), false);
        }
    },

    logout: () => {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.clear();
            location.reload();
        }
    },

    isLoggedIn: () => !!Auth.state.token
};