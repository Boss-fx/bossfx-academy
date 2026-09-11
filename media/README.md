# Site media

## Intro video (self-hosted)

Drop the founder intro video here as:

    media/bossfx-intro.mp4

- Format: **MP4 (H.264 / AAC)**, portrait **9:16** (it's a Short).
- Keep it small for fast load: aim for **≤ 15 MB** (720×1280 is plenty for a
  60-second talking-head). Re-encode if the original is larger.
- Once the file is at this exact path and deployed, it plays automatically in:
  - Homepage → "Meet BossFx" section (`index.html`)
  - Student dashboard → "New here? Watch this first" (`learn/index.html`)

No code change needed after adding the file — the click-to-play player reads
`/media/bossfx-intro.mp4`. Until the file exists, the player shows a graceful
"Intro video coming soon" message instead of an error.

> Why self-hosted and not YouTube: the YouTube upload (nPtQpG0LYbo) returns
> "Video unavailable" / embed Error 153, so it can't be embedded. Self-hosting
> removes the YouTube dependency (no ads, no "unavailable", instant load).
