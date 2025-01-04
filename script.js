document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const generateBtn = document.getElementById('generateBtn');
    const qrCodesContainer = document.getElementById('qrCodesContainer');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const downloadAllContainer = document.getElementById('downloadAllContainer');

    generateBtn.addEventListener('click', generateQRCodes);
    downloadAllBtn.addEventListener('click', downloadAllQRCodes);

    function generateQRCodes() {
        const urls = urlInput.value.split(',').map(url => url.trim()).filter(url => url);
        
        if (urls.length === 0) {
            alert('Lütfen en az bir URL girin!');
            return;
        }

        qrCodesContainer.innerHTML = '';
        downloadAllContainer.style.display = 'block';

        urls.forEach((url, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-4 col-lg-3 mb-4';

            const card = document.createElement('div');
            card.className = 'card qr-card h-100';

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body text-center';

            const qrContainer = document.createElement('div');
            qrContainer.className = 'qr-code-container mb-3';
            
            const siteName = new URL(url).hostname;

            QRCode.toCanvas(qrContainer, url, { width: 200 }, function(error) {
                if (error) console.error(error);
            });

            const title = document.createElement('h5');
            title.className = 'card-title mb-3';
            title.textContent = siteName;

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-primary btn-sm';
            downloadBtn.textContent = 'QR Kodu İndir';
            downloadBtn.onclick = () => downloadSingleQR(qrContainer.querySelector('canvas'), siteName);

            cardBody.appendChild(qrContainer);
            cardBody.appendChild(title);
            cardBody.appendChild(downloadBtn);
            card.appendChild(cardBody);
            col.appendChild(card);
            qrCodesContainer.appendChild(col);
        });
    }

    function downloadSingleQR(canvas, siteName) {
        canvas.toBlob(function(blob) {
            saveAs(blob, `${siteName}-qr.png`);
        });
    }

    async function downloadAllQRCodes() {
        const zip = new JSZip();
        const canvases = document.querySelectorAll('.qr-code-container canvas');
        const titles = document.querySelectorAll('.card-title');

        for (let i = 0; i < canvases.length; i++) {
            const canvas = canvases[i];
            const siteName = titles[i].textContent;
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            zip.file(`${siteName}-qr.png`, blob);
        }

        const zipBlob = await zip.generateAsync({type: 'blob'});
        saveAs(zipBlob, 'tum-qr-kodlari.zip');
    }
});
