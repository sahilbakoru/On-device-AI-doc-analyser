![image](https://github.com/user-attachments/assets/af2805ba-2c08-4d55-8083-c1998baab869)


## Overview

This extension analyzes CSV files offline, generating reports with summaries, insights, and graphs. It keeps your data secure by processing everything on your device, with options to translate the report and download it or the graphs.  using the Prompt API and TranslateAPI with Chrome's built-in Gemini Nano model.

# Testing Instructions for "Private Document Analysis with Built-In AI" Extension

## 1. Clone the Repository
- Clone the project repository to your local machine.

## 2. Install Dependencies
- Navigate to the project directory in your terminal.
- Run the following command to install the required dependencies:  
  ```
  npm install
  ```

## 3. Build the Extension
- Once the dependencies are installed, run the following command to build the extension:  
  ```
  npm run build
  ```

## 4. Load the Extension in Chrome
- Open Chrome and go to the Extensions page (`chrome://extensions/`).
- Enable **Developer Mode** in the top right corner.
- Click on **Load unpacked** and select the `dist` directory that was generated after building the extension.
- Alternatively, you can directly load the root project folder (where the `manifest.json` file is located) as an unpacked extension.

## 5. Test the Extension
- Click on the extension icon in the Chrome toolbar.
- Upload a sample CSV file containing financial or personal data for analysis.
- The extension will analyze the document and generate a report with insights, summaries, and graphs, all processed offline.
