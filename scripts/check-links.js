#!/usr/bin/env node
/**
 * Internal link checker for the BossFx Academy static site.
 * Fails (exit 1) if any relative href/src points at a file that does not exist.
 * External links, anchors, mailto/tel, and template files are skipped.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXCLUDE_DIRS = ['node_modules', '.vercel', 'docs']; // docs/ holds Go-template email files
const files = execSync('find . -name "*.html"', { encoding: 'utf8' })
  .trim().split('\n')
  .filter(f => f && !EXCLUDE_DIRS.some(d => f.startsWith(`./${d}/`)))
  .filter(f => !/template/i.test(path.basename(f))); // skip *_template.html scaffolds

let checked = 0;
const broken = [];
for (const f of files) {
  const dir = path.dirname(f);
  const html = fs.readFileSync(f, 'utf8');
  const links = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(m => m[1]);
  for (let l of links) {
    if (/^(https?:|mailto:|tel:|sms:|#|data:|javascript:|\/\/)/.test(l)) continue;
    l = l.split('#')[0].split('?')[0];
    if (!l) continue;
    const target = l.startsWith('/') ? path.join('.', l) : path.join(dir, l);
    checked++;
    const ok = fs.existsSync(target) ||
      (fs.existsSync(target) && fs.statSync(target).isDirectory()) ||
      fs.existsSync(path.join(target, 'index.html'));
    if (!ok) broken.push(`${f}  ->  ${l}`);
  }
}

console.log(`Pages scanned: ${files.length} | internal links checked: ${checked} | broken: ${broken.length}`);
if (broken.length) {
  console.error('\nBroken internal links:\n' + broken.map(b => '  ' + b).join('\n'));
  process.exit(1);
}
console.log('All internal links resolve.');
