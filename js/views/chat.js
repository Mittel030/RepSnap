import { api }                   from '../api.js';
import { avatar, timeAgo, showToast } from '../main.js';
import { router }               from '../router.js';

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
      <div class="anim-fade pb-8" style="background:#F5F5F5;">

        ${groups.length ? `
        <p class="px-4 pt-4 pb-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Groepschats</p>
        <div class="bg-white border-y border-[#F3F4F6]">
          ${groups.map((g, i) => `
            ${i>0?'<hr class="rs-divider mx-4">':''}
            <div class="conv-item user-row cursor-pointer" data-type="group" data-id="${g.group_id}">
              <div class="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#DC2626] to-[#7C3AED] flex items-center justify-center flex-shrink-0 text-white font-black text-[18px]">
                ${g.name.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-[#111827] truncate">${esc(g.name)}</p>
                <p class="text-[12px] text-[#9CA3AF] truncate">${g.last_msg ? esc(g.last_msg.slice(0,40)) : 'Stuur een bericht…'}</p>
              </div>
              ${g.last_at ? `<span class="text-[11px] text-[#9CA3AF] flex-shrink-0">${timeAgo(g.last_at)}</span>` : ''}
            </div>`).join('')}
        </div>` : ''}

        <p class="px-4 pt-5 pb-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Directe berichten</p>
        ${allDMs.length
          ? `<div class="bg-white border-y border-[#F3F4F6]">
              ${allDMs.map((d, i) => `
                ${i>0?'<hr class="rs-divider mx-4">':''}
                <div class="conv-item user-row cursor-pointer" data-type="dm" data-id="${d.peerId}">
                  ${avatar(d, 46)}
                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-semibold text-[#111827] truncate">${esc(d.display_name)}</p>
                    <p class="text-[12px] text-[#9CA3AF] truncate">${d.lastMsg ? esc(d.lastMsg.slice(0,40)) : '@'+esc(d.username)}</p>
                  </div>
                  ${d.lastAt ? `<span class="text-[11px] text-[#9CA3AF] flex-shrink-0">${timeAgo(d.lastAt)}</span>` : ''}
                </div>`).join('')}
            </div>`
          : `<div class="empty-state"><div class="empty-icon">💬</div><p class="font-bold text-[#111827] text-[17px]">Nog geen chats</p><p class="text-[#9CA3AF] text-sm">Voeg vrienden toe via de Friends tab om te chatten.</p></div>`}
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

function chatThread(title, subtitle, messages, currentUser, onSend, onBack) {
    return `
      <div class="flex flex-col" style="height:100vh;background:#F5F5F5;">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E5E7EB] flex-shrink-0">
          <button id="thread-back" class="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-[15px] text-[#111827] truncate">${esc(title)}</p>
            ${subtitle ? `<p class="text-[12px] text-[#9CA3AF] truncate">${esc(subtitle)}</p>` : ''}
          </div>
        </div>
        <!-- Messages -->
        <div id="thread-msgs" class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"></div>
        <!-- Input -->
        <div class="border-t border-[#E5E7EB] px-4 py-3 flex gap-2 bg-white flex-shrink-0" style="padding-bottom:max(12px,env(safe-area-inset-bottom));">
          <input id="thread-input" type="text" placeholder="Bericht…" class="rs-input flex-1" style="padding:10px 14px;" maxlength="500" autocomplete="off"/>
          <button id="thread-send" class="btn-sm brand !rounded-xl px-4 !py-2">Stuur</button>
        </div>
      </div>`;
}

function renderMsgs(messages, currentUser) {
    const box = document.getElementById('thread-msgs');
    if (!box) return;
    if (!messages.length) { box.innerHTML = `<div class="flex-1 flex items-center justify-center"><p class="text-[#9CA3AF] text-sm">Stuur het eerste bericht 👋</p></div>`; return; }
    box.innerHTML = messages.map(m => {
        const isMe = m.sender_id === currentUser.id;
        return `
          <div class="flex ${isMe?'justify-end':'justify-start'} gap-2 items-end">
            ${!isMe ? `<div style="flex-shrink:0;">${avatar(m, 28)}</div>` : ''}
            <div style="max-width:72%;">
              ${!isMe ? `<p class="text-[10px] text-[#9CA3AF] font-semibold mb-0.5 ml-1">${esc(m.display_name)}</p>` : ''}
              <div class="px-3 py-2 rounded-2xl text-[14px] leading-snug ${isMe?'bg-[#DC2626] text-white rounded-br-sm':'bg-white text-[#111827] border border-[#E5E7EB] rounded-bl-sm'}" style="word-break:break-word;">
                ${esc(m.content)}
              </div>
              <p class="text-[10px] text-[#9CA3AF] mt-0.5 mx-1 ${isMe?'text-right':'text-left'}">${timeAgo(m.created_at)}</p>
            </div>
          </div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
}

function bindThread(currentUser, loadFn, sendFn) {
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
    async function send() {
        const content = input?.value.trim();
        if (!content) return;
        input.value = '';
        try {
            const msg = await sendFn(content);
            messages.push(msg);
            renderMsgs(messages, currentUser);
        } catch(e) { showToast(e.message, 'error'); }
    }

    document.getElementById('thread-send')?.addEventListener('click', send);
    input?.addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); send(); }});

    return () => clearInterval(polling);
}

function openDMThread(container, currentUser, peerId, peerName, peerData, onBack) {
    const subtitle = peerData?.username ? '@' + peerData.username : '';
    container.innerHTML = chatThread(peerName || peerId, subtitle, [], currentUser, null, onBack);

    const stopPolling = bindThread(
        currentUser,
        () => api.getDMs(peerId),
        (content) => api.sendDM(peerId, content)
    );

    document.getElementById('thread-back')?.addEventListener('click', () => { stopPolling(); onBack(); });
}

function openGroupThread(container, currentUser, groupId, groupName, onBack) {
    container.innerHTML = chatThread(groupName, 'Groepschat', [], currentUser, null, onBack);

    const stopPolling = bindThread(
        currentUser,
        () => api.getGroupMessages(groupId),
        (content) => api.sendGroupMessage(groupId, content)
    );

    document.getElementById('thread-back')?.addEventListener('click', () => { stopPolling(); onBack(); });
}
