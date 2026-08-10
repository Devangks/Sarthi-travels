// Firebase Phone Auth integration for Sarthi (uses RecaptchaVerifier + signInWithPhoneNumber)
// Relies on CONFIG.FIREBASE being present (see js/config.js)

const Auth = {
  state: {
    phone: sessionStorage.getItem('user_phone'),
    name: sessionStorage.getItem('user_name'),
    token: sessionStorage.getItem('auth_token')
  },

  // Lazy-load Firebase compat SDK if not already on the page
  _loadFirebase: () => {
    if (window.firebase && window.firebase.auth) return Promise.resolve(window.firebase);
    return new Promise((resolve, reject) => {
      const libs = [
        'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js'
      ];
      let loaded = 0;
      libs.forEach(src => {
        if (document.querySelector(`script[src="${src}"]`)) {
          loaded++;
          if (loaded === libs.length) resolve(window.firebase);
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = () => {
          loaded++;
          if (loaded === libs.length) resolve(window.firebase);
        };
        s.onerror = () => reject(new Error('Failed to load Firebase SDK: ' + src));
        document.head.appendChild(s);
      });
    });
  },

  // Initialize Firebase app if needed
  _initFirebaseApp: () => {
    if (!window.firebase) throw new Error('Firebase SDK not loaded');
    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      if (!CONFIG.FIREBASE) throw new Error('Firebase config (CONFIG.FIREBASE) missing');
      window.firebase.initializeApp(CONFIG.FIREBASE);
    }
    return window.firebase;
  },

  // Create/reuse an invisible RecaptchaVerifier bound to #recaptcha-container
  // Gracefully handles missing container and reCAPTCHA initialization errors
  _getRecaptchaVerifier: (forceReset = false) => {
    // Ensure recaptcha-container exists, create if missing
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      const authScreen = document.getElementById('authScreen') || document.body;
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      container.style.display = 'none';
      try {
        authScreen.appendChild(container);
      } catch (e) {
        console.warn('Failed to append recaptcha-container to authScreen', e);
        // Container creation failed, will attempt fallback below
        container = null;
      }
    }

    // Reset verifier if requested
    if (forceReset && window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Failed to clear recaptchaVerifier', e);
      }
      window.recaptchaVerifier = null;
    }

    // Create new verifier if needed
    if (!window.recaptchaVerifier) {
      try {
        // Verify container exists before creating verifier
        if (!container || !document.getElementById('recaptcha-container')) {
          throw new Error('recaptcha-container not available for RecaptchaVerifier');
        }
        
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'invisible'
        });
        
        try {
          window.recaptchaVerifier.render();
        } catch (renderErr) {
          console.warn('RecaptchaVerifier render failed, continuing anyway', renderErr);
        }
      } catch (e) {
        console.error('Failed to create RecaptchaVerifier', e);
        // Return null to signal that reCAPTCHA is unavailable (caller should handle)
        return null;
      }
    }

    return window.recaptchaVerifier;
  },

  // Format Indian 10-digit numbers to E.164 (+91...). If already starts with + return as-is.
  _formatPhone: (phone) => {
    if (!phone) return phone;
    const trimmed = phone.trim();
    if (/^\d{10}$/.test(trimmed)) return '+91' + trimmed;
    if (/^\+\d+$/.test(trimmed)) return trimmed;
    return trimmed;
  },

  requestOTP: async () => {
    const name = document.getElementById('nameInput')?.value?.trim();
    const phoneRaw = document.getElementById('phoneInput')?.value?.trim();

    if (!Utils.validateName(name)) return UI.showToast('Please enter a valid name (letters only).', 'error');
    if (!Utils.validatePhone(phoneRaw)) return UI.showToast('Valid 10-digit Indian mobile required.', 'error');

    const phone = Auth._formatPhone(phoneRaw);

    try {
      const btn = document.getElementById('getOtpBtn');
      UI.setLoading(btn, true, 'Requesting OTP...');

      await Auth._loadFirebase();
      Auth._initFirebaseApp();

      // Get reCAPTCHA verifier with reset to clear any stale state
      const verifier = Auth._getRecaptchaVerifier(true);
      if (!verifier) {
        throw new Error('RecaptchaVerifier initialization failed. Please try again.');
      }

      const auth = firebase.auth();
      const confirmationResult = await auth.signInWithPhoneNumber(phone, verifier);

      // Store confirmationResult for use by verifyOTP (in-memory)
      window.__sarthi_confirmationResult = confirmationResult;

      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('otpBox').style.display = 'block';
      UI.showToast('OTP sent. Please check your phone.', 'success');
      UI.setLoading(btn, false);
    } catch (err) {
      console.error('requestOTP error', err);
      UI.showToast(err.message || 'Failed to send OTP. Check console for details.', 'error');
      UI.setLoading(document.getElementById('getOtpBtn'), false);
      
      // Gracefully reset reCAPTCHA on error
      try {
        Auth._getRecaptchaVerifier(true);
      } catch (e) {
        console.warn('Failed to reset recaptcha verifier after OTP error', e);
      }
    }
  },

  verifyOTP: async () => {
    const otp = document.getElementById('otpInput')?.value?.trim();
    const phoneRaw = document.getElementById('phoneInput')?.value?.trim();
    const name = document.getElementById('nameInput')?.value?.trim();

    if (!Utils.validateOTP(otp)) return UI.showToast('Invalid OTP format.', 'error');
    if (!phoneRaw) return UI.showToast('Phone missing.', 'error');

    const phone = Auth._formatPhone(phoneRaw);

    try {
      const btn = document.getElementById('verifyBtn');
      UI.setLoading(btn, true, 'Verifying...');

      const confirmationResult = window.__sarthi_confirmationResult;
      if (!confirmationResult) {
        UI.showToast('No OTP request found. Please request OTP again.', 'error');
        UI.setLoading(btn, false);
        return;
      }

      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      Auth.state.phone = user.phoneNumber || phone;
      Auth.state.name = name || sessionStorage.getItem('user_name') || '';
      Auth.state.token = idToken;

      sessionStorage.setItem('user_phone', Auth.state.phone);
      sessionStorage.setItem('user_name', Auth.state.name);
      sessionStorage.setItem('auth_token', idToken);

      document.getElementById('userNameDisplay').innerHTML =
        `<i class="fa-solid fa-user-circle" style="color:var(--primary); margin-right:5px;"></i> ${Utils.escapeHTML(Auth.state.name)}`;
      document.getElementById('botNav').style.display = 'flex';
      UI.showToast('Login successful!', 'success');
      UI.switchScreen('homeScreen');
      UI.setLoading(btn, false);
    } catch (err) {
      console.error('verifyOTP error', err);
      UI.showToast(err.message || 'Invalid OTP. Try again.', 'error');
      UI.setLoading(document.getElementById('verifyBtn'), false);
      
      // Clear confirmation result on error
      try {
        window.__sarthi_confirmationResult = null;
      } catch (e) {}
    }
  },

  logout: async () => {
    if (confirm('Are you sure you want to logout?')) {
      try { if (window.firebase && firebase.auth) await firebase.auth().signOut(); } catch (e) {}
      
      // Clean up reCAPTCHA verifier
      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      } catch (e) {
        console.warn('Failed to clear recaptchaVerifier on logout', e);
      }
      
      sessionStorage.clear();
      localStorage.clear();
      location.reload();
    }
  },

  isLoggedIn: () => !!Auth.state.token
};
