// ✅ SECURITY: Booking with server-side validation
const Booking = {
    state: {
        search: { from: 'Alampur', to: 'Gwalior', date: '', time: '' },
        selectedSeats: [],
        passengers: [],
        ticket: null
    },

    searchBuses: async () => {
        const date = document.getElementById('dateInput')?.value;
        const time = document.getElementById('timeInput')?.value;

        if (!date) return UI.showToast('Please select a date.', 'error');

        try {
            const btn = document.getElementById('searchBtn');
            UI.setLoading(btn, true, 'Searching buses...');
            
            const booked = await API.booking.searchSeats(Booking.state.search.from, Booking.state.search.to, date, time);
            Booking.drawSeats(booked.seats || []);
            UI.switchScreen('seatScreen');
            UI.setLoading(btn, false);
        } catch (err) {
            UI.showToast('Failed to search buses.', 'error');
            UI.setLoading(document.getElementById('searchBtn'), false);
        }
    },

    drawSeats: (booked) => {
        const grid = document.getElementById('seatGrid');
        grid.innerHTML = '<div class="seat drv"><i class="fa-solid fa-user-tie"></i></div>';
        
        for (let i = 1; i <= CONFIG.TOTAL_SEATS; i++) {
            if (i === 2 || i === 7) grid.appendChild(document.createElement('div'));
            const seat = document.createElement('div');
            seat.className = `seat ${booked.includes(i) ? 'book' : 'avail'}`;
            seat.textContent = i;
            if (!booked.includes(i)) {
                seat.onclick = () => Booking.toggleSeat(i, seat);
            }
            grid.appendChild(seat);
        }
    },

    toggleSeat: (num, el) => {
        if (Booking.state.selectedSeats.includes(num)) {
            Booking.state.selectedSeats = Booking.state.selectedSeats.filter(s => s !== num);
            el.classList.remove('sel');
        } else {
            if (Booking.state.selectedSeats.length >= CONFIG.MAX_SEATS) {
                return UI.showToast(`Max ${CONFIG.MAX_SEATS} seats allowed.`, 'error');
            }
            Booking.state.selectedSeats.push(num);
            el.classList.add('sel');
        }
        Booking.updateSeatUI();
    },

    updateSeatUI: () => {
        const len = Booking.state.selectedSeats.length;
        document.getElementById('selectedSeatsList').textContent = len ? Booking.state.selectedSeats.sort((a, b) => a - b).join(', ') : 'None';
        const btn = document.getElementById('proceedBtn');
        btn.disabled = !len;
    },

    proceedToPassengers: () => {
        const form = document.getElementById('passForms');
        form.innerHTML = '';
        Booking.state.selectedSeats.sort((a, b) => a - b).forEach((seat, i) => {
            form.innerHTML += `
                <div class="glass-card">
                    <div style="color:var(--primary); font-weight:900; margin-bottom:12px; font-size: 16px;">Seat ${seat}</div>
                    <input type="text" id="pN_${seat}" class="input" placeholder="Full Name" style="margin-bottom:12px;">
                    <input type="number" id="pA_${seat}" class="input" placeholder="Age (1-100)" min="1" max="100" style="margin-bottom:12px;">
                </div>
            `;
        });
        UI.switchScreen('passengerScreen');
    },

    proceedToCheckout: () => {
        Booking.state.passengers = [];
        let valid = true;

        Booking.state.selectedSeats.forEach(seat => {
            const name = document.getElementById(`pN_${seat}`)?.value.trim();
            const age = parseInt(document.getElementById(`pA_${seat}`)?.value);
            
            if (!Utils.validateName(name) || !Utils.validateAge(age)) {
                valid = false;
            } else {
                Booking.state.passengers.push({ seat, name, age });
            }
        });

        if (!valid) {
            return UI.showToast('Please check name (letters only) and age (1-100).', 'error');
        }

        const total = Booking.state.passengers.length * CONFIG.FARE;
        document.getElementById('chkSeats').textContent = Booking.state.passengers.length;
        document.getElementById('payAmount').textContent = `₹${total}`;
        UI.switchScreen('checkoutScreen');
    },

    confirmBooking: async (mode) => {
        try {
            const btn = document.getElementById('cashBtn');
            UI.setLoading(btn, true, 'Processing...');
            
            const ticket = await API.booking.confirm(
                Booking.state.selectedSeats,
                Booking.state.passengers,
                mode
            );
            
            Booking.state.ticket = ticket;
            Booking.renderTicket(ticket);
            UI.showToast('Booking successful!', 'success');
            UI.switchScreen('ticketScreen');
            UI.setLoading(btn, false);
        } catch (err) {
            UI.showToast('Booking failed. Try again.', 'error');
            UI.setLoading(document.getElementById('cashBtn'), false);
        }
    },

    renderTicket: (ticket) => {
        document.getElementById('tPNR').textContent = ticket.pnr;
        document.getElementById('tFrom').textContent = ticket.from;
        document.getElementById('tTo').textContent = ticket.to;
        document.getElementById('tDate').textContent = `${ticket.date} | ${ticket.time}`;
        document.getElementById('tSeats').textContent = Booking.state.passengers.map(p => p.seat).join(', ');
        document.getElementById('tPhone').innerHTML = `<i class="fa-solid fa-phone"></i> ${Utils.escapeHTML(Auth.state.phone)}`;
    }
};