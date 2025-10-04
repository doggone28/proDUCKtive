// Default productive websites (work, productivity tools)
const DEFAULT_PRODUCTIVE_SITES = [
  'github.com',
  'stackoverflow.com',
  'docs.google.com',
  'notion.so',
  'trello.com',
  'calendar.google.com'
];

// Default unproductive websites (distractions)
const DEFAULT_UNPRODUCTIVE_SITES = [
  'youtube.com',
  'netflix.com',
  'twitter.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'reddit.com'
];

// Initialize storage with defaults
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['productiveSites', 'unproductiveSites'], (result) => {
    if (!result.productiveSites) {
      chrome.storage.local.set({ productiveSites: DEFAULT_PRODUCTIVE_SITES });
    }
    if (!result.unproductiveSites) {
      chrome.storage.local.set({ unproductiveSites: DEFAULT_UNPRODUCTIVE_SITES });
    }
  });
});

// Track user productivity state
let isProductive = true;
let inactiveTime = 0;
let inactivityTimer;
let currentUrl = '';

// Initialize from storage
chrome.storage.local.get(['isProductive', 'inactiveTime'], (result) => {
  isProductive = result.isProductive !== undefined ? result.isProductive : true;
  inactiveTime = result.inactiveTime || 0;
  startInactivityTracking();
});

// Track URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    currentUrl = changeInfo.url;
    checkWebsiteProductivity(changeInfo.url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      currentUrl = tab.url;
      checkWebsiteProductivity(tab.url);
    }
  });
});

// Check if current website is productive or unproductive
async function checkWebsiteProductivity(url) {
  try {
    const { productiveSites, unproductiveSites } = await chrome.storage.local.get([
      'productiveSites', 
      'unproductiveSites'
    ]);
    
    const domain = extractDomain(url);
    
    // Check if website is in productive list
    if (productiveSites.some(site => domain.includes(site))) {
      setProductivity(true, 'productive_website');
    } 
    // Check if website is in unproductive list
    else if (unproductiveSites.some(site => domain.includes(site))) {
      setProductivity(false, 'unproductive_website');
    }
    // If not in either list, use inactivity tracking
    else {
      resetInactivity();
    }
  } catch (error) {
    console.error('Error checking website productivity:', error);
  }
}

// Extract domain from URL
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function setProductivity(productive, reason = 'manual') {
  const wasProductive = isProductive;
  isProductive = productive;
  
  if (!productive) {
    inactiveTime = 30; // Mark as immediately unproductive
  } else {
    inactiveTime = 0;
  }
  
  chrome.storage.local.set({ isProductive, inactiveTime });
  
  // Only notify if state actually changed
  if (wasProductive !== isProductive) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'setProductivity', 
          productive: isProductive,
          reason 
        });
      }
    });
  }
  
  if (isProductive) {
    startInactivityTracking();
  }
}

function startInactivityTracking() {
  if (inactivityTimer) clearInterval(inactivityTimer);
  
  inactivityTimer = setInterval(() => {
    inactiveTime++;
    
    // After 30 seconds of inactivity, become unproductive
    if (inactiveTime >= 30 && isProductive) {
      setProductivity(false, 'inactivity');
    }
    
    chrome.storage.local.set({ inactiveTime });
  }, 1000);
}

// Reset inactivity timer on user activity
function resetInactivity() {
  inactiveTime = 0;
  if (!isProductive) {
    // Only reset to productive if not on an unproductive website
    chrome.storage.local.get(['unproductiveSites'], (result) => {
      const domain = extractDomain(currentUrl);
      const isUnproductiveSite = result.unproductiveSites?.some(site => domain.includes(site));
      
      if (!isUnproductiveSite) {
        setProductivity(true, 'user_activity');
      }
    });
  }
  startInactivityTracking();
}

// Event listeners for user activity
chrome.tabs.onActivated.addListener(resetInactivity);
chrome.tabs.onUpdated.addListener(resetInactivity);
chrome.windows.onFocusChanged.addListener(resetInactivity);

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setProductivity') {
    setProductivity(request.productive, 'manual');
  }
  
  if (request.action === 'getProductivity') {
    sendResponse({ isProductive, inactiveTime, currentUrl });
  }
  
  if (request.action === 'userActivity') {
    resetInactivity();
  }
  
  if (request.action === 'getWebsiteLists') {
    chrome.storage.local.get(['productiveSites', 'unproductiveSites'], (result) => {
      sendResponse(result);
    });
    return true; // Required for async response
  }
  
  if (request.action === 'updateWebsiteLists') {
    chrome.storage.local.set({
      productiveSites: request.productiveSites,
      unproductiveSites: request.unproductiveSites
    });
    // Re-check current website with new lists
    if (currentUrl) {
      checkWebsiteProductivity(currentUrl);
    }
  }
  
  if (request.action === 'addWebsite') {
    chrome.storage.local.get([request.listType], (result) => {
      const currentList = result[request.listType] || [];
      if (!currentList.includes(request.website)) {
        const newList = [...currentList, request.website];
        chrome.storage.local.set({ [request.listType]: newList });
        
        // Re-check current website
        if (currentUrl) {
          checkWebsiteProductivity(currentUrl);
        }
      }
    });
  }
  
  if (request.action === 'removeWebsite') {
    chrome.storage.local.get([request.listType], (result) => {
      const currentList = result[request.listType] || [];
      const newList = currentList.filter(site => site !== request.website);
      chrome.storage.local.set({ [request.listType]: newList });
      
      // Re-check current website
      if (currentUrl) {
        checkWebsiteProductivity(currentUrl);
      }
    });
  }
});