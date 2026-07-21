const fs = require('fs');
const { execSync } = require('child_process');

const logPath = 'c:\\Users\\cesar\\Documents\\trae_projects\\worldmodels\\qr_base64.log';
const htmlPath = 'c:\\Users\\cesar\\Documents\\trae_projects\\worldmodels\\qr.html';

try {
    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n');
    const base64Line = lines.find(l => l.startsWith('data:image/png;base64,'));

    if (base64Line) {
        const html = `
        <!DOCTYPE html>
        <html>
        <head><title>QR Code</title></head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; background:#222; color:white; font-family:sans-serif;">
            <div style="text-align:center;">
                <h2>Escanea el QR de Evolution API</h2>
                <img src="${base64Line.trim()}" style="padding:20px; background:white; border-radius:10px;" />
            </div>
        </body>
        </html>
        `;
        fs.writeFileSync(htmlPath, html);
        console.log('Saved to qr.html');
        execSync(`start ${htmlPath}`);
    } else {
        console.log('Base64 not found in log.');
        console.log(logContent);
    }
} catch (e) {
    console.error('Error:', e);
}
