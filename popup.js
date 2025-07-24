document.addEventListener('DOMContentLoaded', () => {
  // Query the background script for links
  chrome.runtime.sendMessage({ action: 'getLinks' }, (response) => {
    const linkList = document.getElementById('link-list');
    if (response && response.links && response.links.length > 0) {
      response.links.forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link;
        a.textContent = link;
        a.target = '_blank'; // Open in new tab
        li.appendChild(a);
        linkList.appendChild(li);
      });
    } else {
      linkList.textContent = 'No downloadable links found.';
    }
  });
});