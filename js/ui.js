// ✅ UI Management & Theme system
const UI = {
    showToast: (msg, type = 'success') => {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        document.getElementById('toastMsg').textContent = msg;
        
        const iconMap = {
            error: ['fa-circle-exclamation', 'var(--danger)'],
            warning: ['fa-triangle-exclamation', 'var(--warning)'],
            success: ['fa-circle-check', 'var(--primary)']
        };
        
        const [iconClass, color] = iconMap[type] || iconMap.success;
        icon.className = `fa-solid ${iconClass}`;
        icon.style.color = color;
        toast.style.borderColor = color;
        
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    },

    switchScreen: (screenId) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        window.scrollTo(0, 0);
    },

    setLoading: (btn, isLoading, text = '') => {
        btn.disabled = isLoading;
        if (isLoading) {
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${text || 'Loading...'}`;
        }
    },

    toggleTheme: () => {
        const modal = document.getElementById('themeModal');
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        } else {
            modal.innerHTML = `
                <div class="theme-circle" style="background: #EAB308;" onclick="UI.setTheme('gold', '#EAB308', '#FDE047')"><i class="fa-solid fa-check"></i></div>
                <div class="theme-circle" style="background: #00E5FF;" onclick="UI.setTheme('cyan', '#00E5FF', '#73E8FF')"><i class="fa-solid fa-check"></i></div>
                <div class="theme-circle" style="background: #FF2A54;" onclick="UI.setTheme('crimson', '#FF2A54', '#FF758C')"><i class="fa-solid fa-check"></i></div>
                <div class="theme-circle" style="background: #A855F7;" onclick="UI.setTheme('purple', '#A855F7', '#D8B4FE')"><i class="fa-solid fa-check"></i></div>
            `;
            modal.style.display = 'grid';
            modal.style.gridTemplateColumns = 'repeat(2, 1fr)';
            modal.style.gap = '10px';
        }
    },

    setTheme: (name, primary, light) => {
        document.documentElement.style.setProperty('--primary', primary);
        document.documentElement.style.setProperty('--primary-light', light);
        const rgb = primary.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ');
        document.documentElement.style.setProperty('--primary-glow', `rgba(${rgb}, 0.25)`);
        localStorage.setItem('theme', name);
        document.getElementById('themeModal').style.display = 'none';
    }
};