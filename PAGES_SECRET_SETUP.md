# Setting GEMINI_API_KEY on Cloudflare Pages

## Steps to Add the Secret

1. Go to your Cloudflare Dashboard
2. Click **Pages** in the left sidebar
3. Select your project: **wbctraining** (or your Pages project name)
4. Click **Settings** in the top navigation
5. Click **Environment variables** in the left sidebar (or scroll to "Environment variables & secrets")
6. Under **Production**, click **Add variable**
7. Fill in:
   - **Variable name**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyAS2Oghf02JyoJ3-HDid7Nd54ZMxUA5pWQ`
   - **Encryption**: Check the box to mark as secret (recommended)
8. Click **Save**
9. Trigger a new deployment:
   - Go back to **Deployments**
   - Click the three dots (⋯) on the latest deployment
   - Select **Redeploy** (or just push a commit to your repo to auto-trigger)

## Verify

After deployment, test with:

```powershell
curl -i -X POST https://wbctraining.pages.dev/api/chat `
  -H "Content-Type: application/json" `
  -d '{"message":"Hello"}'
```

Should return HTTP 200 with a `response` field containing the Gemini bot reply.

## If It Still Fails

- Check **Pages → Deployments → latest → Function logs** to see any errors
- Verify the secret name is exactly `GEMINI_API_KEY` (case-sensitive)
- Confirm the API key value is correct and hasn't expired
