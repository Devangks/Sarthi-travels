// Client-side API that talks directly to Supabase REST endpoints (PostgREST)
// Falls back to localStorage test data when Supabase config isn't provided.
// Requires js/config.js (CONFIG.SUPABASE_URL and CONFIG.SUPABASE_ANON_KEY).
const API = (function () {
  const supabaseUrl = CONFIG.SUPABASE_URL;
  const anonKey = CONFIG.SUPABASE_ANON_KEY;
  const headers = {
    'Content-Type': 'application/json'
  };

  if (anonKey) {
    headers['apikey'] = anonKey;
    headers['Authorization'] = `Bearer ${anonKey}`;
  }

  const hasSupabase = () => !!(supabaseUrl && anonKey);

  const supabaseFetch = async (path, opts = {}) => {
    if (!hasSupabase()) throw new Error('Supabase not configured');
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1${path}`;
    const res = await fetch(url, Object.assign({
      headers: Object.assign({}, headers, opts.headers || {})
    }, opts));
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      const err = new Error(`Supabase REST error ${res.status} ${res.statusText} ${txt}`);
      err.status = res.status;
      throw err;
    }
    if (res.status === 204) return null;
    return await res.json();
  };

  // Local fallback storage helpers (for dev/no-Supabase)
  const LS_KEY = 'sarthi.bookings';
  const readLocalBookings = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  };
  const writeLocalBookings = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

  const genPNR = () => {
    const t = Date.now().toString(36).toUpperCase();
    const r = Math.floor(Math.random() * 9000 + 1000).toString();
    return `S${t.slice(-4)}${r}`;
  };

  return {
    auth: {
      requestOTP: async (phone, name) => {
        // keep minimal behaviour to allow older UI flows that call API.auth.requestOTP
        // but the preferred flow for production is Firebase Phone Auth (handled in js/auth.js).
        // For compatibility: create a small session-based test OTP
        const pin = String(Math.floor(100000 + Math.random() * 900000));
        const payload = {
          otp: pin,
          name: name || null,
          expiresAt: Date.now() + (CONFIG.OTP_EXPIRY_MS || 5 * 60 * 1000)
        };
        try {
          sessionStorage.setItem(`otp_${phone}`, JSON.stringify(payload));
        } catch (e) {}
        // best-effort upsert to Supabase profiles if available
        if (hasSupabase()) {
          try {
            await supabaseFetch(`/profiles?phone=eq.${encodeURIComponent(phone)}`, {
              method: 'PATCH',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify({ phone, name })
            }).catch(async () => {
              await supabaseFetch(`/profiles`, {
                method: 'POST',
                headers: { Prefer: 'return=representation' },
                body: JSON.stringify({ phone, name })
              });
            });
          } catch (err) {
            console.warn('Supabase: profile upsert failed', err);
          }
        }
        return { message: 'OTP generated', testPin: pin };
      },

      verifyOTP: async (phone, otp) => {
        try {
          const raw = sessionStorage.getItem(`otp_${phone}`) || localStorage.getItem(`otp_${phone}`);
          if (!raw) throw new Error('No OTP requested for this phone');
          const { otp: storedOtp, expiresAt, name } = JSON.parse(raw);
          if (Date.now() > (expiresAt || 0)) throw new Error('OTP expired');
          if (String(otp) !== String(storedOtp)) throw new Error('Invalid OTP');

          const token = btoa(`${phone}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`);
          sessionStorage.setItem('auth_token', token);

          if (hasSupabase()) {
            try {
              await supabaseFetch(`/profiles?phone=eq.${encodeURIComponent(phone)}`, {
                method: 'PATCH',
                headers: { Prefer: 'return=representation' },
                body: JSON.stringify({ phone, name: name || null })
              }).catch(async () => {
                await supabaseFetch('/profiles', {
                  method: 'POST',
                  headers: { Prefer: 'return=representation' },
                  body: JSON.stringify({ phone, name: name || null })
                });
              });
            } catch (err) {
              console.warn('Supabase: profile upsert failed during verify', err);
            }
          }

          try { sessionStorage.removeItem(`otp_${phone}`); } catch (e) {}
          return { token };
        } catch (err) {
          throw err;
        }
      }
    },

    booking: {
      searchSeats: async (from, to, date, time) => {
        if (hasSupabase()) {
          try {
            const rows = await supabaseFetch(`/bookings?date=eq.${encodeURIComponent(date)}&time=eq.${encodeURIComponent(time)}`, {
              method: 'GET'
            });
            const booked = [];
            (rows || []).forEach(r => {
              if (Array.isArray(r.seats)) booked.push(...r.seats);
              else if (typeof r.seats === 'string') {
                try {
                  const parsed = JSON.parse(r.seats);
                  if (Array.isArray(parsed)) booked.push(...parsed);
                } catch (_) {
                  booked.push(...r.seats.split(',').map(x => Number(x)).filter(Boolean));
                }
              }
            });
            return { seats: Array.from(new Set(booked)).map(Number).filter(Boolean) };
          } catch (err) {
            console.warn('Supabase searchSeats failed, falling back to local', err);
          }
        }
        const all = readLocalBookings();
        const booked = all.filter(b => b.date === date && b.time === time).flatMap(b => b.seats || []);
        return { seats: Array.from(new Set(booked)).map(Number).filter(Boolean) };
      },

      confirm: async (seats, passengers, mode) => {
        const pnr = genPNR();
        const ticket = {
          pnr,
          from: Booking?.state?.search?.from || null,
          to: Booking?.state?.search?.to || null,
          date: Booking?.state?.search?.date || null,
          time: Booking?.state?.search?.time || null,
          seats: seats,
          passengers: passengers,
          amount: (passengers?.length || seats?.length || 0) * CONFIG.FARE,
          phone: Auth?.state?.phone || sessionStorage.getItem('user_phone') || null,
          mode: mode || 'cash',
          created_at: new Date().toISOString()
        };

        if (hasSupabase()) {
          try {
            const payload = Object.assign({}, ticket, { seats: ticket.seats, passengers: ticket.passengers });
            const rows = await supabaseFetch('/bookings', {
              method: 'POST',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify(payload)
            });
            if (Array.isArray(rows) && rows[0]) return Object.assign(ticket, rows[0]);
            return ticket;
          } catch (err) {
            console.warn('Supabase confirm failed, falling back to localStorage', err);
          }
        }

        const all = readLocalBookings();
        all.push(ticket);
        writeLocalBookings(all);
        return ticket;
      },

      getTrips: async () => {
        if (hasSupabase()) {
          try {
            const phone = Auth?.state?.phone || sessionStorage.getItem('user_phone');
            if (!phone) return [];
            const rows = await supabaseFetch(`/bookings?phone=eq.${encodeURIComponent(phone)}&order=created_at.desc`, { method: 'GET' });
            return rows || [];
          } catch (err) {
            console.warn('Supabase getTrips failed, falling back to local', err);
          }
        }
        const all = readLocalBookings();
        const phone = Auth?.state?.phone || sessionStorage.getItem('user_phone');
        return (all.filter(b => !phone || b.phone === phone)).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      },

      cancel: async (pnr) => {
        if (hasSupabase()) {
          try {
            await supabaseFetch(`/bookings?pnr=eq.${encodeURIComponent(pnr)}`, { method: 'DELETE' });
            return { ok: true };
          } catch (err) {
            console.warn('Supabase cancel failed, falling back to local', err);
          }
        }
        const all = readLocalBookings();
        const filtered = all.filter(b => b.pnr !== pnr);
        writeLocalBookings(filtered);
        return { ok: true };
      }
    },

    admin: {
      // getManifest: always return an array []. Fall back to localStorage silently on any error.
      getManifest: async (date, time) => {
        try {
          if (hasSupabase()) {
            try {
              const rows = await supabaseFetch(
                `/bookings?date=eq.${encodeURIComponent(date)}&time=eq.${encodeURIComponent(time)}&order=created_at.asc`,
                { method: 'GET' }
              );
              // If Supabase returns an array, return it. If it returns an object with bookings, return that.
              if (Array.isArray(rows)) return rows;
              if (rows && Array.isArray(rows.bookings)) return rows.bookings;
              // Unexpected shape from Supabase — fall through to local fallback.
              console.warn('Supabase getManifest returned unexpected shape, falling back to local');
            } catch (err) {
              // Don't surface errors to the UI — log and fall back to localStorage.
              console.warn('Supabase getManifest failed, falling back to local', err);
            }
          }

          // Local fallback (always returns an array)
          try {
            const all = readLocalBookings();
            return (all || [])
              .filter(b => b.date === date && b.time === time)
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          } catch (e) {
            console.warn('Local bookings read failed in getManifest', e);
            return [];
          }
        } catch (e) {
          // Catch-all to ensure this function never throws
          console.warn('Unexpected error in admin.getManifest', e);
          return [];
        }
      },

      markPaid: async (pnr, mode) => {
        if (hasSupabase()) {
          try {
            const rows = await supabaseFetch(`/bookings?pnr=eq.${encodeURIComponent(pnr)}`, {
              method: 'PATCH',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify({ paid: true, payment_mode: mode })
            });
            return rows && rows[0] ? rows[0] : { pnr, paid: true, payment_mode: mode };
          } catch (err) {
            console.warn('Supabase markPaid failed, falling back to local', err);
          }
        }
        const all = readLocalBookings();
        const idx = all.findIndex(b => b.pnr === pnr);
        if (idx >= 0) {
          all[idx].paid = true;
          all[idx].payment_mode = mode;
          writeLocalBookings(all);
          return all[idx];
        }
        throw new Error('PNR not found');
      },

      blockSeats: async (date, time, seats, name) => {
        const pnr = genPNR();
        const ticket = {
          pnr,
          from: null,
          to: null,
          date,
          time,
          seats,
          passengers: [],
          amount: 0,
          phone: null,
          mode: 'blocked',
          name,
          created_at: new Date().toISOString()
        };
        if (hasSupabase()) {
          try {
            await supabaseFetch('/bookings', { method: 'POST', body: JSON.stringify(ticket) });
            return { ok: true, pnr };
          } catch (err) {
            console.warn('Supabase blockSeats failed, falling back to local', err);
          }
        }
        const all = readLocalBookings();
        all.push(ticket);
        writeLocalBookings(all);
        return { ok: true, pnr };
      },

      saveUPI: async (upiId) => {
        if (hasSupabase()) {
          try {
            await supabaseFetch('/settings', {
              method: 'PATCH',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify({ key: 'admin_upi', value: upiId })
            }).catch(async () => {
              await supabaseFetch('/settings', {
                method: 'POST',
                body: JSON.stringify({ key: 'admin_upi', value: upiId })
              });
            });
            return { ok: true };
          } catch (err) {
            console.warn('Supabase saveUPI failed', err);
          }
        }
        localStorage.setItem('sarthi.admin_upi', upiId);
        return { ok: true };
      }
    }
  };
})();
