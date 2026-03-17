#!/usr/bin/env node
/**
 * generate-icon.js — creates a placeholder icon in resources/
 * Run once: node generate-icon.js
 * Replace resources/icon-master.png with your real icon before shipping.
 */

const fs   = require('fs')
const path = require('path')

const RESOURCES = path.join(__dirname, 'resources')
fs.mkdirSync(RESOURCES, { recursive: true })

// Write an SVG placeholder (512×512) — the Java "coffee cup" motif
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="#08090d"/>
  <!-- Cup body -->
  <rect x="140" y="180" width="200" height="220" rx="20" fill="none" stroke="#4ade80" stroke-width="18"/>
  <!-- Cup handle -->
  <path d="M340 230 Q420 230 420 290 Q420 350 340 350" fill="none" stroke="#4ade80" stroke-width="18" stroke-linecap="round"/>
  <!-- Steam lines -->
  <path d="M190 150 Q205 120 190 90" fill="none" stroke="#4ade80" stroke-width="12" stroke-linecap="round" opacity="0.6"/>
  <path d="M240 140 Q255 110 240 80" fill="none" stroke="#4ade80" stroke-width="12" stroke-linecap="round" opacity="0.6"/>
  <path d="M290 150 Q305 120 290 90" fill="none" stroke="#4ade80" stroke-width="12" stroke-linecap="round" opacity="0.6"/>
  <!-- Bottom plate -->
  <rect x="120" y="400" width="240" height="18" rx="9" fill="#4ade80" opacity="0.4"/>
</svg>`

fs.writeFileSync(path.join(RESOURCES, 'icon.svg'), svg)
console.log('✓ Wrote resources/icon.svg')
console.log('')
console.log('Next steps:')
console.log('  1. Replace resources/icon.svg with your real design (or use a PNG)')
console.log('  2. Run: npx electron-icon-builder --input=resources/icon.svg --output=resources/ --flatten')
console.log('     OR convert manually to icon.ico (Windows), icon.png (Linux), icon.icns (macOS)')
console.log('  3. npm run dev  — icons will load automatically')
