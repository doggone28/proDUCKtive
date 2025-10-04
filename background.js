// Track productive/unproductive sites
const productiveSites = [
  "docs.google.com",
  "stackoverflow.com",
  "github.com",
  "notion.so"
  // Add more productive sites
];

const unproductiveSites = [
  "youtube.com",
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "reddit.com",
  "netflix.com"
  // Add more unproductive sites
];

// Track current tab and productivity status
let currentTabId = null;
let isProductive = true;

chrome.tabs.onActivated.addListener((activeInfo) => {
  currentTabId = activeInfo.tabId;
  checkProductivity(currentTabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === currentTabId && changeInfo.status === 'complete') {
    checkProductivity(tabId);
  }
});

function checkProductivity(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (!tab.url) return;
    
    const url = new URL(tab.url);
    const hostname = url.hostname;
    
    // Check if current site is unproductive
    const isUnproductive = unproductiveSites.some(site => hostname.includes(site));
    const isProductiveSite = productiveSites.some(site => hostname.includes(site));
    
    if (isUnproductive && !isProductiveSite) {
      isProductive = false;
      // Send message to content script to show duck
      chrome.tabs.sendMessage(tabId, { action: "showDuck" });
    } else {
      isProductive = true;
      // Send message to content script to hide duck
      chrome.tabs.sendMessage(tabId, { action: "hideDuck" });
    }
  });
}