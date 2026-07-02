# Supabase Auth Email Templates — Setup Guide

> **Last Updated:** 2026-07-02

This directory contains 6 branded HTML email templates for Supabase Authentication. All templates match the BossFx Academy design system (dark theme, amber/emerald accents, responsive).

---

## Templates

| File | Supabase Template Name | Subject Line |
|---|---|---|
| `confirm-email.html` | Confirm signup | `Verify Your Email — BossFx Academy` |
| `reset-password.html` | Reset password | `Reset Your Password — BossFx Academy` |
| `magic-link.html` | Magic link | `Sign In to BossFx Academy` |
| `invite-user.html` | Invite user | `You've Been Invited — BossFx Academy` |
| `change-email.html` | Change email address | `Confirm Email Change — BossFx Academy` |
| `reauthentication.html` | Reauthentication | `Verify Your Identity — BossFx Academy` |

---

## Step 1: Configure Custom SMTP

1. Go to **Supabase Dashboard** → your project
2. Navigate to **Project Settings** → **Auth** → **SMTP Settings**
3. Toggle **Enable Custom SMTP** ON
4. Enter these values:

| Field | Value |
|---|---|
| Sender email | `hello@bossfxcademy.com` |
| Sender name | `BossFx Academy` |
| Host | `smtp-relay.brevo.com` |
| Port number | `587` |
| Minimum interval | `30` |
| Username | Your Brevo account login email |
| Password | Your Brevo SMTP key (Dashboard → SMTP & API → SMTP tab) |

5. Click **Save**

> **Note:** The SMTP key is NOT the same as the Brevo API key. Get it from Brevo Dashboard → SMTP & API → SMTP tab → Generate a new SMTP key.

---

## Step 2: Apply Email Templates

1. Go to **Supabase Dashboard** → your project
2. Navigate to **Auth** → **Email Templates**
3. For each template type:
   a. Select the template tab (e.g., "Confirm signup")
   b. Set the **Subject** line from the table above
   c. Copy the HTML content from the corresponding `.html` file in this directory
   d. Paste it into the **Body** field (HTML mode)
   e. Click **Save**

### Template Variables

All templates use `{{ .ConfirmationURL }}` which Supabase auto-replaces with the action link. No other variables need to be configured.

---

## Step 3: Configure Redirect URLs

In **Supabase Dashboard** → **Auth** → **URL Configuration**:

| Setting | Value |
|---|---|
| Site URL | `https://www.bossfxcademy.com` |
| Redirect URLs | `https://www.bossfxcademy.com/founder/` |
| | `https://www.bossfxcademy.com/admin/` |

---

## Step 4: Test

After configuration, test each email type:

1. **Confirm email:** Create a new user in Supabase Auth dashboard
2. **Reset password:** Use `supabase.auth.resetPasswordForEmail(email)` in browser console
3. **Magic link:** Use `supabase.auth.signInWithOtp({ email })` in browser console
4. **Invite user:** Use Supabase Dashboard → Auth → Invite user

Verify:
- [ ] Email arrives in inbox (not spam)
- [ ] Sender shows as "BossFx Academy"
- [ ] BossFx branding renders correctly
- [ ] Action button/link works
- [ ] Redirect goes to correct URL
- [ ] Mobile rendering is correct

---

## DNS Requirements

Before testing, ensure these DNS records are configured at your domain registrar:

### SPF (UPDATE existing TXT record for @)
```
v=spf1 include:spf.cloudeu.xion.oxcs.net include:sendinblue.com ~all
```

### DKIM (ADD after Brevo domain verification)
Follow Brevo Dashboard → Senders & IPs → Domains → Add `bossfxcademy.com` → Copy the provided DKIM records to your DNS.

### DMARC (ALREADY EXISTS — no change needed)
```
v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com
```
