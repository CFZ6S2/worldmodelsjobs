const fs = require('fs');
const axios = require('axios');

const htmlFile = "C:\\Users\\cesar\\Downloads\\enlaces_clickables_whatsapp.html";
const token = "aKp5Ef4GXS5YGHrIkO4SrDyvISRbgdA8";
const whapiJoinUrl = "https://gate.whapi.cloud/groups/join";

async function joinGroups() {
    console.log("Reading HTML file...");
    let content = "";
    try {
        content = fs.readFileSync(htmlFile, "utf-8");
    } catch (e) {
        console.error("Failed to read file:", e.message);
        return;
    }

    // Extract group codes from URLs like https://chat.whatsapp.com/CODE
    const regex = /chat\.whatsapp\.com\/([A-Za-z0-9]+)/g;
    const matches = [...content.matchAll(regex)];
    const inviteCodes = [...new Set(matches.map(m => m[1]))]; // Remove duplicates

    console.log(`Found ${inviteCodes.length} unique group invite codes.`);
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < inviteCodes.length; i++) {
        const code = inviteCodes[i];
        console.log(`[${i+1}/${inviteCodes.length}] Attempting to join: ${code}`);
        
        try {
            const response = await axios.post(whapiJoinUrl, {
                invite_code: code
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`  ✅ Successfully joined: ${code}`);
            successCount++;
        } catch (error) {
            let errorMsg = error.message;
            if (error.response && error.response.data) {
                errorMsg = JSON.stringify(error.response.data);
            }
            console.error(`  ❌ Failed to join: ${code}. Reason: ${errorMsg}`);
            failCount++;
        }
        
        // Add a delay between requests to avoid rate limits/bans
        const delayMs = 3000 + Math.random() * 2000; // 3-5 seconds
        await new Promise(r => setTimeout(r, delayMs));
    }
    
    console.log("-----------------------------------------");
    console.log(`Finished joining groups. Success: ${successCount}, Failed: ${failCount}`);
}

joinGroups();
