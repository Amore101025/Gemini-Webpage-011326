# FDA 510(k) Smart Analyzer - Netlify Deployment Guide

This guide will help you deploy this application to Netlify for free. This application is built using standard web technologies (HTML, CSS, React) and ES Modules, so it does not require a complex build process.

## Option 1: The "Drag & Drop" Method (Easiest)

This is the fastest way to get your app online.

1.  **Prepare your files**: Ensure you have the following files in a single folder on your computer:
    *   `index.html`
    *   `index.tsx`
    *   `_redirects`
2.  **Log in to Netlify**: Go to [app.netlify.com](https://app.netlify.com) and log in (or sign up).
3.  **Go to "Sites"**: Click on the "Sites" tab in the left sidebar.
4.  **Drag and Drop**: You will see a box that says "Want to deploy a new site without connecting to Git? Drag and drop your site output folder here."
5.  **Upload**: Drag the folder containing your files into that box.
6.  **Done!**: Netlify will upload your files and give you a live URL (e.g., `https://random-name-12345.netlify.app`).

## Option 2: Deploy from GitHub (Recommended)

This method allows you to update your site automatically whenever you push code changes.

1.  **Push code to GitHub**: Create a new repository on GitHub and push your files (`index.html`, `index.tsx`, `_redirects`) to it.
2.  **New Site on Netlify**:
    *   Log in to Netlify.
    *   Click **"Add new site"** > **"Import an existing project"**.
3.  **Connect to GitHub**: Select GitHub and choose your repository.
4.  **Configure Build Settings**:
    *   **Base directory**: Leave empty (or `.`)
    *   **Build command**: Leave empty (This is important! We are using raw ES modules, so no build step is needed).
    *   **Publish directory**: Leave empty or set to `.` (It represents the root folder).
5.  **Deploy**: Click **"Deploy Site"**.

## Important Notes

### API Key Handling
This application runs entirely in the browser (Client-Side). 
*   **Do NOT** set the `API_KEY` in Netlify's "Environment Variables" settings if you expect it to be hidden. Since there is no backend server, any key used in the code is visible to the user's browser.
*   **Best Practice**: The current app is designed to ask the user for *their* own API Key via the "Settings" menu in the UI. This is the most secure way to host this specific app publicly without leaking your personal quota.

### "Page Not Found" Errors
If you refresh the page and get a 404 error, ensure the `_redirects` file is present in your uploaded folder. It tells Netlify to always serve `index.html` regardless of the URL path.
