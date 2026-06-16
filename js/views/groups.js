import { api }                                             from '../api.js';
import { openModal, closeModal, avatar, timeAgo, showToast } from '../main.js';

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function groupCard(group) {
    return `
      <div class="group-card mx-4 mb-4" data-gid="${group.id}">
        <div class="relative" style="height:130px;">
          ${group.cover
            ? `<img src="${group.cover}" alt="${group.name}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full flex items-center justify-center" style="background:linear-gradient(135deg,#F3F4F6,#E5E7EB);"><span style="font-size:40px;">💬</span></div>`}
          <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,.6) 0%,transparent 55%)"></div>
          <div class="absolute bottom-3 left-4 right-4">
            <p class="font-black text-white text-[17px] leading-tight">${group.name}</p>
            <span class="text-[12px] text-white/80 font-medium">${group.member_count} ${group.member_count===1?'lid':'leden'}</span>
          </div>
        </div>
        <div class="px-4 py-3">
          ${group.description?`<p class="text-[#6B7280] text-[13px] leading-relaxed line-clamp-2 mb-2">${esc(group.description)}</p>`:''}
          <div class="flex items-center justify-between">
            <span class="text-[12px] text-[#9CA3AF]">Code: <span class="font-mono font-bold text-[#DC2626] tracking-wider">${group.code}</span></span>
          </div>
        </div>
      </div>`;
}

async function groupDetail(container, groupId, currentUser, goBack) {
    container.innerHTML = `<div class="flex items-center justify-center h-40"><div class="anim-spin w-7 h-7 border-2 border-[#DC2626] border-t-transparent rounded-full"></div></div>`;
    let group, members, posts;
    try {
        const [gs, ms, ps] = await Promise.all([api.getGroups(), api.getGroupMembers(groupId), api.getGroupPosts(groupId)]);
        group   = [...gs.mine, ...gs.others].find(g => g.id === groupId);
        members = ms;
        posts   = ps;
    } catch(e) { showToast(e.message, 'error'); goBack(); return; }
    if (!group) { goBack(); return; }

    const myMember = members.find(m => m.user_id === currentUser.id);
    const isAdmin  = myMember?.role === 'admin';
    let tab = 'posts';

    function renderDetail() {
        container.innerHTML = `
          <div class="anim-fade pb-8" style="background:#F5F5F5;">
            <div class="relative" style="height:200px;">
              ${group.cover
                ? `<img src="${group.cover}" alt="${group.name}" class="w-full h-full object-cover">`
                : `<div class="w-full h-full flex items-center justify-center" style="background:linear-gradient(135deg,#F3F4F6,#E5E7EB);"><span style="font-size:56px;">💬</span></div>`}
              <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 60%)"></div>
              <button id="btn-back" class="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div class="absolute bottom-4 left-4 right-4">
                <p class="font-black text-white text-[22px] leading-tight">${group.name}</p>
                <p class="text-white/75 text-[13px] mt-1">${members.length} leden · Code: <span class="font-mono font-bold text-[#FCA5A5] tracking-wider">${group.code}</span></p>
              </div>
            </div>

            <div class="px-4 py-4 bg-white border-b border-[#F3F4F6]">
              ${group.description?`<p class="text-[#6B7280] text-[14px] leading-relaxed mb-4">${esc(group.description)}</p>`:''}
              <div class="flex gap-2 flex-wrap">
                <button id="btn-leave" class="btn-sm ${isAdmin?'danger':'ghost'}">${isAdmin?'🗑 Verwijderen':'Verlaten'}</button>
              </div>
            </div>

            <div class="px-4 py-4 bg-white border-b border-[#F3F4F6]">
              <p class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Leden (${members.length})</p>
              <div class="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                ${members.map(m => `
                  <div class="flex flex-col items-center gap-1.5 flex-shrink-0">
                    ${avatar(m, 46)}
                    <span class="text-[10px] font-semibold text-[#9CA3AF] max-w-[52px] truncate">${m.username}</span>
                    ${m.role==='admin'?`<span class="badge" style="font-size:9px;">admin</span>`:''}
                  </div>`).join('')}
              </div>
            </div>

            <!-- Tabs: Posts | Chat -->
            <div class="tab-bar">
              <button class="tab-btn ${tab==='posts'?'active':''}" data-tab="posts">
                <div class="flex items-center justify-center gap-1.5">
                  <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Posts
                </div>
              </button>
              <button class="tab-btn ${tab==='chat'?'active':''}" data-tab="chat">
                <div class="flex items-center justify-center gap-1.5">
                  <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Chat
                </div>
              </button>
            </div>

            ${tab === 'posts' ? `
            <div>
              <div class="px-4 pt-4 pb-3 flex items-center justify-between">
                <p class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Posts (${posts.length})</p>
                <button id="btn-add-gpost" class="btn-sm brand flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                  Post
                </button>
              </div>
              ${posts.length
                ? posts.map(p => `
                    <div class="bg-white border-b border-[#F3F4F6]">
                      <div class="flex items-center gap-3 px-4 py-3">
                        ${avatar(p, 36)}
                        <div>
                          <p class="text-[14px] font-semibold text-[#111827]">${p.display_name}</p>
                          <p class="text-[12px] text-[#9CA3AF]">${timeAgo(p.created_at)}</p>
                        </div>
                      </div>
                      <img src="${p.image}" alt="post" class="post-img" loading="lazy">
                      ${p.caption?`<p class="px-4 py-3 text-[14px] text-[#374151] leading-snug">${esc(p.caption)}</p>`:''}
                    </div>`).join('')
                : `<div class="empty-state"><div class="empty-icon">📸</div><p class="font-bold text-[#111827]">Geen posts</p><p class="text-[#9CA3AF] text-sm">Wees de eerste!</p></div>`}
            </div>` : ''}

            ${tab === 'chat' ? renderGroupChat(groupId, currentUser, members) : ''}
          </div>`;

        document.getElementById('btn-back').addEventListener('click', goBack);

        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => { tab = btn.dataset.tab; renderDetail(); });
        });

        document.getElementById('btn-leave')?.addEventListener('click', async () => {
            const msg = isAdmin ? `Groep "${group.name}" permanent verwijderen?` : `Groep "${group.name}" verlaten?`;
            if (!confirm(msg)) return;
            try {
                isAdmin ? await api.deleteGroup(group.id) : await api.leaveGroup(group.id);
                showToast(isAdmin ? 'Groep verwijderd' : 'Groep verlaten', 'info');
                goBack();
            } catch(e) { showToast(e.message, 'error'); }
        });

        document.getElementById('btn-add-gpost')?.addEventListener('click', () => {
            openModal(`
              <div class="px-5 pb-6">
                <div class="flex items-center justify-between pt-2 pb-5">
                  <h2 class="text-[18px] font-black text-[#111827]">Post in ${group.name}</h2>
                  <button id="mc" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <form id="gpost-form" class="flex flex-col gap-4" novalidate>
                  <div><label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Afbeelding URL</label>
                  <input id="gpost-img" type="url" placeholder="https://…" class="rs-input" autocomplete="off"/></div>
                  <div><label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Caption</label>
                  <textarea id="gpost-cap" rows="3" placeholder="Schrijf iets…" class="rs-input"></textarea></div>
                  <div id="gpost-err" class="hidden bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3"></div>
                  <button type="submit" id="gpost-sub" class="btn-primary">Posten</button>
                </form>
              </div>`, c => {
                c.querySelector('#mc').addEventListener('click', closeModal);
                c.querySelector('#gpost-form').addEventListener('submit', async e => {
                    e.preventDefault();
                    const img = c.querySelector('#gpost-img').value.trim();
                    const cap = c.querySelector('#gpost-cap').value.trim();
                    const err = c.querySelector('#gpost-err');
                    const sub = c.querySelector('#gpost-sub');
                    if (!img) { err.textContent='Voeg een afbeelding URL toe.'; err.classList.remove('hidden'); return; }
                    sub.disabled=true; sub.textContent='…';
                    try {
                        await api.addGroupPost(group.id, img, cap);
                        closeModal();
                        showToast('Post toegevoegd 🔥', 'success');
                        posts = await api.getGroupPosts(group.id);
                        renderDetail();
                    } catch(e) { err.textContent=e.message; err.classList.remove('hidden'); sub.disabled=false; sub.textContent='Posten'; }
                });
            });
        });

        if (tab === 'chat') bindGroupChat(groupId, currentUser);
    }

    renderDetail();
}

function renderGroupChat(groupId, currentUser, members) {
    return `
      <div id="group-chat" class="flex flex-col" style="height:420px;">
        <div id="chat-msgs" class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"></div>
        <div class="border-t border-[#E5E7EB] px-4 py-3 flex gap-2 bg-white">
          <input id="chat-input" type="text" placeholder="Bericht sturen…" class="rs-input flex-1" style="padding:10px 14px;" maxlength="500" autocomplete="off"/>
          <button id="chat-send" class="btn-sm brand !rounded-xl px-4">Stuur</button>
        </div>
      </div>`;
}

function bindGroupChat(groupId, currentUser) {
    let messages = [];
    let polling;

    async function loadMessages() {
        try {
            const newMsgs = await api.getGroupMessages(groupId);
            if (JSON.stringify(newMsgs) !== JSON.stringify(messages)) {
                messages = newMsgs;
                renderMessages();
            }
        } catch {}
    }

    function renderMessages() {
        const box = document.getElementById('chat-msgs');
        if (!box) { clearInterval(polling); return; }
        box.innerHTML = messages.map(m => {
            const isMe = m.sender_id === currentUser.id;
            return `
              <div class="flex ${isMe?'justify-end':'justify-start'} gap-2 items-end">
                ${!isMe ? `<div style="flex-shrink:0;">${avatar(m, 28)}</div>` : ''}
                <div style="max-width:72%;">
                  ${!isMe ? `<p class="text-[10px] text-[#9CA3AF] font-semibold mb-0.5 ml-1">${m.display_name}</p>` : ''}
                  <div class="px-3 py-2 rounded-2xl text-[14px] leading-snug ${isMe?'bg-[#DC2626] text-white rounded-br-sm':'bg-white text-[#111827] border border-[#E5E7EB] rounded-bl-sm'}" style="word-break:break-word;">
                    ${(m.content||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
                  </div>
                  <p class="text-[10px] text-[#9CA3AF] mt-0.5 ${isMe?'text-right':'text-left'} mx-1">${timeAgo(m.created_at)}</p>
                </div>
              </div>`;
        }).join('');
        box.scrollTop = box.scrollHeight;
    }

    loadMessages();
    polling = setInterval(loadMessages, 3000);

    const input = document.getElementById('chat-input');
    document.getElementById('chat-send')?.addEventListener('click', sendMsg);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }});

    async function sendMsg() {
        const content = input?.value.trim();
        if (!content) return;
        input.value = '';
        try {
            const msg = await api.sendGroupMessage(groupId, content);
            messages.push(msg);
            renderMessages();
        } catch(e) { showToast(e.message, 'error'); }
    }
}

export async function renderGroups(container, currentUser) {
    async function showList() {
        container.innerHTML = `<div class="flex items-center justify-center h-40"><div class="anim-spin w-7 h-7 border-2 border-[#DC2626] border-t-transparent rounded-full"></div></div>`;
        let mine = [], others = [];
        try { ({ mine, others } = await api.getGroups()); }
        catch {}

        container.innerHTML = `
          <div class="anim-fade py-4 pb-8" style="background:#F5F5F5;">
            ${mine.length
              ? `<p class="px-4 pb-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Mijn groepen</p>
                 ${mine.map(gr => groupCard(gr)).join('')}`
              : `<div class="empty-state"><div class="empty-icon">💬</div><p class="font-bold text-[#111827] text-[17px]">Nog geen groepen</p><p class="text-[#9CA3AF] text-sm">Maak een groep aan of join er een via een code.</p></div>`}

            <div class="mx-4 mt-2 p-4 bg-white border border-[#E5E7EB] rounded-2xl" style="box-shadow:0 1px 4px rgba(0,0,0,0.05);">
              <p class="text-[14px] font-bold text-[#111827] mb-3">Groep joinen via code</p>
              <div class="flex gap-2">
                <input id="join-code" type="text" placeholder="bijv. AB12CD" class="rs-input flex-1 font-mono uppercase tracking-widest" style="padding:11px 14px;font-size:15px;" maxlength="10"/>
                <button id="btn-join" class="btn-sm brand !rounded-xl px-5 !text-[14px]">Joinen</button>
              </div>
              <div id="join-err" class="hidden mt-2.5 text-red-600 text-[13px] font-medium"></div>
            </div>

            ${others.length ? `
            <p class="px-4 pt-6 pb-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Andere groepen</p>
            ${others.map(gr => groupCard(gr)).join('')}` : ''}
          </div>`;

        container.querySelectorAll('.group-card').forEach(card => {
            card.addEventListener('click', () => groupDetail(container, card.dataset.gid, currentUser, showList));
        });

        document.getElementById('btn-join')?.addEventListener('click', async () => {
            const code  = document.getElementById('join-code').value.trim().toUpperCase();
            const errEl = document.getElementById('join-err');
            errEl.classList.add('hidden');
            if (!code) { errEl.textContent='Voer een code in.'; errEl.classList.remove('hidden'); return; }
            try {
                const group = await api.joinGroup(code);
                showToast(`Welkom in ${group.name}!`, 'success');
                await groupDetail(container, group.id, currentUser, showList);
            } catch(e) { errEl.textContent=e.message; errEl.classList.remove('hidden'); }
        });
    }

    await showList();
}

renderGroups.openCreate = function(currentUser) {
    openModal(`
      <div class="px-5 pb-6">
        <div class="flex items-center justify-between pt-2 pb-5">
          <h2 class="text-[18px] font-black text-[#111827]">Groep aanmaken</h2>
          <button id="mc" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <form id="create-form" class="flex flex-col gap-4" novalidate>
          <div><label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Groepsnaam</label>
          <input id="g-name" type="text" placeholder="bijv. Gym Crew" class="rs-input" maxlength="60" autocomplete="off"/></div>
          <div><label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Beschrijving</label>
          <textarea id="g-desc" rows="2" placeholder="Waar is de groep voor?" class="rs-input"></textarea></div>
          <div><label class="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Cover URL <span class="normal-case text-[#9CA3AF] font-normal">(optioneel)</span></label>
          <input id="g-cover" type="url" placeholder="https://…" class="rs-input" autocomplete="off"/></div>
          <p class="text-[12px] text-[#9CA3AF]">Er wordt automatisch een unieke uitnodigingscode aangemaakt.</p>
          <div id="g-err" class="hidden bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3"></div>
          <button type="submit" id="g-sub" class="btn-primary">Groep aanmaken</button>
        </form>
      </div>`, content => {
        content.querySelector('#mc').addEventListener('click', closeModal);
        content.querySelector('#create-form').addEventListener('submit', async e => {
            e.preventDefault();
            const name  = content.querySelector('#g-name').value.trim();
            const desc  = content.querySelector('#g-desc').value.trim();
            const cover = content.querySelector('#g-cover').value.trim();
            const err   = content.querySelector('#g-err');
            const sub   = content.querySelector('#g-sub');
            if (!name) { err.textContent='Voer een groepsnaam in.'; err.classList.remove('hidden'); return; }
            sub.disabled=true; sub.textContent='…';
            try {
                const group = await api.createGroup(name, desc, cover);
                closeModal();
                showToast(`Groep "${name}" aangemaakt! Code: ${group.code}`, 'success');
                await renderGroups(document.getElementById('view'), currentUser);
            } catch(e) { err.textContent=e.message; err.classList.remove('hidden'); sub.disabled=false; sub.textContent='Groep aanmaken'; }
        });
    });
};
