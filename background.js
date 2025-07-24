let links = []; // Store links globally

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === 'getLinks') {
    console.log('Sending links to popup:', links);
    sendResponse({ links });
  }
});

// Function to scan for all <a> links
function scanForLinks(tabId) {
  console.log(`Starting scanForLinks for tab ID: ${tabId}`);
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      console.log('Content script running in tab');
      // Find all <a> tags with href attributes
      const anchors = document.querySelectorAll('a[href]');
      console.log(`Found ${anchors.length} <a> tags with href attributes`);
      // Map to their href values
      const allLinks = Array.from(anchors).map(a => a.href);
      console.log('Links collected:', allLinks);
      return allLinks;
    }
  }, (results) => {
    console.log('executeScript callback triggered with results:', results);
    if (results && results[0] && results[0].result) {
      links = results[0].result; // Update global links array
      console.log('Global links array updated:', links);
    } else {
      console.log('No valid results received. Results:', results);
    }
  });
}

// When the extension’s action is clicked, scan the active tab
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked. Tab info:', tab);
  scanForLinks(tab.id);
});

// Scan when a tab is updated (e.g., page load)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated. Tab ID:', tabId, 'ChangeInfo:', changeInfo);
  if (changeInfo.status === 'complete') {
    console.log('Tab loading complete, scanning for links');
    scanForLinks(tabId);
  }
});