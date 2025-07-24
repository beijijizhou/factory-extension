document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'getLinks' }, (response) => {
    const linkList = document.getElementById('link-list');
    console.log('Received response from background:', response);
    console.log('Links:', response.links);
    if (response && response.links && response.links.length > 0) {
      response.links.forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        a.target = '_blank';
        a.style.color = link.text === '重新下载' ? '#d32f2f' : '#388e3c';
        li.appendChild(a);
        // Add date and sequence
        const info = document.createElement('span');
        info.textContent = ` (Date: ${link.date}, Seq: ${link.sequence})`;
        info.style.color = '#555';
        info.style.fontSize = '0.9em';
        li.appendChild(info);
        linkList.appendChild(li);
      });
    } else {
      linkList.textContent = 'No matching links found.';
    }
  });
});