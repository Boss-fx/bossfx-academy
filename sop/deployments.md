# SOP: Deployments — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering

---

## Purpose

Step-by-step deployment and rollback procedures.

---

## Standard Deployment

### Pre-Deploy

1. Check for uncommitted changes:
   ```bash
   git status
   ```

2. Check function count (must be ≤ 12):
   ```bash
   find api -name '*.js' | wc -l
   ```

3. Validate environment:
   ```bash
   node -e "require('./lib/validate-env').logEnvStatus()"
   ```

4. If payment-related changes: test checkout flow locally with `vercel dev`

### Deploy

```bash
git add <specific-files>
git commit -m "type: description"
git push origin main
```

Commit message types: `feat:`, `fix:`, `docs:`, `refactor:`, `content:`, `blog:`, `release:`

### Post-Deploy

1. Check Vercel dashboard for successful deployment
2. Visit `https://www.bossfxcademy.com/api/health` — should return `status: healthy`
3. If payment changes: test a checkout flow on production
4. If email changes: verify email sending via admin dashboard resend
5. Check Vercel function logs for any errors

---

## Emergency Rollback

### Via Vercel Dashboard (fastest)

1. Go to Vercel Dashboard → Project → Deployments
2. Find the last working deployment (green checkmark)
3. Click three-dot menu → "Promote to Production"
4. Production reverts immediately (< 30 seconds)

### Via Git

```bash
git log --oneline -10                    # Find last good commit
git revert HEAD                          # Revert most recent commit
git push origin main                     # Deploy the revert
```

For multiple bad commits:
```bash
git revert HEAD~3..HEAD --no-commit      # Revert last 3 commits
git commit -m "revert: roll back to {commit-hash}"
git push origin main
```

---

## Environment Variable Changes

### Adding a New Variable

```bash
# Add to Vercel (all environments)
vercel env add VARIABLE_NAME

# Also add to .env.local for local dev
echo "VARIABLE_NAME=value" >> .env.local
```

### Updating a Variable

```bash
# Remove old value
vercel env rm VARIABLE_NAME production

# Add new value
vercel env add VARIABLE_NAME
```

Note: Environment variable changes require a new deployment to take effect:
```bash
vercel --prod    # Force redeploy without code changes
```

---

## Deployment Checklist

- [ ] `git status` shows only intended changes
- [ ] Function count ≤ 12
- [ ] No hardcoded secrets in committed files
- [ ] Documentation updated if features changed
- [ ] CHANGELOG.md updated for feature releases
- [ ] Local testing passed
- [ ] Commit message follows convention
- [ ] Post-deploy health check passes
