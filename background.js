// background.js
// This is the service worker for the extension. It runs in the background.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startScan') {
        // The popup initiated a scan. The content script is already injected.
        // We are now waiting for the content script to send its results.
        console.log('Background: Received startScan message from popup.');
    } else if (message.action === 'contentScriptResults') {
        // Content script sent back the found URLs.
        const downloadUrls = message.urls;
        console.log('Background: Received content script results:', downloadUrls);

        // Send these URLs back to the popup to display and initiate downloads
        // We use chrome.tabs.sendMessage to send to a specific tab (the popup's tab)
        // or chrome.runtime.sendMessage if the popup is listening globally.
        // Since popup.js is listening with chrome.runtime.onMessage.addListener,
        // we can send it back via runtime.
        chrome.runtime.sendMessage({ action: 'scanResults', urls: downloadUrls });

    } else if (message.action === 'contentScriptError') {
        // Content script reported an error.
        console.error('Background: Content script error:', message.error);
        chrome.runtime.sendMessage({ action: 'scanError', error: message.error });
    }
});