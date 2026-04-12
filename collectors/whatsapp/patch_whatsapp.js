const fs = require('fs');
let code = fs.readFileSync('whatsapp_collector.js', 'utf8');
if (!code.includes('qrcode-terminal')) {
    code = "const qrcode = require('qrcode-terminal');\n" + code;
    code = code.replace("console.log('RAW_QR_DATA:' + qr);", "qrcode.generate(qr, {small: true});\n            console.log('RAW_QR_DATA:' + qr);");
    fs.writeFileSync('whatsapp_collector.js', code);
    console.log("Patched successfully.");
} else {
    console.log("Already patched.");
}
