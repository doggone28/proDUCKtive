// Load duck CSS
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('duck/duck.css');
document.head.appendChild(link);

// Load duck JS
const script = document.createElement('script');
script.src = chrome.runtime.getURL('duck/duck.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showDuck") {
        showDuck();
    } else if (request.action === "hideDuck") {
        hideDuck();
    }
});

function showDuck() {
    // Wait for duck to be loaded
    if (window.ProDUCKtiveDuck) {
        window.ProDUCKtiveDuck.show();
    } else {
        // Retry after a short delay
        setTimeout(() => {
            if (window.ProDUCKtiveDuck) {
                window.ProDUCKtiveDuck.show();
            }
        }, 100);
    }
}

function hideDuck() {
    if (window.ProDUCKtiveDuck) {
        window.ProDUCKtiveDuck.hide();
    }
}

// Detect page changes (for SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Notify background script of URL change
        chrome.runtime.sendMessage({action: "urlChanged", url: url});
    }
}).observe(document, {subtree: true, childList: true});