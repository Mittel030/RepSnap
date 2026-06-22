import { api }                         from '../api.js';
import { avatar, timeAgo, showToast }   from '../main.js';
import { mediaBottomSheet, mediaTag }   from '../media.js';
import { startCall }                    from './call.js';

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export async function renderChat(container, currentUser) {
    await showConversationList(container, currentUser);
}

async function showConversationList(container, currentUser) {
    container.innerHTML = `<div class="flex items-center justify-center h-40"><div class="anim-spin w-7 h-7 border-2 border-[#DC2626] border-t-transparent rounded-full"></div></div>`;
    let data;
    try { data = await api.getConversations(); }
    catch { container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p class="font-bold text-[#111827]">Kan chats niet laden</p></div>`; return; }

    const { dms = [], friends = [], groups = [] } = data;
    const dmPeers = new Set(dms.map(d => d.peer_id));
    const friendsWithoutDM = friends.filter(f => !dmPeers.has(f.fid));
    const allDMs = [
        ...dms.map(d => ({ type:'dm', peerId:d.peer_id, display_name:d.display_name, username:d.username, avatar:d.avatar, lastMsg:d.last_msg, lastAt:d.last_at })),
        ...friendsWithoutDM.map(f => ({ type:'dm', peerId:f.fid, display_name:f.display_name, username:f.username, avatar:f.avatar, lastMsg:null, lastAt:0 })),
    ];

    container.innerHTML = `
      <div class="anim-fade pb-8" style="background:#F7F6F4;">

        ${groups.length ? `
        <p class="px-4 pt-4 pb-2 text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Groepschats</p>
        <div class="inline-card mx-4">
          ${groups.map((g, i) => `
            ${i>0?'<hr class="rs-divider mx-4">':''}
            <div class="conv-item user-row cursor-pointer" data-type="group" data-id="${g.group_id}">
              <div class="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#DC2626] to-[#7C3AED] flex items-center justify-center flex-shrink-0 text-white font-black text-[18px]">
                ${g.name.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-[#111827] truncate">${esc(g.name)}</p>
                <p class="text-[12px] text-[#A8A29E] truncate">${g.last_msg ? esc(g.last_msg.slice(0,40)) : 'Stuur een bericht…'}</p>
              </div>
              ${g.last_at ? `<span class="text-[11px] text-[#A8A29E] flex-shrink-0">${timeAgo(g.last_at)}</span>` : ''}
            </div>`).join('')}
        </div>` : ''}

        <p class="px-4 pt-5 pb-2 text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Directe berichten</p>
        ${allDMs.length
          ? `<div class="inline-card mx-4">
              ${allDMs.map((d, i) => `
                ${i>0?'<hr class="rs-divider mx-4">':''}
                <div class="conv-item user-row cursor-pointer" data-type="dm" data-id="${d.peerId}">
                  ${avatar(d, 46)}
                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-semibold text-[#111827] truncate">${esc(d.display_name)}</p>
                    <p class="text-[12px] text-[#A8A29E] truncate">${d.lastMsg ? esc(d.lastMsg.slice(0,40)) : '@'+esc(d.username)}</p>
                  </div>
                  ${d.lastAt ? `<span class="text-[11px] text-[#A8A29E] flex-shrink-0">${timeAgo(d.lastAt)}</span>` : ''}
                </div>`).join('')}
            </div>`
          : `<div class="empty-state"><div class="empty-icon">💬</div><p class="font-bold text-[#111827] text-[17px]">Nog geen chats</p><p class="text-[#A8A29E] text-sm">Voeg vrienden toe via de Friends tab om te chatten.</p></div>`}
      </div>`;

    container.querySelectorAll('.conv-item').forEach(item => {
        item.addEventListener('click', () => {
            const { type, id } = item.dataset;
            if (type === 'dm') {
                const dm = allDMs.find(d => d.peerId === id);
                openDMThread(container, currentUser, id, dm?.display_name || '', dm, () => showConversationList(container, currentUser));
            } else {
                const g = groups.find(gr => gr.group_id === id);
                openGroupThread(container, currentUser, id, g?.name || '', () => showConversationList(container, currentUser));
            }
        });
    });
}

function msgBubble(m, currentUser) {
    const isMe = m.sender_id === currentUser.id;
    let media = '';
    if (m.attachment) {
        if (m.attach_type === 'video') {
            media = `<div class="mt-1 rounded-xl overflow-hidden" style="max-width:220px;">${mediaTag(m.attachment,'video')}</div>`;
        } else {
            media = `<div class="mt-1 rounded-xl overflow-hidden" style="max-width:220px;"><img src="${m.attachment}" loading="lazy" style="width:100%;max-height:260px;object-fit:cover;" onerror="this.style.minHeight='80px';this.style.background='#F0EEEB';"></div>`;
        }
    }
    return `
      <div class="flex ${isMe?'justify-end':'justify-start'} gap-2 items-end">
        ${!isMe ? `<div style="flex-shrink:0;">${avatar(m, 28)}</div>` : ''}
        <div style="max-width:72%;">
          ${!isMe ? `<p class="text-[10px] text-[#A8A29E] font-semibold mb-0.5 ml-1">${esc(m.display_name)}</p>` : ''}
          ${media}
          ${m.content ? `<div class="px-3 py-2 rounded-2xl text-[14px] leading-snug ${isMe?'bg-[#DC2626] text-white rounded-br-sm':'bg-white text-[#111827] rounded-bl-sm'}" style="word-break:break-word;">${esc(m.content)}</div>` : ''}
          <p class="text-[10px] text-[#A8A29E] mt-0.5 mx-1 ${isMe?'text-right':'text-left'}">${timeAgo(m.created_at)}</p>
        </div>
      </div>`;
}

function renderMsgs(messages, currentUser) {
    const box = document.getElementById('thread-msgs');
    if (!box) return;
    if (!messages.length) { box.innerHTML = `<div class="flex-1 flex items-center justify-center"><p class="text-[#A8A29E] text-sm">Stuur het eerste bericht 👋</p></div>`; return; }
    box.innerHTML = messages.map(m => msgBubble(m, currentUser)).join('');
    box.scrollTop = box.scrollHeight;
}

function bindThread(currentUser, loadFn, sendFn, mediaBtn) {
    let messages = [];
    let polling;

    async function refresh() {
        try {
            const newMsgs = await loadFn();
            if (JSON.stringify(newMsgs) !== JSON.stringify(messages)) {
                messages = newMsgs;
                renderMsgs(messages, currentUser);
            }
        } catch {}
    }

    refresh();
    polling = setInterval(refresh, 3000);

    const input = document.getElementById('thread-input');

    async function send(content = '', attachment = null, attachType = null) {
        if (!content && !attachment) return;
        const prev = input?.value;
        if (input) input.value = '';
        try {
            const msg = await sendFn(content, attachment, attachType);
            messages.push(msg);
            renderMsgs(messages, currentUser);
        } catch(e) {
            if (input) input.value = prev || '';
            showToast(e.message, 'error');
        }
    }

    document.getElementById('thread-send')?.addEventListener('click', () => send(input?.value.trim()));
    input?.addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); send(input.value.trim()); }});

    mediaBtn?.addEventListener('click', async () => {
        try {
            const result = await mediaBottomSheet({});
            await send('', result.url, result.type);
        } catch(e) {
            if (e.message !== 'Geannuleerd') showToast(e.message, 'error');
        }
    });

    return () => clearInterval(polling);
}

function threadHTML(title, subtitle, extraHeaderBtn = '') {
    return `
      <div class="flex flex-col" style="height:100vh;background:#F7F6F4;">
        <div class="flex items-center gap-3 px-4 py-3 bg-white flex-shrink-0" style="border-bottom:1px solid #EDEAE7;">
          <button id="thread-back" class="w-9 h-9 flex items-center justify-center rounded-full text-[#A8A29E] hover:text-[#374151] hover:bg-[#F0EEEB] transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-[15px] text-[#111827] truncate">${esc(title)}</p>
            ${subtitle ? `<p class="text-[12px] text-[#A8A29E] truncate">${esc(subtitle)}</p>` : ''}
          </div>
          ${extraHeaderBtn}
        </div>
        <div id="thread-msgs" class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"></div>
        <div class="px-3 py-3 flex gap-2 bg-white flex-shrink-0 items-center" style="border-top:1px solid #EDEAE7;" style="padding-bottom:max(12px,env(safe-area-inset-bottom));">
          <button id="thread-media" class="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full text-[#A8A29E] hover:text-[#DC2626] hover:bg-red-50 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>
          </button>
          <input id="thread-input" type="text" placeholder="Bericht…" class="rs-input flex-1" style="padding:10px 14px;" maxlength="500" autocomplete="off"/>
          <button id="thread-send" class="btn-sm brand !rounded-xl px-4 !py-2">Stuur</button>
        </div>
      </div>`;
}

function openDMThread(container, currentUser, peerId, peerName, peerData, onBack) {
    const subtitle = peerData?.username ? '@' + peerData.username : '';
    const callBtn = `
      <button id="thread-call" class="w-9 h-9 flex items-center justify-center rounded-full text-[#A8A29E] hover:text-[#DC2626] hover:bg-red-50 transition-all" title="Bellen">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
      </button>`;

    container.innerHTML = threadHTML(peerName || peerId, subtitle, callBtn);

    const mediaBtn = document.getElementById('thread-media');
    const stopPolling = bindThread(
        currentUser,
        () => api.getDMs(peerId),
        (content, att, atType) => api.sendDM(peerId, content, att, atType),
        mediaBtn
    );

    document.getElementById('thread-call')?.addEventListener('click', () => {
        startCall(peerId, peerData || { display_name: peerName, username: '' }, currentUser, true);
    });

    document.getElementById('thread-back')?.addEventListener('click', () => { stopPolling(); onBack(); });
}

function openGroupThread(container, currentUser, groupId, groupName, onBack) {
    container.innerHTML = threadHTML(groupName, 'Groepschat');

    const mediaBtn = document.getElementById('thread-media');
    const stopPolling = bindThread(
        currentUser,
        () => api.getGroupMessages(groupId),
        (content, att, atType) => api.sendGroupMessage(groupId, content, att, atType),
        mediaBtn
    );

    document.getElementById('thread-back')?.addEventListener('click', () => { stopPolling(); onBack(); });
}
