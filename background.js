let divsList = []; // Store results globally

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.action === 'getDivs') {
        console.log('Sending divs to popup:', divsList);
        sendResponse({ divs: divsList });
    }
});

// Function to list <div> elements, filtering for those containing "2025" after collection
function listAllDivs(tabId) {
    console.log(`Starting listAllDivs for tab ID: ${tabId}`);
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            console.log('Content script started');
            return new Promise(resolve => {
                // Function to collect divs from a given document or shadow root
                function collectDivs(root) {
                    const divs = root.querySelectorAll('div.cardHead__style-3fjzzt');
                    return Array.from(divs).map((div, index) => ({
                        id: index + 1,
                        text: div.textContent.trim()
                    }));
                }

                // Check if the page is "ready" by looking for a div with "2025" in its text
                function isPageReady(divs) {
                    return divs.some(div => div.text.includes('2025'));
                }

                // Collect divs from main document, shadow DOM, and iframes
                function gatherAllDivs() {
                    let allDivs = collectDivs(document);
                    return allDivs;
                }

                // Initial collection attempt
                let allDivs = gatherAllDivs();
                // console.log('Initial divs collected:', allDivs);

                // If the page is ready (contains target text), filter and resolve
                if (isPageReady(allDivs)) {
                    console.log('Page is ready, filtering divs for "2025"');
                    const filteredDivs = allDivs.filter(div => div.text.includes('2025'));
                    console.log('Filtered divs containing "2025":', filteredDivs);
                    resolve(filteredDivs);
                    return;
                }

                // Observe DOM for changes
                let mutationCount = 0;
                const maxMutations = 10; // Limit to prevent infinite observation
                const observer = new MutationObserver((mutations, obs) => {
                    mutationCount++;
                    console.log(`DOM mutation #${mutationCount} detected, re-collecting divs`);
                    allDivs = gatherAllDivs();
                    // Check if the page is ready
                    if (isPageReady(allDivs)) {
                        // console.log('Page is ready after mutation, filtering divs for "2025"');
                        const filteredDivs = allDivs.filter(div => div.text.includes('2025'));
                        // console.log('Filtered divs containing "2025":', filteredDivs);
                        obs.disconnect();
                        resolve(filteredDivs);
                    } else if (mutationCount >= maxMutations) {
                        console.log('Max mutations reached, filtering divs for "2025"');
                        const filteredDivs = allDivs.filter(div => div.text.includes('2025'));
                        console.log('Filtered divs containing "2025":', filteredDivs);
                        obs.disconnect();
                        resolve(filteredDivs);
                    }
                });

                // Start observing DOM changes
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });

                // Fallback: Resolve after 5 seconds if no target content is found
                setTimeout(() => {
                    observer.disconnect();
                    console.log('Timeout reached, filtering divs for "2025"');
                    // console.log('All divs collected:', allDivs);
                    const filteredDivs = allDivs.filter(div => div.text.includes('2025'));
                    // console.log('Timeout filtered divs containing "2025":', filteredDivs);
                    console.log('Filtered divs containing "2025":', filteredDivs);
                    resolve(filteredDivs);
                }, 2000);
            });
        }
    }, (results) => {
        console.log('executeScript callback triggered with results:', results);
        if (chrome.runtime.lastError) {
            console.error('Script execution error:', chrome.runtime.lastError.message);
        } else if (results && results[0] && results[0].result) {
            divsList = results[0].result;
            console.log('Global divs array updated:', divsList);
            // Log divs containing "20250717002" for debugging
            const targetDivs = divsList.filter(div => div.text.includes('20250717002'));
            console.log('Divs containing "20250717002":', targetDivs);
        } else {
            console.log('No valid results received. Results:', results);
        }
    });
}

// When the extension’s action is clicked, list divs in the active tab
chrome.action.onClicked.addListener((tab) => {
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('file://')) {
        console.log('Cannot run on restricted page:', tab.url);
        return;
    }
    console.log('Extension icon clicked. Tab info:', tab);
    listAllDivs(tab.id);
});

// List divs when a tab is updated (e.g., page load)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('Tab updated. Tab ID:', tabId, 'ChangeInfo:', changeInfo, 'Tab:', tab);
    if (changeInfo.status === 'complete' && !tab.url.startsWith('chrome://') && !tab.url.startsWith('file://')) {
        console.log('Tab loading complete, listing divs');
        listAllDivs(tabId);
    }
});