// Shared media picker — shows a bottom sheet: Take photo/video | Gallery
import { uploadFile } from './api.js';
import { openCamera, pickFromGallery } from './views/camera.js';

export function mediaBottomSheet({ accept = 'image/*,video/*', onUpload, onProgress }) {
    return new Promise((resolve, reject) => {
        const sheet = document.createElement('div');
        sheet.style.cssText = `position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,0.5);`;
        sheet.innerHTML = `
          <div style="background:white;border-radius:24px 24px 0 0;padding:20px 20px 40px;display:flex;flex-direction:column;gap:12px;">
            <div style="width:40px;height:4px;border-radius:99px;background:#D1D5DB;margin:0 auto 8px;"></div>
            <p style="font-weight:800;font-size:16px;color:#111827;margin:0 0 4px;">Media toevoegen</p>
            <button id="ms-camera" style="${sheetBtn()}">📷 Camera — foto of video</button>
            <button id="ms-gallery" style="${sheetBtn()}">🖼 Kies uit galerij</button>
            <button id="ms-cancel" style="${sheetBtn('#F3F4F6','#6B7280')}">Annuleren</button>
          </div>`;
        document.body.appendChild(sheet);

        function close() { sheet.remove(); }

        async function handleFile({ file, type }) {
            close();
            if (onProgress) onProgress(0);
            try {
                const result = await uploadFile(file, onProgress);
                resolve({ ...result, mediaType: type });
                onUpload?.(result);
            } catch(e) { reject(e); }
        }

        sheet.querySelector('#ms-camera').addEventListener('click', async () => {
            close();
            try {
                const capture = await openCamera({ video: true, onCapture: null });
                await handleFile(capture);
            } catch(e) { if (e.message !== 'Geannuleerd') reject(e); }
        });

        sheet.querySelector('#ms-gallery').addEventListener('click', async () => {
            close();
            try {
                const picked = await pickFromGallery(accept);
                await handleFile(picked);
            } catch(e) { if (e.message !== 'Geen bestand geselecteerd') reject(e); }
        });

        sheet.querySelector('#ms-cancel').addEventListener('click', () => { close(); reject(new Error('Geannuleerd')); });
        sheet.addEventListener('click', e => { if (e.target === sheet) { close(); reject(new Error('Geannuleerd')); }});
    });
}

function sheetBtn(bg = 'white', color = '#111827') {
    return `width:100%;padding:15px;border-radius:14px;background:${bg};color:${color};font-size:15px;font-weight:600;font-family:Inter,sans-serif;border:1.5px solid #E5E7EB;cursor:pointer;text-align:left;transition:background .1s;`;
}

export function mediaTag(url, type, style = '') {
    if (type === 'video') {
        return `<video src="${url}" controls playsinline preload="metadata" style="width:100%;aspect-ratio:16/9;object-fit:cover;background:#000;${style}"></video>`;
    }
    return `<img src="${url}" loading="lazy" style="${style}" onerror="this.style.minHeight='200px';this.style.background='#F3F4F6';">`;
}
