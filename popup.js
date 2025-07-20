// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const scanAndDownloadBtn = document.getElementById('scanAndDownloadBtn');
    const statusMessageDiv = document.getElementById('statusMessage');

    // Function to display status messages in the popup
    function showStatus(message, isError = false) {
        statusMessageDiv.textContent = message;
        statusMessageDiv.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
        if (isError) {
            statusMessageDiv.classList.add('bg-red-100', 'text-red-800');
        } else {
            statusMessageDiv.classList.add('bg-blue-100', 'text-blue-800');
        }
    }

    scanAndDownloadBtn.addEventListener('click', async () => {
        showStatus('Scanning page for download links...');
        scanAndDownloadBtn.disabled = true; // Disable button during scan

        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || !tab.id) {
                showStatus('Error: Could not get active tab information.', true);
                scanAndDownloadBtn.disabled = false;
                return;
            }

            // Execute the content script in the active tab
            const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js'] // Inject our content script
            });

            // The content script sends a message back with the found links.
            // We'll listen for that message in background.js or directly here if needed.
            // For simplicity, content.js will send a message to the background script,
            // and background.js will then send a message back to the popup.
            // This setup ensures that if the popup closes, the background script can still handle downloads.

            // Send a message to the background script to start the scan
            chrome.runtime.sendMessage({ action: 'startScan', tabId: tab.id });

        } catch (error) {
            console.error('Error during script injection or message sending:', error);
            showStatus(`Error: ${error.message}`, true);
            scanAndDownloadBtn.disabled = false;
        }
    });

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'scanResults') {
            const downloadUrls = message.urls;
            if (downloadUrls && downloadUrls.length > 0) {
                showStatus(`Found ${downloadUrls.length} potential download(s). Initiating download...`);
                // Initiate downloads
                downloadUrls.forEach(url => {
                    chrome.downloads.download({ url: url })
                        .then(downloadId => {
                            console.log(`Download initiated for: ${url}, ID: ${downloadId}`);
                        })
                        .catch(error => {
                            console.error(`Failed to download ${url}:`, error);
                            showStatus(`Error downloading ${url}: ${error.message}`, true);
                        });
                });
                showStatus(`Initiated downloads for ${downloadUrls.length} files. Check your downloads.`);
            } else {
                showStatus('No download links found on this page.');
            }
            scanAndDownloadBtn.disabled = false; // Re-enable button
        } else if (message.action === 'scanError') {
            showStatus(`Scan Error: ${message.error}`, true);
            scanAndDownloadBtn.disabled = false; // Re-enable button
        }
    });
});
