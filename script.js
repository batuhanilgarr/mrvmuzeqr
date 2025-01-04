document.addEventListener('DOMContentLoaded', function() {
    // AOS başlatma
    AOS.init({
        duration: 800,
        easing: 'ease-out',
        once: false,
        mirror: true,
        offset: 50
    });

    const urlInput = document.getElementById('urlInput');
    const generateBtn = document.getElementById('generateBtn');
    const qrCodesContainer = document.getElementById('qrCodesContainer');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const downloadAllContainer = document.getElementById('downloadAllContainer');

    generateBtn.addEventListener('click', generateQRCodes);
    downloadAllBtn.addEventListener('click', downloadAllQRCodes);
    urlInput.addEventListener('input', validateUrls);

    // URL doğrulama fonksiyonu
    function validateUrls() {
        const urls = urlInput.value.split(',').map(url => url.trim()).filter(url => url);
        const validationResults = urls.map(validateUrl);
        
        if (urls.length > 0) {
            if (validationResults.every(result => result.isValid)) {
                urlInput.style.borderColor = '#02c39a';
                generateBtn.disabled = false;
                generateBtn.title = 'QR kodları oluştur';
            } else {
                urlInput.style.borderColor = '#ff6b6b';
                generateBtn.disabled = true;
                generateBtn.title = 'Lütfen geçerli URL\'ler girin';
            }
        } else {
            urlInput.style.borderColor = '#e9ecef';
            generateBtn.disabled = false;
        }

        const invalidUrls = validationResults.filter(result => !result.isValid);
        if (invalidUrls.length > 0) {
            showToast('Geçersiz URL(ler) tespit edildi. Lütfen kontrol edin.', 'warning');
        }
    }

    function validateUrl(url) {
        try {
            url = url.trim().toLowerCase();
            
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            const urlObj = new URL(url);
            
            if (!urlObj.hostname.includes('.')) {
                return { isValid: false, error: 'Geçersiz domain' };
            }

            const forbiddenChars = /[\s<>\\^`{|}]/;
            if (forbiddenChars.test(url)) {
                return { isValid: false, error: 'URL yasaklı karakterler içeriyor' };
            }

            if (urlObj.hostname.length < 3) {
                return { isValid: false, error: 'Domain çok kısa' };
            }

            return { isValid: true, normalizedUrl: url };
        } catch (e) {
            return { isValid: false, error: 'Geçersiz URL formatı' };
        }
    }

    function generateQRCodes() {
        const urls = urlInput.value.split(',')
            .map(url => url.trim())
            .filter(url => url);
        
        if (urls.length === 0) {
            showToast('Lütfen en az bir URL girin!', 'error');
            return;
        }

        const validationResults = urls.map(validateUrl);
        if (!validationResults.every(result => result.isValid)) {
            showToast('Lütfen tüm URL\'lerin geçerli olduğundan emin olun!', 'error');
            return;
        }

        qrCodesContainer.innerHTML = '';
        downloadAllContainer.style.display = 'block';

        const gridContainer = document.createElement('div');
        gridContainer.className = 'row g-4 justify-content-center';
        qrCodesContainer.appendChild(gridContainer);

        urls.forEach((url, index) => {
            const col = document.createElement('div');
            col.className = 'col-sm-6 col-md-4 col-lg-3';
            col.setAttribute('data-aos', 'zoom-in');
            col.setAttribute('data-aos-delay', (index * 100).toString());
            col.setAttribute('data-aos-duration', '800');

            const card = document.createElement('div');
            card.className = 'card qr-card shadow-sm h-100';

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body text-center p-4';

            const qrContainer = document.createElement('div');
            qrContainer.className = 'qr-code-container mb-3';
            
            const validationResult = validateUrl(url);
            const normalizedUrl = validationResult.normalizedUrl;
            const siteName = new URL(normalizedUrl).hostname;

            const qrDiv = document.createElement('div');
            qrDiv.className = 'qr-code-inner';
            new QRCode(qrDiv, {
                text: normalizedUrl,
                width: 180,
                height: 180,
                colorDark: "#2d3436",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            qrContainer.appendChild(qrDiv);

            const title = document.createElement('h5');
            title.className = 'card-title mb-3';
            title.textContent = siteName;

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-primary btn-sm w-100 download-btn';
            downloadBtn.innerHTML = '<i class="fas fa-download me-2"></i>İndir';
            downloadBtn.onclick = () => downloadSingleQR(qrDiv.querySelector('canvas'), siteName);

            cardBody.appendChild(qrContainer);
            cardBody.appendChild(title);
            cardBody.appendChild(downloadBtn);
            card.appendChild(cardBody);
            col.appendChild(card);
            gridContainer.appendChild(col);
        });

        setTimeout(() => {
            qrCodesContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start'
            });
        }, 100);

        showToast('QR kodları başarıyla oluşturuldu!', 'success');
        
        setTimeout(() => {
            AOS.refresh();
        }, 500);
    }

    function downloadSingleQR(canvas, siteName) {
        canvas.toBlob(function(blob) {
            saveAs(blob, `${siteName}-qr.png`);
            showToast('QR kod başarıyla indirildi!', 'success');
        });
    }

    async function downloadAllQRCodes() {
        const zip = new JSZip();
        const canvases = document.querySelectorAll('.qr-code-container canvas');
        const titles = document.querySelectorAll('.card-title');

        if (canvases.length === 0) {
            showToast('İndirilecek QR kod bulunamadı!', 'error');
            return;
        }

        for (let i = 0; i < canvases.length; i++) {
            const canvas = canvases[i];
            const siteName = titles[i].textContent;
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            zip.file(`${siteName}-qr.png`, blob);
        }

        const zipBlob = await zip.generateAsync({type: 'blob'});
        saveAs(zipBlob, 'tum-qr-kodlari.zip');
        showToast('Tüm QR kodları başarıyla indirildi!', 'success');
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${getToastIcon(type)} me-2"></i>
                ${message}
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }, 100);
    }

    function getToastIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-times-circle';
            case 'warning': return 'fa-exclamation-circle';
            default: return 'fa-info-circle';
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        .toast-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            background: white;
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 1000;
        }

        .toast-notification.show {
            transform: translateX(0);
        }

        .toast-content {
            display: flex;
            align-items: center;
        }

        .toast-success { background: #02c39a; color: white; }
        .toast-error { background: #ff6b6b; color: white; }
        .toast-warning { background: #ffd93d; color: #2d3436; }
        .toast-info { background: #4e54c8; color: white; }
    `;
    document.head.appendChild(style);
});
