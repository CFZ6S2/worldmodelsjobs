const fs = require('fs');
const wfPath = './scratch/final_v5_patched_fixed2.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// Find Dynamic Routing Engine
let dynRouter = wf.nodes.find(n => n.name === 'Dynamic Routing Engine');
let dynCode = dynRouter.parameters.jsCode;

// Regex replacements to remove the cities
dynCode = dynCode.replace(
  /  "ibiza": \{\s+keywords: \["ibiza", "eivissa", "mansour", "pacha", "lio", "ushuaia", "sant antoni"\],\s+targets: \[\]\s+\},\s+/,
  ""
);

dynCode = dynCode.replace(
  /  "london": \{\s+keywords: \["london", "londres", "mayfair", "soho", "chelsea"\],\s+targets: \[\s+\{ to: "120363425790792660@g\.us", label: "LONDON" \}\s+\]\s+\},\s+/,
  ""
);

dynCode = dynCode.replace(
  /  "miami": \{\s+keywords: \["miami", "south beach", "brickell", "miami beach"\],\s+targets: \[\s+\{ to: "17862812324@s\.whatsapp\.net", label: "MIAMI" \},\s+\{ to: "525532110621@s\.whatsapp\.net", label: "MIAMI" \}\s+\]\s+\},\s+/,
  ""
);

dynCode = dynCode.replace(
  /  "paris": \{\s+keywords: \["paris", "francia", "france", "champs"\],\s+targets: \[\s+\{ to: "33744156314@s\.whatsapp\.net", label: "PARIS" \}\s+\]\s+\},\s+/,
  ""
);

dynRouter.parameters.jsCode = dynCode;

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log("JSON successfully updated to remove Miami, Paris, London, and Ibiza.");
