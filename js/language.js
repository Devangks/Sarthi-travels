// ✅ Multi-language support
const Lang = {
    current: localStorage.getItem('lang') === 'hi' ? 'hi' : 'en',
    
    toggle: () => {
        Lang.current = Lang.current === 'en' ? 'hi' : 'en';
        localStorage.setItem('lang', Lang.current);
        Lang.applyAll();
    },

    get: (key) => Lang.strings[Lang.current][key] || key,

    applyAll: () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = Lang.get(el.dataset.i18n);
        });
    },

    strings: {
        en: {
            'sarthi': 'Sarthi Travels',
            'home': 'Home',
            'trips': 'Trips',
            'logout': 'Logout',
            'booking_confirmed': 'Booking Confirmed!',
            'error': 'Error',
            'success': 'Success',
            'loading': 'Loading...'
        },
        hi: {
            'sarthi': 'सार्थी ट्रेवल्स',
            'home': 'होम',
            'trips': 'यात्रा',
            'logout': 'लॉगआउट',
            'booking_confirmed': 'बुकिंग हो गई!',
            'error': 'त्रुटि',
            'success': 'सफल',
            'loading': 'लोड हो रहा है...'
        }
    }
};