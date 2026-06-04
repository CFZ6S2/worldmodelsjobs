const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'scratch', 'patched_wf_final.json');
const wf = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

for (const node of wf.nodes) {
  if (node.name.startsWith('Dynamic Routing Engine') && node.parameters?.jsCode) {
    let code = node.parameters.jsCode;
    
    // Replace the isHighBudget function to include negotiable
    const newTargetFilterCode = `
// DUBAI BUDGET FILTER (>= 3000 OR Negotiable)
function isHighBudgetOrNegotiable(budgetStr, fullText) {
  const combined = String(budgetStr + " " + fullText).toLowerCase();
  
  // 1. Check if explicitly negotiable
  if (combined.includes('negociable') || combined.includes('negotiable') || combined.includes('a convenir') || combined.includes('to be discussed')) {
    return true;
  }
  
  // 2. Check for numeric budget >= 3000
  let s = combined.replace(/[,.]00\\b/g, '');
  s = s.replace(/(?<=\\d)[.,](?=\\d{3}\\b)/g, '');
  
  const matches = s.match(/\\b\\d{1,3}k\\b|\\b\\d{4,6}\\b/g) || [];
  let max = 0;
  for (let m of matches) {
     let val = m.includes('k') ? parseFloat(m) * 1000 : parseFloat(m);
     if (val >= 3000 && val < 200000) {
       if (val > max) max = val;
     }
  }
  return max >= 3000;
}

const dubaiTarget = "905344119396@s.whatsapp.net";
if (uniqueTargets.some(t => t.to === dubaiTarget)) {
  if (!isHighBudgetOrNegotiable(leadData.budget, text)) {
    // If budget is < 3000 and NOT negotiable, remove Dubai from targets
    uniqueTargets = uniqueTargets.filter(t => t.to !== dubaiTarget);
  }
}
`;

    // Remove the old filter code completely
    code = code.replace(/\/\/ DUBAI BUDGET FILTER[^]*?(?=return uniqueTargets\.map)/, '');
    
    // Insert the new filter code
    code = code.replace(
      /return uniqueTargets\.map/,
      `${newTargetFilterCode}\nreturn uniqueTargets.map`
    );
    
    node.parameters.jsCode = code;
    console.log('Patched Dynamic Routing Engine for Dubai budget > 3000 OR Negotiable');
  }
}

fs.writeFileSync(inputFile, JSON.stringify(wf, null, 2), 'utf-8');
