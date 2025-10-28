# DevSync Companion Extension Setup Guide

This guide details how to set up the Chrome extension that acts as a "Focus Mode" companion for the main DevSync frontend application.

## Project Structure

This project is a monorepo containing three main parts:

The `frontend` app (running on `localhost`) sends messages to the `extension` to tell it when to start or stop blocking distracting websites. This setup guide explains how to establish that connection for local development.

## Part 1: Loading the Extension in Your Browser

1.  **Open Your Browser:** This guide assumes you are using Google Chrome, Brave, or another Chromium-based browser.

2.  **Navigate to Extensions:** Open a new tab and go to the following URL:
    `chrome://extensions`

3.  **Enable Developer Mode:** In the top-right corner of the page, find the **Developer mode** toggle and switch it **ON**. This will reveal a new menu with "Load unpacked".

4.  **Load the Extension:**
    * Click the **Load unpacked** button.
    * A file dialog will open. Navigate to your project's root folder and select the **`extension`** folder.
    * Click "Select Folder".

5.  **Verify Installation:** If successful, you will instantly see a new card on the page for "DevSync Enforcer" (or whatever name is in your `manifest.json`).

## Part 2: Connecting the Frontend to the Extension

For security, your `frontend` React app is not allowed to talk to any extension *unless* it knows its unique, randomly-generated ID. You must provide this ID to your React app.

1.  **Find Your Extension ID:**
    * On the `chrome://extensions` page, find the "DevSync Enforcer" card.
    * Look for the **`ID`** field (it's a long string of random letters).
    * **Copy this ID** to your clipboard.

2.  **Set the Environment Variable:**
    * Navigate to your **`/frontend`** folder.
    * Create a new file named `.env` in this folder (if it doesn't already exist).
    * Inside the `.env` file, add the ID you just copied, prefixed with `VITE_`:
    
    ```.env
    VITE_CHROME_EXTENSION_ID="YOUR_COPIED_ID_GOES_HERE"
    ```
    *(Example: `VITE_CHROME_EXTENSION_ID="faanknakkahoapilfgibbekefgbodfkk"`)*

3.  **Restart Your Frontend Server:**
    * This step is **critical**. Vite only loads `.env` variables on startup.
    * If your server is running, **stop it** (Ctrl+C in the terminal).
    * **Restart** your server (e.g., `npm run dev`).

Your `frontend` app can now securely send messages to your local `extension`.

## Part 3: Testing and Debugging

Your setup is now complete. To test it:

1.  Open your `frontend` app (e.g., `http://localhost:5173/pomodoro`).
2.  Open a few other tabs (like `google.com` or any site not on your allow-list).
3.  In your `frontend` app, open the Developer Console (F12 or Ctrl+Shift+I).
4.  Start the **Work** timer.

You should see two things happen:
1.  The other tabs (like `google.com`) should automatically close.
2.  In your Developer Console, you should see a log like `Extension acknowledged start. {status: "Focus started"}`.
