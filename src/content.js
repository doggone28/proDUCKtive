// Create duck element
const duck = document.createElement('div');
duck.id = 'productivity-duck';
duck.style.cssText = `
  position: fixed;
  width: 80px;
  height: 80px;
  z-index: 10000;
  pointer-events: none;
  transition: all 0.3s ease;
  bottom: 20px;
  right: 20px;
  user-select: none;
  -webkit-user-select: none;
`;

// Create audio element for quack
const quackAudio = new Audio(chrome.runtime.getURL('public/quack.mp3'));
quackAudio.volume = 0.3;

let position = { x: window.innerWidth - 100, y: window.innerHeight - 100 };
let direction = { x: -1, y: -1 };
let moveInterval;
let isProductive = true;

// Initialize duck
function initDuck() {
  updateDuckAppearance();
  document.body.appendChild(duck);
  
  // Start movement if productive
  if (isProductive) {
    startMoving();
  }
}

// Update duck appearance based on productivity
function updateDuckAppearance() {
  if (isProductive) {
    duck.innerHTML = `
      <img src="${chrome.runtime.getURL('public/duck.png')}" 
           style="width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s ease;"
           alt="Productive Duck">
    `;
    duck.style.width = '60px';
    duck.style.height = '60px';
    updateDuckDirection();
  } else {
    duck.innerHTML = `
      <img src="${chrome.runtime.getURL('public/duck.gif')}" 
           style="width: 100%; height: 100%; object-fit: contain;"
           alt="Unproductive Duck">
    `;
    duck.style.width = '80px';
    duck.style.height = '80px';
    
    // Play quack sound when becoming unproductive
    quackAudio.play().catch(() => {
      // Auto-play might be blocked, that's okay
    });
  }
}

// Move duck around screen
function startMoving() {
  if (moveInterval) clearInterval(moveInterval);
  
  moveInterval = setInterval(() => {
    if (!isProductive) {
      clearInterval(moveInterval);
      return;
    }
    
    position.x += direction.x * 2;
    position.y += direction.y * 2;
    
    // Bounce off edges
    if (position.x <= 0 || position.x >= window.innerWidth - 60) {
      direction.x = -direction.x;
      updateDuckDirection();
    }
    if (position.y <= 0 || position.y >= window.innerHeight - 60) {
      direction.y = -direction.y;
      updateDuckDirection();
    }
    
    // Keep within bounds
    position.x = Math.max(0, Math.min(window.innerWidth - 60, position.x));
    position.y = Math.max(0, Math.min(window.innerHeight - 60, position.y));
    
    duck.style.left = position.x + 'px';
    duck.style.top = position.y + 'px';
  }, 50);
}

function updateDuckDirection() {
  const img = duck.querySelector('img');
  if (img) {
    img.style.transform = `scaleX(${direction.x > 0 ? 1 : -1})`;
  }
}

// Listen for productivity changes from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setProductivity') {
    isProductive = request.productive;
    updateDuckAppearance();
    
    if (isProductive) {
      startMoving();
    } else {
      if (moveInterval) clearInterval(moveInterval);
      // Position unproductive duck in corner
      position.x = window.innerWidth - 100;
      position.y = window.innerHeight - 100;
      duck.style.left = position.x + 'px';
      duck.style.top = position.y + 'px';
    }
  }
});

// Get initial state from background script
chrome.runtime.sendMessage({ action: 'getProductivity' }, (response) => {
  if (response) {
    isProductive = response.isProductive;
    initDuck();
  }
});

// Reset inactivity on user interaction
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, () => {
    chrome.runtime.sendMessage({ action: 'userActivity' });
  }, { passive: true });
});

// Handle window resize
window.addEventListener('resize', () => {
  position.x = Math.min(position.x, window.innerWidth - 60);
  position.y = Math.min(position.y, window.innerHeight - 60);
  duck.style.left = position.x + 'px';
  duck.style.top = position.y + 'px';
});