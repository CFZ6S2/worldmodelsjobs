const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed5.json', 'utf8'));

// 1. PATCH PRE-FILTER UNIFIED 1
let preFilter = wf.nodes.find(n => n.name === 'Pre-Filter Unified1');
const preFilterCode = `const results = [];
const HARD_BLOCK = new Set(["crypto", "binance", "casino", "usdt", "bitcoin", "wallet", "trading", "ganar dinero", "инди", "контент", "onlyfans", "вирт", "sugar baby", "sugar daddy", "anal", "masaje erotico", "ingles", "english"]);
const BANNED_PREFIXES = ["58", "57", "92", "91", "62", "244"];

function norm(v) { return String(v || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""); }

for (const item of $input.all()) {
  const data = item.json;
  const text = norm(data.texto_limpio);
  const sender = String(data.final_contact).replace(/\\D/g, "");

  let rejectReason = null;
  if (BANNED_PREFIXES.some(p => sender.startsWith(p))) rejectReason = "prefix_banned";
  else if (HARD_BLOCK.has(text)) rejectReason = "hard_block_match";

  results.push({ json: { ...data, looksValuable: !rejectReason, reject_reason: rejectReason } });
}
return results;`;

preFilter.parameters.jsCode = preFilterCode;

fs.writeFileSync('scratch/final_v5_patched_fixed6.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed6.json written!");
