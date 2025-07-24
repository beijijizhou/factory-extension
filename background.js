let links = []; // Store links globally

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.action === 'getLinks') {
        console.log('Sending links to popup:', links);
        sendResponse({ links });
    }
});

// Function to scan for <a> links with "重新下载" or "下载"
function scanForLinks(tabId) {
    console.log(`Starting scanForLinks for	tab ID: ${tabId}`);
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            console.log('Content script running in tab');
            // Find all <a> tags with href attributes
            const anchors = document.querySelectorAll('a[href]');
            console.log(`Found ${anchors.length} <a> tags with href attributes`);
            // Map to objects containing href, text, date, and sequence
            const allLinks = Array.from(anchors)
                .map(a => {
                    // Find the parent card and its header
                    const card = a.closest('.card');
                    const cardHead = card ? card.querySelector('.card-head') : null;
                    const date = cardHead ? cardHead.querySelector('.date')?.textContent : '';
                    const sequence = cardHead ? cardHead.querySelector('.sequence')?.textContent : '';
                    return {
                        href: a.href,
                        text: a.textContent.trim(),
                        date: date || 'Unknown',
                        sequence: sequence || 'Unknown'
                    };
                })
                .filter(link => {
                    const keywords = ['重新下载', '下载'];
                    const isMatch = keywords.includes(link.text);
                    console.log(`Link: ${link.href}, Text: ${link.text}, Date: ${link.date}, Sequence: ${link.sequence}, Matches: ${isMatch}`);
                    return isMatch;
                });
            console.log('Filtered links collected:', allLinks);
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