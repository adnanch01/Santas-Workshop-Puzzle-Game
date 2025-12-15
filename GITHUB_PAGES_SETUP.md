# GitHub Pages Setup Instructions

## ⚠️ Important: Enable GitHub Pages First!

Before the deployment workflow can run successfully, you **must** enable GitHub Pages in your repository settings.

## Step-by-Step Instructions

1. **Go to your repository on GitHub:**
   - Navigate to: https://github.com/adnanch01/Santas-Workshop-Puzzle-Game

2. **Open Settings:**
   - Click on the **"Settings"** tab (at the top of the repository)

3. **Navigate to Pages:**
   - In the left sidebar, click **"Pages"**

4. **Configure the Source:**
   - Under **"Source"**, you'll see a dropdown
   - Select **"GitHub Actions"** (NOT "Deploy from a branch")
   - Click **"Save"**

5. **Wait for the workflow to run:**
   - After saving, go to the **"Actions"** tab
   - You should see the "Deploy to GitHub Pages" workflow running
   - Wait for it to complete (usually 2-3 minutes)

6. **Access your site:**
   - Once the workflow completes successfully, your site will be available at:
   - **https://adnanch01.github.io/Santas-Workshop-Puzzle-Game/**

## Troubleshooting

### Error: "Get Pages site failed"
- **Solution:** Make sure you've enabled GitHub Pages in Settings > Pages and selected "GitHub Actions" as the source

### Workflow runs but site doesn't load
- Check the Actions tab to see if there are any build errors
- Verify that the build step completed successfully
- Make sure the base path in `vite.config.js` matches your repository name

### Site loads but shows 404
- Verify the base path in `vite.config.js` is set to `/Santas-Workshop-Puzzle-Game/`
- Clear your browser cache and try again

## Notes

- The workflow will automatically deploy on every push to the `main` branch
- You can also manually trigger it from the Actions tab using "workflow_dispatch"
- The build process takes about 2-3 minutes

