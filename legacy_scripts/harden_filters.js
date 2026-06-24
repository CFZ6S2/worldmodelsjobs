const fs = require('fs');
const path = 'worldmodels_n8n_v4_final.json';
const workflow = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Harden Quality Score
const qualityNode = workflow.nodes.find(n => n.name === 'Quality Score');
qualityNode.parameters.jsCode = `const item = $json;
if (item.category === 'trash' || item.trash === true || item.looksValuableFinal === false) return [];
let score = 0;
score += (item.positiveHits || 0) * 10;
score += (item.postPositiveHits || 0) * 15;
if (item.contact) score += 30;
if (item.category === 'plaza') score += 20;
if (item.city && item.city !== 'Global') score += 15;
if ((item.text_es || '').length > 300) score += 10;
return { ...item, final_score: score };`;

// 2. Harden IA Prompt
const iaNode = workflow.nodes.find(n => n.name === 'IA Extract1');
iaNode.parameters.text = iaNode.parameters.text.replace('3. TRASH (Discard):', `3. TRASH (Discard):
   - CONVERSATIONS: Casual chat, greetings, questions without specific offer, or internal staff messages.
   - MESSAGES TO STAFF: Any message directed at 'Michell', 'Admin', or asking to 'post'/'fix' something.`);

fs.writeFileSync(path, JSON.stringify(workflow, null, 2));
