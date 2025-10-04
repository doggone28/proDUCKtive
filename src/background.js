// Track user productivity state
let isProductive = true;
let inactiveTime = 0;
let inactivityTimer;

// Initialize from storage
chrome.storage.local.get(['isProductive', 'inactiveTime'], (result) => {
  isProductive = result.isProductive !== undefined ? result.isProductive : true;
  inactiveTime = result.inactiveTime || 0;
  startInactivityTracking();
});

function startInactivityTracking() {
  if (inactivityTimer) clearInterval(inactivityTimer);
  
  inactivityTimer = setInterval(() => {
    inactiveTime++;
    
    // After 30 seconds of inactivity, become unproductive
    if (inactiveTime >= 30 && isProductive) {
      isProductive = false;
      chrome.storage.local.set({ isProductive: false, inactiveTime });
      
      // Notify content script to show animated duck
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'setProductivity', 
            productive: false 
          });
        }
      });
      
      // Play quack sound (will be handled by content script)
    }
    
    chrome.storage.local.set({ inactiveTime });
  }, 1000);
}

// Reset inactivity timer on user activity
chrome.tabs.onActivated.addListener(resetInactivity);
chrome.tabs.onUpdated.addListener(resetInactivity);
chrome.windows.onFocusChanged.addListener(resetInactivity);

function resetInactivity() {
  inactiveTime = 0;
  if (!isProductive) {
    isProductive = true;
    chrome.storage.local.set({ isProductive: true, inactiveTime: 0 });
    
    // Notify content script to show static duck
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'setProductivity', 
          productive: true 
        });
      }
    });
  }
  startInactivityTracking();
}

// Listen for manual productivity changes from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setProductivity') {
    isProductive = request.productive;
    inactiveTime = request.productive ? 0 : 30;
    chrome.storage.local.set({ 
      isProductive, 
      inactiveTime 
    });
    
    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'setProductivity', 
          productive: isProductive 
        });
      });
    });
  }
  
  if (request.action === 'getProductivity') {
    sendResponse({ isProductive, inactiveTime });
  }
});