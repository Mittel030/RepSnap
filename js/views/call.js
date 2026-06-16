import { api } from '../api.js';
import { avatar } from '../main.js';

const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };

let activeCall = null; // global singleton

export async function startCall(peerId, peerUser, currentUser, videoEnabled = true) {
    if (activeCall) return;
    const overlay = buildCallUI(peerUser, currentUser, videoEnabled, true);
    document.body.appendChild(overlay);

    let localStream;
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: videoEnabled });
    } catch(e) {
        overlay.remove();
        alert('Kan camera/microfoon niet openen: ' + e.message);
        return;
    }

    const pc   = new RTCPeerConnection(ICE);
    activeCall = { pc, localStream, overlay, peerId };

    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    setLocalVideo(overlay, localStream, videoEnabled);

    pc.ontrack = e => setRemoteVideo(overlay, e.streams[0]);
    pc.onicecandidate = e => e.candidate && api.sendSignal(peerId, 'ice-candidate', e.candidate).catch(()=>{});

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await api.sendSignal(peerId, 'offer', { sdp: offer, caller: currentUser, videoEnabled });

    updateStatus(overlay, 'Bellen…');
    startSignalPoll(pc, overlay, peerId, currentUser);
    bindHangup(overlay, pc, localStream, peerId);
    bindAVToggle(overlay, localStream, videoEnabled);
}

export async function handleIncomingSignal(signal, currentUser) {
    if (signal.type === 'offer') {
        if (activeCall) { await api.sendSignal(signal.from, 'hangup', {}); return; }
        showIncomingCall(signal, currentUser);
    } else if (signal.type === 'hangup' && activeCall) {
        endCall();
    }
}

function showIncomingCall(signal, currentUser) {
    const caller     = signal.data.caller;
    const videoEnabled = signal.data.videoEnabled;
    const overlay    = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;`;
    overlay.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
        ${avatar(caller, 80)}
        <p style="color:white;font-size:20px;font-weight:800;">${caller.display_name}</p>
        <p style="color:#9CA3AF;font-size:14px;">${videoEnabled ? 'Video gesprek' : 'Gesprek'} inkomend…</p>
      </div>
      <div style="display:flex;gap:40px;margin-top:20px;">
        <button id="call-decline" style="width:64px;height:64px;border-radius:50%;background:#DC2626;border:none;cursor:pointer;font-size:26px;">📵</button>
        <button id="call-accept"  style="width:64px;height:64px;border-radius:50%;background:#16A34A;border:none;cursor:pointer;font-size:26px;">📞</button>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#call-decline').addEventListener('click', async () => {
        overlay.remove();
        await api.sendSignal(signal.from, 'hangup', {}).catch(()=>{});
    });

    overlay.querySelector('#call-accept').addEventListener('click', async () => {
        overlay.remove();
        await acceptCall(signal, currentUser, videoEnabled);
    });
}

async function acceptCall(signal, currentUser, videoEnabled) {
    const callOverlay = buildCallUI(signal.data.caller, currentUser, videoEnabled, false);
    document.body.appendChild(callOverlay);

    let localStream;
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: videoEnabled });
    } catch(e) {
        callOverlay.remove();
        alert('Kan camera/microfoon niet openen: ' + e.message);
        return;
    }

    const pc = new RTCPeerConnection(ICE);
    activeCall = { pc, localStream, overlay: callOverlay, peerId: signal.from };

    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    setLocalVideo(callOverlay, localStream, videoEnabled);

    pc.ontrack = e => { setRemoteVideo(callOverlay, e.streams[0]); updateStatus(callOverlay, null); };
    pc.onicecandidate = e => e.candidate && api.sendSignal(signal.from, 'ice-candidate', e.candidate).catch(()=>{});

    await pc.setRemoteDescription(new RTCSessionDescription(signal.data.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await api.sendSignal(signal.from, 'answer', { sdp: answer });

    updateStatus(callOverlay, null);
    startSignalPoll(pc, callOverlay, signal.from, currentUser);
    bindHangup(callOverlay, pc, localStream, signal.from);
    bindAVToggle(callOverlay, localStream, videoEnabled);
}

function buildCallUI(peer, currentUser, videoEnabled, isCaller) {
    const overlay = document.createElement('div');
    overlay.id = 'call-overlay';
    overlay.style.cssText = `position:fixed;inset:0;z-index:10001;background:#111;display:flex;flex-direction:column;`;
    overlay.innerHTML = `
      <!-- Remote video (big) -->
      <div id="remote-area" style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;background:#1a1a1a;">
        <video id="remote-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;display:none;"></video>
        <div id="remote-avatar" style="display:flex;flex-direction:column;align-items:center;gap:12px;">
          ${avatar(peer, 88)}
          <p style="color:white;font-size:18px;font-weight:800;">${peer.display_name}</p>
          <p id="call-status" style="color:#9CA3AF;font-size:13px;">${isCaller ? 'Bellen…' : 'Verbonden'}</p>
        </div>
      </div>
      <!-- Local video (small, top-right) -->
      <video id="local-video" autoplay muted playsinline
        style="position:absolute;top:16px;right:16px;width:90px;height:120px;object-fit:cover;border-radius:14px;border:2px solid rgba(255,255,255,0.3);background:#000;display:none;z-index:2;"></video>
      <!-- Controls -->
      <div style="padding:24px 20px 44px;display:flex;align-items:center;justify-content:space-around;background:linear-gradient(transparent,rgba(0,0,0,0.85));">
        <button id="btn-mute"   style="${callBtn('#ffffff22')};">🎤</button>
        <button id="btn-hangup" style="${callBtn('#DC2626')};width:64px;height:64px;">📵</button>
        ${videoEnabled ? `<button id="btn-cam" style="${callBtn('#ffffff22')};">📷</button>` : `<div style="width:48px;"></div>`}
      </div>`;
    return overlay;
}

function callBtn(bg) {
    return `width:52px;height:52px;border-radius:50%;background:${bg};border:none;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;`;
}

function setLocalVideo(overlay, stream, videoEnabled) {
    const v = overlay.querySelector('#local-video');
    if (videoEnabled && stream.getVideoTracks().length) { v.srcObject = stream; v.style.display = 'block'; }
}

function setRemoteVideo(overlay, stream) {
    const v   = overlay.querySelector('#remote-video');
    const av  = overlay.querySelector('#remote-avatar');
    v.srcObject = stream;
    if (stream.getVideoTracks().length) { v.style.display = 'block'; av.style.display = 'none'; }
    else av.style.display = 'flex';
}

function updateStatus(overlay, msg) {
    const s = overlay.querySelector('#call-status');
    if (s) s.textContent = msg ?? 'Verbonden';
}

function bindHangup(overlay, pc, localStream, peerId) {
    overlay.querySelector('#btn-hangup').addEventListener('click', async () => {
        await api.sendSignal(peerId, 'hangup', {}).catch(()=>{});
        endCall();
    });
}

function bindAVToggle(overlay, localStream, videoEnabled) {
    const muteBtn = overlay.querySelector('#btn-mute');
    let muted = false;
    muteBtn?.addEventListener('click', () => {
        muted = !muted;
        localStream.getAudioTracks().forEach(t => t.enabled = !muted);
        muteBtn.textContent = muted ? '🔇' : '🎤';
        muteBtn.style.background = muted ? '#DC2626' : '#ffffff22';
    });

    const camBtn = overlay.querySelector('#btn-cam');
    let camOff = false;
    camBtn?.addEventListener('click', () => {
        camOff = !camOff;
        localStream.getVideoTracks().forEach(t => t.enabled = !camOff);
        camBtn.textContent = camOff ? '🚫' : '📷';
        camBtn.style.background = camOff ? '#DC2626' : '#ffffff22';
    });
}

function startSignalPoll(pc, overlay, peerId, currentUser) {
    let since = Date.now();
    const interval = setInterval(async () => {
        if (!activeCall) { clearInterval(interval); return; }
        try {
            const signals = await api.getSignals(since);
            for (const s of signals) {
                since = Math.max(since, s.at + 1);
                if (s.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(s.data.sdp));
                    updateStatus(overlay, null);
                } else if (s.type === 'ice-candidate') {
                    await pc.addIceCandidate(new RTCIceCandidate(s.data)).catch(()=>{});
                } else if (s.type === 'hangup') {
                    endCall(); clearInterval(interval);
                }
            }
        } catch {}
    }, 800);
    return interval;
}

export function endCall() {
    if (!activeCall) return;
    const { pc, localStream, overlay } = activeCall;
    localStream.getTracks().forEach(t => t.stop());
    pc.close();
    overlay.remove();
    activeCall = null;
}

export function hasActiveCall() { return !!activeCall; }
