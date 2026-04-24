const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'worldmodels-api', 'src', 'app', 'api', 'leads', 'route.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Find the BANNED_NUMBERS array
const arrayMatch = content.match(/const BANNED_NUMBERS = \[([\s\S]*?)\];/);
if (arrayMatch) {
  const arrayContent = arrayMatch[1];
  const numbers = arrayContent.match(/"\d+"/g);
  if (numbers) {
    console.log(`Hardcoded API Blacklist (BANNED_NUMBERS): ${numbers.length} números`);
  } else {
    console.log("No se encontraron números en el array BANNED_NUMBERS.");
  }
} else {
  console.log("No se encontró el array BANNED_NUMBERS en el archivo.");
}
