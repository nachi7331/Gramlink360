const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

console.log('=== TEST SUITE 2: TRANSLATIONS & BILINGUAL MARATHI / ENGLISH VERIFICATION ===\n');

// 1. Load js/translations.js into an isolated VM sandbox
const translationsCode = fs.readFileSync(path.join(rootDir, 'js', 'translations.js'), 'utf8');

const sandbox = {
  localStorage: {
    getItem: () => 'en',
    setItem: () => {}
  },
  document: {
    addEventListener: () => {},
    querySelectorAll: () => []
  },
  window: {}
};

vm.createContext(sandbox);
const translations = vm.runInContext(translationsCode + '\n; translations;', sandbox);
if (!translations || !translations.en || !translations.mr) {
  console.error('❌ Failed: translations.en or translations.mr object not found in js/translations.js');
  process.exit(1);
}

const enKeys = Object.keys(translations.en);
const mrKeys = Object.keys(translations.mr);

console.log(`English Dictionary Keys: ${enKeys.length}`);
console.log(`Marathi Dictionary Keys: ${mrKeys.length}`);

let dictErrors = [];

// Check for missing keys between English and Marathi
enKeys.forEach(k => {
  if (!translations.mr[k]) {
    dictErrors.push(`Missing Marathi translation for key: "${k}"`);
  } else if (typeof translations.mr[k] !== 'string' || translations.mr[k].trim() === '') {
    dictErrors.push(`Empty Marathi translation for key: "${k}"`);
  }
});

mrKeys.forEach(k => {
  if (!translations.en[k]) {
    dictErrors.push(`Missing English translation for key: "${k}"`);
  } else if (typeof translations.en[k] !== 'string' || translations.en[k].trim() === '') {
    dictErrors.push(`Empty English translation for key: "${k}"`);
  }
});

// 2. Scan all HTML files for data-i18n and data-i18n-placeholder
const htmlFiles = [
  'index.html',
  'pages/admin-dashboard.html',
  'pages/announcements.html',
  'pages/auth.html',
  'pages/complaint-submit.html',
  'pages/complaint-track.html',
  'pages/resident-dashboard.html',
  'pages/services.html',
  'pages/village-dashboard.html'
];

let htmlKeysChecked = 0;
let missingHtmlKeys = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  
  // match data-i18n="..."
  const i18nRegex = /data-i18n=["']([^"']+)["']/g;
  let match;
  while ((match = i18nRegex.exec(content)) !== null) {
    const key = match[1];
    htmlKeysChecked++;
    if (!translations.en[key]) {
      missingHtmlKeys.push(`[${file}] data-i18n="${key}" is missing in translations.en`);
    }
    if (!translations.mr[key]) {
      missingHtmlKeys.push(`[${file}] data-i18n="${key}" is missing in translations.mr`);
    }
  }

  // match data-i18n-placeholder="..."
  const placeholderRegex = /data-i18n-placeholder=["']([^"']+)["']/g;
  while ((match = placeholderRegex.exec(content)) !== null) {
    const key = match[1];
    htmlKeysChecked++;
    if (!translations.en[key]) {
      missingHtmlKeys.push(`[${file}] data-i18n-placeholder="${key}" is missing in translations.en`);
    }
    if (!translations.mr[key]) {
      missingHtmlKeys.push(`[${file}] data-i18n-placeholder="${key}" is missing in translations.mr`);
    }
  }
});

console.log(`Verified ${htmlKeysChecked} data-i18n attributes across all HTML files.`);

if (dictErrors.length > 0) {
  console.error('\n❌ Dictionary Symmetry Errors:');
  dictErrors.forEach(e => console.error('  - ' + e));
}

if (missingHtmlKeys.length > 0) {
  console.error('\n❌ Missing HTML i18n Keys:');
  missingHtmlKeys.forEach(e => console.error('  - ' + e));
}

if (dictErrors.length === 0 && missingHtmlKeys.length === 0) {
  console.log('✅ ALL translation keys are 100% complete and symmetrical between English and Marathi!\n');
  process.exit(0);
} else {
  process.exit(1);
}
