# How to Fix the Chatbot on Cloudflare Pages

## ✅ Good News!
Your API key is **working correctly** locally. The test script confirmed:
- API key: `AIzaSyCk_xGYQASuQTLLN_esdrN8mtPR-b-OcB4` ✓
- Model: `gemini-flash-lite-latest` ✓
- API is responding properly ✓

## 🔧 The Problem
The chatbot on your deployed site (wbctraining.pages.dev) is failing because:
- The API key is only in your local `.env` file
- Cloudflare Pages Functions need the API key in **Cloudflare's environment variables**

## 📋 Step-by-Step Fix

### Step 1: Log into Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Navigate to **Pages** (in the left sidebar)
3. Click on your project: **wbctraining**

### Step 2: Add Environment Variable
1. Click on **Settings** (top navigation)
2. Scroll down to **Environment Variables**
3. Click **Add variable** or **Edit variables**

### Step 3: Configure the API Key
Add the following variable:

**Variable name:**
```
GEMINI_API_KEY
```

**Value:**
```
AIzaSyCk_xGYQASuQTLLN_esdrN8mtPR-b-OcB4
```

**Environment:** Select both:
- [x] Production
- [x] Preview

### Step 4: (Optional but Recommended) Add Model Variable
Also add this variable to make it easier to change models in the future:

**Variable name:**
```
GEMINI_MODEL
```

**Value:**
```
models/gemini-flash-lite-latest
```

**Environment:** Select both:
- [x] Production  
- [x] Preview

### Step 5: Save and Redeploy
1. Click **Save** to save the environment variables
2. Cloudflare will automatically trigger a new deployment
3. Wait 1-2 minutes for the deployment to complete

### Step 6: Test the Chatbot
1. Go to your site: https://wbctraining.pages.dev
2. Click the chatbot icon
3. Type a message like "What training programs do you offer?"
4. The chatbot should now respond! 🎉

---

## 🔍 Troubleshooting

### If the chatbot still doesn't work:

1. **Check Browser Console for Errors**
   - Press F12 to open Developer Tools
   - Go to the **Console** tab
   - Look for any error messages

2. **Verify Environment Variables Are Set**
   - Go back to Cloudflare Pages → Settings → Environment Variables
   - Make sure both `GEMINI_API_KEY` and `GEMINI_MODEL` are listed

3. **Check Deployment Status**
   - Go to Cloudflare Pages → Deployments
   - Ensure the latest deployment is marked as "Success"

4. **Force a New Deployment**
   - Make a small change to any file (add a space)
   - Commit and push to trigger a new build

---

## 📝 Notes

- Environment variables are encrypted and secure on Cloudflare
- The API key is never exposed in your client-side code
- Only the Cloudflare Function (`/api/gemini-chat`) can access it
- You can change the model anytime by updating `GEMINI_MODEL` environment variable

---

## 🚀 What Happens Next?

Once you've added the environment variables:
1. Cloudflare automatically redeploys your site
2. The `/api/gemini-chat` function can now access `env.GEMINI_API_KEY`
3. The chatbot will connect to Google's Gemini API successfully
4. Users can chat with the AI Concierge 24/7!

---

**Need Help?** If you run into any issues, share:
- Screenshot of the Cloudflare environment variables page
- Any error messages from browser console (F12)
- The deployment log from Cloudflare
