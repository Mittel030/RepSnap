import { auth } from '../auth.js';

export function renderAuth(container, onSuccess) {
  let mode    = 'login';
  let error   = '';
  let loading = false;

  function render() {
    container.innerHTML = `
      <div class="flex flex-col min-h-full px-5 py-8 anim-fade" style="background:#F5F5F5;">

        <!-- Hero -->
        <div class="flex flex-col items-center text-center mb-8 pt-4 stagger">
          <svg width="96" height="96" viewBox="0 0 512 512" fill="none" class="mb-5" aria-hidden="true">
            <defs>
              <filter id="logo-shadow">
                <feDropShadow dx="0" dy="6" stdDeviation="18" flood-color="rgba(255,77,46,.35)"/>
              </filter>
            </defs>
            <circle cx="256" cy="256" r="150" fill="none" stroke="#FF4D2E" stroke-width="34" filter="url(#logo-shadow)"/>
            <g fill="#FF4D2E" filter="url(#logo-shadow)">
              <polygon points="360.00,256.00 308.00,346.07 258.79,295.90"/>
              <polygon points="308.00,346.07 204.00,346.07 222.84,278.37"/>
              <polygon points="204.00,346.07 152.00,256.00 220.05,238.47"/>
              <polygon points="152.00,256.00 204.00,165.93 253.21,216.10"/>
              <polygon points="204.00,165.93 308.00,165.93 289.16,233.63"/>
              <polygon points="308.00,165.93 360.00,256.00 291.95,273.53"/>
            </g>
            <circle cx="256" cy="256" r="30" fill="#F5F5F5"/>
          </svg>

          <h1 class="text-[42px] font-black tracking-tight leading-none mb-2 text-[#111827]">RepSnap</h1>
          <p class="text-[#9CA3AF] text-[15px] font-medium">Jouw gym. Jouw crew. Jouw gains.</p>
        </div>

        <!-- Card -->
        <div class="bg-white border border-[#E5E7EB] rounded-3xl p-5 stagger" style="box-shadow:0 2px 16px rgba(0,0,0,0.06);">

          <!-- Mode tabs -->
          <div class="flex bg-[#F3F4F6] rounded-2xl p-1 mb-5 gap-1">
            <button id="btn-login"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                ${mode==='login' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]'}">
              Inloggen
            </button>
            <button id="btn-signup"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                ${mode==='signup' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]'}">
              Registreren
            </button>
          </div>

          <!-- Error -->
          ${error ? `
          <div class="mb-4 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium rounded-2xl px-4 py-3">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            ${error}
          </div>` : ''}

          <!-- Form -->
          <form id="auth-form" class="flex flex-col gap-3.5" autocomplete="off" novalidate>
            ${mode === 'signup' ? `
            <div>
              <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Weergavenaam</label>
              <input id="f-name" type="text" placeholder="Bijv. Alex Gains" class="rs-input" autocomplete="off"/>
            </div>` : ''}

            <div>
              <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Gebruikersnaam</label>
              <input id="f-user" type="text"
                placeholder="${mode==='login' ? 'jouwusername' : 'Kies een username'}"
                class="rs-input" autocomplete="off" spellcheck="false" autocapitalize="none"/>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Wachtwoord</label>
              <input id="f-pass" type="password"
                placeholder="${mode==='login' ? '••••••••' : 'Min. 6 tekens'}"
                class="rs-input" autocomplete="${mode==='login' ? 'current-password' : 'new-password'}"/>
            </div>

            <button type="submit" class="btn-primary mt-1 ${loading ? 'opacity-60 pointer-events-none' : ''}">
              ${loading
                ? `<span class="inline-flex items-center justify-center gap-2">
                    <svg class="w-4 h-4 anim-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.4)" stroke-width="3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
                    </svg> Even geduld…</span>`
                : (mode==='login' ? 'Inloggen' : 'Account aanmaken')
              }
            </button>
          </form>

          ${mode === 'login' ? `
          <div class="mt-5 pt-5 border-t border-[#F3F4F6]">
            <p class="text-[#9CA3AF] text-[11px] font-bold text-center uppercase tracking-wider mb-3">Probeer de demo</p>
            <button id="demo-login"
              class="w-full flex items-center justify-center gap-2.5 py-3 bg-[#F3F4F6] border border-[#E5E7EB] rounded-2xl
                     text-sm font-semibold text-[#374151] hover:bg-[#E5E7EB] hover:border-[#DC2626]/30 transition-all active:scale-97">
              <img src="https://i.pravatar.cc/24?img=3" class="w-6 h-6 rounded-full" alt="" onerror="this.style.display='none'">
              Inloggen als <span class="text-[#DC2626] font-bold">alexgains</span>
            </button>
          </div>` : ''}
        </div>

        <p class="text-center text-xs text-[#D1D5DB] mt-6 pb-2">
          Alleen voor jou en je gym crew — geen advertenties, geen vreemden.
        </p>
      </div>
    `;

    setTimeout(() => {
      const first = container.querySelector(mode === 'signup' ? '#f-name' : '#f-user');
      first?.focus();
    }, 60);

    document.getElementById('btn-login').addEventListener('click',  () => { mode='login';  error=''; render(); });
    document.getElementById('btn-signup').addEventListener('click', () => { mode='signup'; error=''; render(); });

    document.getElementById('auth-form').addEventListener('submit', e => {
      e.preventDefault();
      if (loading) return;
      error = ''; loading = true; render();
      setTimeout(() => {
        try {
          if (mode === 'login') {
            auth.login(document.getElementById('f-user')?.value||'', document.getElementById('f-pass')?.value||'');
          } else {
            auth.signup(document.getElementById('f-user')?.value||'', document.getElementById('f-name')?.value||'', document.getElementById('f-pass')?.value||'');
          }
          loading = false; onSuccess();
        } catch(err) { error=err.message; loading=false; render(); }
      }, 350);
    });

    document.getElementById('demo-login')?.addEventListener('click', () => {
      if (loading) return;
      loading = true; render();
      setTimeout(() => {
        try { auth.login('alexgains','password'); loading=false; onSuccess(); }
        catch(err) { error=err.message; loading=false; render(); }
      }, 300);
    });
  }

  render();
}
