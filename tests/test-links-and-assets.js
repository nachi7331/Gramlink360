const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

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

let totalChecked = 0;
let errors = [];
let warnings = [];

console.log('=== TEST SUITE 1: HTML ASSETS, LINKS & ANCHOR INTEGRITY ===\n');

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    errors.push(`File missing: ${file}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);

  // 1. Check all href links
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    const rawHref = match[1];
    
    // Skip external protocols or empty anchors
    if (/^(https?:\/\/|tel:|mailto:|javascript:|#$)/i.test(rawHref)) {
      continue;
    }

    totalChecked++;

    if (rawHref.startsWith('#')) {
      // In-page anchor link (e.g. #main-content)
      const targetId = rawHref.substring(1);
      const idRegex = new RegExp(`id=["']${targetId}["']`, 'i');
      if (!idRegex.test(content)) {
        errors.push(`[${file}] In-page anchor href="${rawHref}" has no matching element id="${targetId}"`);
      }
    } else {
      // Relative file path (possibly with query parameters or hash anchor)
      const cleanPath = rawHref.split('#')[0].split('?')[0];
      const hash = rawHref.includes('#') ? rawHref.split('#')[1].split('?')[0] : null;
      const resolvedPath = path.resolve(dir, cleanPath);
      if (!fs.existsSync(resolvedPath)) {
        errors.push(`[${file}] Broken href="${rawHref}" -> File does not exist: ${resolvedPath}`);
      } else if (hash) {
        // If it links to a file with an anchor, check target file
        const targetContent = fs.readFileSync(resolvedPath, 'utf8');
        const idRegex = new RegExp(`id=["']${hash}["']`, 'i');
        if (!idRegex.test(targetContent)) {
          warnings.push(`[${file}] Linked anchor href="${rawHref}" -> id="${hash}" not found in target file`);
        }
      }
    }
  }

  // 2. Check all src assets (scripts, images)
  const srcRegex = /src=["']([^"']+)["']/g;
  while ((match = srcRegex.exec(content)) !== null) {
    const rawSrc = match[1];
    if (/^(https?:\/\/|data:)/i.test(rawSrc)) {
      continue;
    }

    totalChecked++;
    const resolvedPath = path.resolve(dir, rawSrc);
    if (!fs.existsSync(resolvedPath)) {
      errors.push(`[${file}] Broken src="${rawSrc}" -> File does not exist: ${resolvedPath}`);
    }
  }

  // 3. Check for doctype and viewport
  if (!/<!DOCTYPE html>/i.test(content)) {
    warnings.push(`[${file}] Missing <!DOCTYPE html> declaration.`);
  }
  if (!/<meta[^>]+viewport[^>]*>/i.test(content)) {
    errors.push(`[${file}] Missing viewport meta tag!`);
  }
});

console.log(`Verified ${totalChecked} local links, script tags, stylesheet references, and anchors across ${htmlFiles.length} HTML files.`);

if (warnings.length > 0) {
  console.log('\n⚠️ Warnings:');
  warnings.forEach(w => console.log('  - ' + w));
}

if (errors.length === 0) {
  console.log('✅ ALL local links, assets, script imports, and anchor tags are 100% VALID!\n');
  process.exit(0);
} else {
  console.error('\n❌ Broken link/asset errors found:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
