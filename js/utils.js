// ✅ SECURITY: XSS Protection + Utility functions
const Utils = {
    escapeHTML: (str) => {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            "'": '&#39;', '"': '&quot;'
        }[tag]));
    },

    validateName: (name) => /^[a-zA-Z\s]{2,50}$/.test(name),
    validatePhone: (phone) => /^[6-9]\d{9}$/.test(phone),
    validateAge: (age) => Number(age) > 0 && Number(age) <= 100,
    validateOTP: (otp) => /^\d{4}$/.test(otp),

    getISTDate: () => {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
    },

    formatDate: (date) => {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
};