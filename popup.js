document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get(['productiveSites', 'unproductiveSites'], (result) => {
    if (result.productiveSites) {
      document.getElementById('productiveSites').value = result.productiveSites.join('\n');
    }
    if (result.unproductiveSites) {
      document.getElementById('unproductiveSites').value = result.unproductiveSites.join('\n');
    }
  });
  
  // Save settings
  document.getElementById('saveSettings').addEventListener('click', () => {
    const productiveSites = document.getElementById('productiveSites').value.split('\n')
      .map(site => site.trim())
      .filter(site => site.length > 0);
    
    const unproductiveSites = document.getElementById('unproductiveSites').value.split('\n')
      .map(site => site.trim())
      .filter(site => site.length > 0);
    
    chrome.storage.sync.set({
      productiveSites: productiveSites,
      unproductiveSites: unproductiveSites
    }, () => {
      // Notify background script about updated settings
      chrome.runtime.sendMessage({ action: 'settingsUpdated' });
      window.close();
    });
  });
});