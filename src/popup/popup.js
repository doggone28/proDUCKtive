// Update popup with current state
function updatePopup() {
  chrome.runtime.sendMessage({ action: 'getProductivity' }, (response) => {
    if (response) {
      const statusElement = document.getElementById('status');
      const inactiveTimeElement = document.getElementById('inactiveTime');
      
      if (response.isProductive) {
        statusElement.textContent = '🟢 Productive';
        statusElement.style.background = 'rgba(34, 197, 94, 0.3)';
      } else {
        statusElement.textContent = '🔴 Unproductive';
        statusElement.style.background = 'rgba(239, 68, 68, 0.3)';
      }
      
      inactiveTimeElement.textContent = response.inactiveTime + 's';
    }
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

// Update every second
updatePopup();
setInterval(updatePopup, 1000);
