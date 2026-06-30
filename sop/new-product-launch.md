# SOP: New Product Launch — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering / Marketing

---

## Purpose

Step-by-step guide for adding a new product to the BossFx Academy platform.

---

## Step 1: Define the Product

Decide on:
- Product name
- Product ID (slug format: `lowercase-hyphenated`)
- Price in NGN
- Product type: `course`, `mentorship`, `ea`, or `vip`
- Deliverables list
- Telegram invite link
- Onboarding URL (page to redirect after purchase)
- Category: `education`, `mentorship`, `tool`, or `vip`

---

## Step 2: Add to Product Catalog

Edit `lib/products.js` — add entry to `PRODUCTS` object:

```javascript
'new-product-id': {
    name: 'Product Display Name',
    type: 'course',        // course, mentorship, ea, vip
    amountNGN: 50000,
    brevoTemplateId: 6,    // Next available Brevo template ID
    deliverables: [
        'Deliverable 1',
        'Deliverable 2'
    ],
    telegramInvite: 'https://t.me/qD_fBeaziqE5YzU8',
    onboardingUrl: '/courses.html',
    category: 'education'
}
```

---

## Step 3: Upload Product Files

Upload deliverable files to Supabase Storage:

```bash
node scripts/upload-product-file.js new-product-id ./path/to/file.pdf "File Display Name"
```

This creates entries in the `product_files` table and uploads to the `product-files` Supabase bucket.

---

## Step 4: Create Checkout Button

Add to the product page (e.g., `courses.html`):

```javascript
// In script.js or inline
function buyNewProduct() {
    FlutterwaveCheckout({
        public_key: BFX.config.flutterwave.publicKey,
        tx_ref: 'bfx-new-product-id-' + Date.now(),
        amount: 50000,
        currency: 'NGN',
        customer: { email: customerEmail, name: customerName },
        meta: { product: 'new-product-id' },
        customizations: {
            title: 'BossFx Academy',
            description: 'Product Name',
            logo: BFX.config.flutterwave.logo
        },
        callback: function(data) {
            window.location.href = '/payment-success.html?tx_ref=' + data.tx_ref + '&status=successful';
        },
        onclose: function() {}
    });
}
```

---

## Step 5: Create Email Template

Add a new content function to `lib/email.js`:

```javascript
function newProductEmailContent(product, customer, txRef, downloadToken) {
    return `
        <h2>Welcome to ${product.name}!</h2>
        <!-- Product-specific email content -->
        <a href="https://www.bossfxcademy.com/api/download?token=${downloadToken}">
            Download Your Files
        </a>
    `;
}
```

Update `sendFulfillmentEmail()` to include a case for the new product type.

---

## Step 6: Update Success Page

If the product has unique success page content, add a conditional section to `payment-success.html`:

```html
<div class="sp-show-{product-type}" style="display:none;">
    <!-- Product-specific success content -->
</div>
```

---

## Step 7: Update Analytics

Ensure the product triggers proper ecommerce events:
- `view_item` on product page load
- `begin_checkout` on buy button click
- `purchase` on success page

Check `bfx-analytics.js` enhanced ecommerce module covers the new product.

---

## Step 8: Update Sitemap

If a new product page was created, add to `sitemap.xml`.

---

## Step 9: Update Documentation

- [ ] Update CLAUDE.md product table
- [ ] Update CHANGELOG.md
- [ ] Update AUTOMATION_MAP.md if new automation flows added

---

## Step 10: Test End-to-End

1. `vercel dev` — start local server
2. Navigate to product page
3. Click buy button → Flutterwave checkout modal appears
4. Use test card to complete payment
5. Verify webhook fires and order appears in database
6. Verify fulfillment email arrives with download link
7. Click download link → file downloads successfully
8. Check admin dashboard shows the new order

---

## Step 11: Deploy

```bash
git add lib/products.js lib/email.js script.js payment-success.html sitemap.xml
git commit -m "feat: add {product-name} to product catalog"
git push origin main
```

---

## Step 12: Announce

1. Social media posts with UTM links
2. Email blast to relevant Brevo list
3. Update any active ad campaigns
4. Telegram community announcement

---

## Product Launch Checklist

- [ ] Product defined in `lib/products.js`
- [ ] Files uploaded to Supabase Storage
- [ ] Checkout button on product page
- [ ] Email template created
- [ ] Success page updated
- [ ] Analytics events firing
- [ ] Sitemap updated
- [ ] Documentation updated
- [ ] End-to-end test passed
- [ ] Deployed to production
- [ ] Announcement posted
