#!/usr/bin/env node
// ================================================================
// Generate a download link for a customer
// Usage: node scripts/generate-download-link.js <email> <product-id> [hours]
// Example: node scripts/generate-download-link.js john@example.com forex-101 72
// ================================================================

require('dotenv').config({ path: '.env.local' });

const { generateAccessToken } = require('../lib/files');
const { getProduct } = require('../lib/products');

const [,, email, productId, hoursStr] = process.argv;

if (!email || !productId) {
    console.log('Usage: node scripts/generate-download-link.js <email> <product-id> [hours]');
    console.log('Products: forex-101, ea-bundle, mentorship-group, mentorship-1on1, vip');
    console.log('Default expiry: 72 hours (VIP: 720 hours)');
    process.exit(1);
}

const product = getProduct(productId);
if (!product) {
    console.error(`Unknown product: ${productId}`);
    console.error('Valid: forex-101, ea-bundle, mentorship-group, mentorship-1on1, vip');
    process.exit(1);
}

const hours = parseInt(hoursStr) || (product.type === 'vip' ? 720 : 72);
const token = generateAccessToken(email.toLowerCase(), productId, product.type, null);
const baseUrl = process.env.VERCEL_URL || 'https://www.bossfxcademy.com';

console.log(`\nGenerated download link for: ${email}`);
console.log(`Product: ${product.name} (${productId})`);
console.log(`Expires: ${hours} hours from now`);
console.log(`\nDownload URL:`);
console.log(`${baseUrl}/api/download?token=${encodeURIComponent(token)}`);

if (product.type === 'vip') {
    console.log(`\nVIP Portal URL:`);
    console.log(`${baseUrl}/vip/welcome.html?token=${encodeURIComponent(token)}`);
}

console.log(`\nRaw token: ${token.substring(0, 30)}...`);
