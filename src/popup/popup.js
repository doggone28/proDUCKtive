// Update popup with current state
function updatePopup() {
  chrome.runtime.sendMessage({ action: 'getProductivity' }, (response) => {
    if (response) {
      const statusElement = document.getElementById('status');
      const inactiveTimeElement = document.getElementById('inactiveTime');
      const currentSiteElement = document.getElementById('currentSite');
      
      if (response.isProductive) {
        statusElement.textContent = '🟢 Productive';
        statusElement.style.background = 'rgba(34, 197, 94, 0.3)';
      } else {
        statusElement.textContent = '🔴 Unproductive';
        statusElement.style.background = 'rgba(239, 68, 68, 0.3)';
      }
      
      inactiveTimeElement.textContent = response.inactiveTime + 's';
      
      if (response.currentUrl) {
        try {
          const domain = new URL(response.currentUrl).hostname;
          currentSiteElement.textContent = domain;
        } catch {
          currentSiteElement.textContent = response.currentUrl;
        }
      } else {
        currentSiteElement.textContent = '-';
      }
    }
  });
  
  updateWebsiteLists();
  updateAISummary();
}

// Update website lists display
function updateWebsiteLists() {
  chrome.runtime.sendMessage({ action: 'getWebsiteLists' }, (response) => {
    if (response) {
      updateWebsiteList('productiveList', response.productiveSites || []);
      updateWebsiteList('unproductiveList', response.unproductiveSites || []);
    }
  });
}

function updateWebsiteList(elementId, sites) {
  const listElement = document.getElementById(elementId);
  listElement.innerHTML = '';
  
  sites.forEach(site => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${site}</span>
      <button class="remove-btn" data-site="${site}" data-list="${elementId === 'productiveList' ? 'productiveSites' : 'unproductiveSites'}">×</button>
    `;
    listElement.appendChild(li);
  });
  
  // Add remove event listeners
  listElement.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const site = e.target.getAttribute('data-site');
      const listType = e.target.getAttribute('data-list');
      chrome.runtime.sendMessage({
        action: 'removeWebsite',
        website: site,
        listType: listType
      });
      updateWebsiteLists();
    });
  });
}

// Manual productivity controls
document.getElementById('productiveBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ 
    action: 'setProductivity', 
    productive: true 
  });
  updatePopup();
});

document.getElementById('unproductiveBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ 
    action: 'setProductivity', 
    productive: false 
  });
  updatePopup();
});

// Add website functionality
document.getElementById('addWebsiteBtn').addEventListener('click', () => {
  const input = document.getElementById('websiteInput');
  const listType = document.getElementById('websiteListType').value;
  const website = input.value.trim().toLowerCase();
  
  if (website) {
    chrome.runtime.sendMessage({
      action: 'addWebsite',
      website: website,
      listType: listType
    });
    input.value = '';
    updateWebsiteLists();
  }
});

// Allow Enter key to add website
document.getElementById('websiteInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('addWebsiteBtn').click();
  }
});


// 🧠 --- AI SUMMARY SECTION --- 🧠

// Load AI summary from storage
async function updateAISummary() {
  const summaryElement = document.getElementById('aiSummary');
  if (!summaryElement) return;

  const { aiSummary } = await chrome.storage.local.get('aiSummary');
  summaryElement.textContent = aiSummary || "No summary yet 🦆";
}

// Force regenerate summary
document.getElementById('refreshSummaryBtn')?.addEventListener('click', () => {
  const summaryElement = document.getElementById('aiSummary');
  summaryElement.textContent = "Generating summary...";
  
  chrome.runtime.sendMessage({ action: 'generateSummaryNow' }, (response) => {
    if (response?.success) {
      setTimeout(updateAISummary, 3000); // wait a few seconds for it to complete
    } else {
      summaryElement.textContent = "Error generating summary.";
    }
  });
});

// Auto-update every second
updatePopup();
setInterval(updatePopup, 1000);
