// Fullscreen camera overlay — returns { url, type, blob } via promise
export function openCamera({ video = true, onCapture }) {
    return new Promise((resolve, reject) => {
        let stream, mediaRecorder, chunks = [], recording = false, facingMode = 'environment';

        const overlay = document.createElement('div');
        overlay.id = 'camera-overlay';
        overlay.style.cssText = `position:fixed;inset:0;z-index:10000;background:#000;display:flex;flex-direction:column;`;
        overlay.innerHTML = `
          <video id="cam-preview" autoplay playsinline muted style="flex:1;width:100%;object-fit:cover;"></video>
          <canvas id="cam-canvas" style="display:none;"></canvas>
          <div id="cam-captured" style="display:none;position:absolute;inset:0;background:#000;">
            <video id="cam-cap-video" controls playsinline style="width:100%;height:100%;object-fit:contain;display:none;"></video>
            <img id="cam-cap-img" style="width:100%;height:100%;object-fit:contain;display:none;" alt="preview">
          </div>
          <!-- Controls -->
          <div style="position:absolute;top:16px;left:0;right:0;display:flex;justify-content:space-between;padding:0 20px;">
            <button id="cam-close" style="${btnStyle('#00000066')};">✕</button>
            <button id="cam-flip"  style="${btnStyle('#00000066')};">🔄</button>
          </div>
          <!-- Bottom bar -->
          <div id="cam-bar" style="position:absolute;bottom:0;left:0;right:0;padding:24px 20px 40px;display:flex;align-items:center;justify-content:space-around;background:linear-gradient(transparent,rgba(0,0,0,.7));">
            <button id="cam-gallery" style="${btnStyle('#ffffff33')};font-size:22px;">🖼</button>
            <button id="cam-shutter" style="width:72px;height:72px;border-radius:50%;background:white;border:4px solid rgba(255,255,255,0.5);cursor:pointer;transition:transform .1s;"></button>
            ${video ? `<button id="cam-mode" style="${btnStyle('#ffffff33')};font-size:13px;font-weight:700;color:white;">VIDEO</button>` : `<div style="width:48px;"></div>`}
          </div>
          <!-- Rec indicator -->
          <div id="cam-rec" style="display:none;position:absolute;top:60px;left:50%;transform:translateX(-50%);background:#DC2626;color:white;font-size:13px;font-weight:700;border-radius:20px;padding:4px 14px;display:flex;align-items:center;gap:6px;">
            <div style="width:8px;height:8px;border-radius:50%;background:white;animation:dotPulse 1s infinite;"></div> REC
          </div>
          <!-- Accept bar (after capture) -->
          <div id="cam-accept-bar" style="display:none;position:absolute;bottom:0;left:0;right:0;padding:24px 40px 40px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(transparent,rgba(0,0,0,.7));">
            <button id="cam-retake" style="${btnStyle('#ffffff33')};font-size:13px;font-weight:700;color:white;padding:12px 20px;">Opnieuw</button>
            <button id="cam-use"    style="background:#DC2626;color:white;font-size:15px;font-weight:700;border:none;border-radius:14px;padding:13px 28px;cursor:pointer;">Gebruik</button>
          </div>
          <!-- Gallery input (hidden) -->
          <input id="cam-file-input" type="file" accept="image/*,video/*" style="display:none;">`;

        document.body.appendChild(overlay);

        let isVideoMode = false;
        let capturedBlob = null;
        let capturedType = null;
        let capturedUrl  = null;

        function btnStyle(bg) {
            return `width:48px;height:48px;border-radius:50%;background:${bg};border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);`;
        }

        async function startStream() {
            try {
                if (stream) stream.getTracks().forEach(t => t.stop());
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width:{ideal:1920}, height:{ideal:1080} }, audio: true });
                document.getElementById('cam-preview').srcObject = stream;
            } catch(e) {
                reject(new Error('Camera niet beschikbaar: ' + e.message));
                close();
            }
        }

        function showCapture(blob, type, url) {
            capturedBlob = blob; capturedType = type; capturedUrl = url;
            document.getElementById('cam-captured').style.display = 'block';
            document.getElementById('cam-bar').style.display = 'none';
            document.getElementById('cam-accept-bar').style.display = 'flex';
            if (type === 'video') {
                const v = document.getElementById('cam-cap-video');
                v.src = url; v.style.display = 'block';
                document.getElementById('cam-cap-img').style.display = 'none';
            } else {
                const i = document.getElementById('cam-cap-img');
                i.src = url; i.style.display = 'block';
                document.getElementById('cam-cap-video').style.display = 'none';
            }
        }

        function retake() {
            URL.revokeObjectURL(capturedUrl);
            capturedBlob = capturedType = capturedUrl = null;
            document.getElementById('cam-captured').style.display = 'none';
            document.getElementById('cam-bar').style.display = 'flex';
            document.getElementById('cam-accept-bar').style.display = 'none';
        }

        function takePhoto() {
            const video  = document.getElementById('cam-preview');
            const canvas = document.getElementById('cam-canvas');
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                showCapture(blob, 'image', url);
            }, 'image/jpeg', 0.92);
        }

        function startRecording() {
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
            chunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorder.ondataavailable = e => e.data.size > 0 && chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url  = URL.createObjectURL(blob);
                showCapture(blob, 'video', url);
                document.getElementById('cam-rec').style.display = 'none';
            };
            mediaRecorder.start();
            recording = true;
            document.getElementById('cam-rec').style.display = 'flex';
        }

        function stopRecording() {
            if (mediaRecorder && recording) { mediaRecorder.stop(); recording = false; }
        }

        function close() {
            if (stream) stream.getTracks().forEach(t => t.stop());
            if (capturedUrl) URL.revokeObjectURL(capturedUrl);
            overlay.remove();
        }

        // Shutter button — tap = photo, hold = video (if video mode enabled)
        const shutter = overlay.querySelector('#cam-shutter');
        let holdTimer;
        shutter.addEventListener('pointerdown', () => {
            if (!video || !isVideoMode) return;
            holdTimer = setTimeout(() => { startRecording(); shutter.style.background='#DC2626'; }, 300);
        });
        shutter.addEventListener('pointerup', () => {
            clearTimeout(holdTimer);
            if (recording) { stopRecording(); shutter.style.background='white'; }
            else takePhoto();
        });
        shutter.addEventListener('click', () => { if (!video || !isVideoMode) takePhoto(); });

        overlay.querySelector('#cam-close').addEventListener('click', () => { close(); reject(new Error('Geannuleerd')); });
        overlay.querySelector('#cam-flip').addEventListener('click', async () => {
            facingMode = facingMode === 'environment' ? 'user' : 'environment';
            await startStream();
        });

        const modeBtn = overlay.querySelector('#cam-mode');
        modeBtn?.addEventListener('click', () => {
            isVideoMode = !isVideoMode;
            modeBtn.textContent = isVideoMode ? 'FOTO' : 'VIDEO';
            shutter.style.borderColor = isVideoMode ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.5)';
        });

        overlay.querySelector('#cam-retake').addEventListener('click', retake);
        overlay.querySelector('#cam-use').addEventListener('click', () => {
            const ext  = capturedType === 'video' ? 'webm' : 'jpg';
            const file = new File([capturedBlob], `capture.${ext}`, { type: capturedBlob.type });
            close();
            resolve({ file, type: capturedType });
        });

        // Gallery picker
        overlay.querySelector('#cam-gallery').addEventListener('click', () => {
            overlay.querySelector('#cam-file-input').click();
        });
        overlay.querySelector('#cam-file-input').addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            close();
            resolve({ file, type });
        });

        startStream();
    });
}

// Simple file picker (gallery only, no camera UI)
export function pickFromGallery(accept = 'image/*,video/*') {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) { reject(new Error('Geen bestand geselecteerd')); return; }
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            resolve({ file, type });
        };
        input.click();
    });
}
