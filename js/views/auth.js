import { auth } from '../auth.js';

export function renderAuth(container, onSuccess) {
    let mode = 'login';

    function render() {
        container.innerHTML = `
          <div class="anim-fade flex flex-col items-center justify-center min-h-full px-5 py-10" style="background:#F7F6F4;">

            <!-- Logo block -->
            <div class="mb-8 flex flex-col items-center gap-3">
              <div style="width:68px;height:68px;border-radius:22px;background:#FFFFFF;box-shadow:0 4px 20px rgba(220,38,38,0.18),0 1px 6px rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">
                <svg width="40" height="40" viewBox="0 0 512 512" fill="none">
                  <circle cx="256" cy="256" r="150" fill="none" stroke="#DC2626" stroke-width="38"/>
                  <g fill="#DC2626">
                    <polygon points="360,256 308,346 259,296"/>
                    <polygon points="308,346 204,346 223,278"/>
                    <polygon points="204,346 152,256 220,238"/>
                    <polygon points="152,256 204,166 253,216"/>
                    <polygon points="204,166 308,166 289,234"/>
                    <polygon points="308,166 360,256 292,274"/>
                  </g>
                  <circle cx="256" cy="256" r="30" fill="white"/>
                </svg>
              </div>
              <span class="text-[26px] font-black tracking-tight text-[#111827]">RepSnap</span>
              <p class="text-[#A8A29E] text-[14px] text-center leading-snug">Deel je moments<br>met je crew.</p>
            </div>

            <!-- Form card -->
            <div class="w-full" style="max-width:360px;">
              <div style="background:#FFFFFF;border-radius:24px;box-shadow:0 2px 16px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04);padding:24px;">

                <!-- Tab toggle -->
                <div style="display:flex;background:#F0EEEB;border-radius:14px;padding:4px;margin-bottom:20px;">
                  <button id="tab-login"  style="flex:1;padding:9px 0;border-radius:10px;font-size:14px;font-weight:700;font-family:inherit;border:none;cursor:pointer;transition:all .2s;
                    background:${mode==='login' ?'#FFFFFF':'transparent'};
                    color:${mode==='login' ?'#111827':'#A8A29E'};
                    box-shadow:${mode==='login'?'0 1px 6px rgba(0,0,0,0.1)':'none'};">Inloggen</button>
                  <button id="tab-signup" style="flex:1;padding:9px 0;border-radius:10px;font-size:14px;font-weight:700;font-family:inherit;border:none;cursor:pointer;transition:all .2s;
                    background:${mode==='signup'?'#FFFFFF':'transparent'};
                    color:${mode==='signup'?'#111827':'#A8A29E'};
                    box-shadow:${mode==='signup'?'0 1px 6px rgba(0,0,0,0.1)':'none'};">Registreren</button>
                </div>

                <form id="auth-form" class="flex flex-col gap-3" novalidate>
                  ${mode === 'signup' ? `<input id="f-display" type="text" placeholder="Weergavenaam" class="rs-input" maxlength="60" autocomplete="name"/>` : ''}
                  <input id="f-user" type="text"     placeholder="Gebruikersnaam" class="rs-input" autocomplete="username" autocapitalize="none"/>
                  <input id="f-pass" type="password" placeholder="Wachtwoord${mode==='signup'?' (min. 6)':''}" class="rs-input" autocomplete="${mode==='login'?'current-password':'new-password'}"/>
                  <div id="auth-err" class="hidden text-[13px] font-medium rounded-2xl px-4 py-3" style="background:rgba(220,38,38,0.08);color:#B91C1C;border:1.5px solid rgba(220,38,38,0.18);"></div>
                  <button type="submit" id="auth-submit" class="btn-primary" style="margin-top:4px;">${mode==='login'?'Inloggen':'Account aanmaken'}</button>
                </form>
              </div>

              ${mode === 'login' ? `<p class="text-center text-[12px] text-[#A8A29E] mt-5">Geen account? <button id="switch-signup" style="background:none;border:none;color:#DC2626;font-weight:700;font-family:inherit;font-size:12px;cursor:pointer;">Registreer hier</button></p>` : ''}
              ${mode === 'signup' ? `<p class="text-center text-[12px] text-[#A8A29E] mt-5">Al een account? <button id="switch-login" style="background:none;border:none;color:#DC2626;font-weight:700;font-family:inherit;font-size:12px;cursor:pointer;">Log in</button></p>` : ''}
            </div>
          </div>`;

        document.getElementById('tab-login').addEventListener('click',  () => { mode='login';  render(); });
        document.getElementById('tab-signup').addEventListener('click', () => { mode='signup'; render(); });
        document.getElementById('switch-signup')?.addEventListener('click', () => { mode='signup'; render(); });
        document.getElementById('switch-login')?.addEventListener('click',  () => { mode='login';  render(); });

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
