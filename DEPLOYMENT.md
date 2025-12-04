# Deployment Instructions

## Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `freestyle-contracts-api`
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `node server/index.js`
   - **Instance Type:** Free
5. Click "Create Web Service"
6. Copy your Render URL (e.g., `https://freestyle-contracts-api.onrender.com`)

## Deploy Frontend to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: Your Render URL (from step 6 above)
6. Click "Deploy site"
7. Copy your Netlify URL

## Update CORS Settings

After deploying to Netlify:
1. Open `server/index.js`
2. Replace `https://your-netlify-app.netlify.app` with your actual Netlify URL
3. Commit and push - Render will auto-deploy

## Local Development

1. Start backend: `npm run server`
2. Start frontend: `npm run dev`
3. The app will use `http://localhost:3001` automatically
