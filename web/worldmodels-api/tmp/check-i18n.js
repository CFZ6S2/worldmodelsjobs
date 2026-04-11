const fs = require('fs');
const path = require('path');

const locales = ['es', 'en', 'pt', 'ru'];
const messagesPath = path.join(process.cwd(), 'messages');

const loadLocale = (locale) => {
  const content = fs.readFileSync(path.join(messagesPath, `${locale}.json`), 'utf8');
  return JSON.parse(content);
};

const getAllKeys = (obj, prefix = '') => {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getAllKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
};

const localesData = {};
locales.forEach(l => {
  localesData[l] = getAllKeys(loadLocale(l));
});

const allKeys = Array.from(new Set(Object.values(localesData).flat())).sort();

console.log('--- I18N PARITY REPORT ---');
console.log(`Total keys found: ${allKeys.length}`);

const report = {};
locales.forEach(l => {
  const missing = allKeys.filter(k => !localesData[l].includes(k));
  report[l] = missing;
});

let issues = 0;
locales.forEach(l => {
  if (report[l].length > 0) {
    console.log(`\n[${l.toUpperCase()}] Missing ${report[l].length} keys:`);
    report[l].forEach(k => console.log(` - ${k}`));
    issues += report[l].length;
  } else {
    console.log(`\n[${l.toUpperCase()}] OK - Parity achieved.`);
  }
});

if (issues === 0) {
  console.log('\n✅ ALL LANGUAGES ARE IN SYNC.');
} else {
  console.log(`\n❌ FOUND ${issues} MISSING KEYS TOTAL.`);
}
