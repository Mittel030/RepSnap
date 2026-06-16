import { auth } from '../auth.js';

export function renderAuth(container, onSuccess) {
    let mode = 'login';

    function render() {
        container.innerHTML = `
          <div class="anim-fade flex flex-col items-center justify-center min-h-full px-6 py-10" style="background:#F5F5F5;">
            <div class="mb-8 flex flex-col items-center gap-3">
              <svg width="56" height="56" viewBox="0 0 512 512" fill="none">
                <circle cx="256" cy="256" r="150" fill="none" stroke="#FF4D2E" stroke-width="34"/>
                <g fill="#FF4D2E">
                  <polygon points="360,256 308,346 259,296"/>
                  <polygon points="308,346 204,346 223,278"/>
                  <polygon points="204,346 152,256 220,238"/>
                  <polygon points="152,256 204,166 253,216"/>
                  <polygon points="204,166 308,166 289,234"/>
                  <polygon points="308,166 360,256 292,274"/>
                </g>
                <circle cx="256" cy="256" r="30" fill="white"/>
              </svg>
              <span class="text-[28px] font-black tracking-tight text-[#111827]">RepSnap</span>
              <p class="text-[#9CA3AF] text-sm text-center">Deel je moments met je crew.</p>
            </div>

            <div class="w-full" style="max-width:360px;">
              <div class="flex rounded-2xl overflow-hidden border border-[#E5E7EB] mb-6 bg-white">
                <button id="tab-login"  class="flex-1 py-3 text-[14px] font-bold transition-all ${mode==='login' ?'bg-[#111827] text-white':'text-[#9CA3AF]'}">Inloggen</button>
                <button id="tab-signup" class="flex-1 py-3 text-[14px] font-bold transition-all ${mode==='signup'?'bg-[#111827] text-white':'text-[#9CA3AF]'}">Registreren</button>
              </div>

              <form id="auth-form" class="flex flex-col gap-4" novalidate>
                ${mode === 'signup' ? `<input id="f-display" type="text" placeholder="Weergavenaam" class="rs-input" maxlength="60" autocomplete="name"/>` : ''}
                <input id="f-user" type="text"     placeholder="Gebruikersnaam" class="rs-input" autocomplete="username" autocapitalize="none"/>
                <input id="f-pass" type="password" placeholder="Wachtwoord${mode==='signup'?' (min. 6)':''}" class="rs-input" autocomplete="${mode==='login'?'current-password':'new-password'}"/>
                <div id="auth-err" class="hidden bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3"></div>
                <button type="submit" id="auth-submit" class="btn-primary">${mode==='login'?'Inloggen':'Account aanmaken'}</button>
              </form>
            </div>
          </div>`;

        document.getElementById('tab-login').addEventListener('click',  () => { mode='login';  render(); });
        document.getElementById('tab-signup').addEventListener('click', () => { mode='signup'; render(); });

        document.getElementById('auth-form').addEventListener('submit', async e => {
            e.preventDefault();
            const errEl  = document.getElementById('auth-err');
            const submit = document.getElementById('auth-submit');
            errEl.classList.add('hidden');
            submit.disabled = true;
            submit.textContent = '…';
            try {
                if (mode === 'login') {
                    await auth.login(
                        document.getElementById('f-user').value.trim(),
                        document.getElementById('f-pass').value
                    );
                } else {
                    await auth.signup(
                        document.getElementById('f-user').value.trim(),
                        document.getElementById('f-display').value.trim(),
                        document.getElementById('f-pass').value
                    );
                }
                onSuccess();
            } catch(err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                submit.disabled = false;
                submit.textContent = mode==='login'?'Inloggen':'Account aanmaken';
            }
        });
    }

    render();
}
