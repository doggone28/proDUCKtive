class ProDUCKtiveDuck {
    constructor() {
        this.duckElement = null;
        this.moveInterval = null;
        this.quackInterval = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createDuck();
        this.setupEventListeners();
    }

    createDuck() {
        // Create duck container
        this.duckElement = document.createElement('div');
        this.duckElement.id = 'proDUCKtive-duck';
        this.duckElement.className = 'proDUCKtive-duck';
        
        // Create duck body
        const duckBody = document.createElement('div');
        duckBody.className = 'duck-body';
        
        // Create duck face
        const duckFace = document.createElement('div');
        duckFace.className = 'duck-face';
        
        // Create eyes
        const leftEye = document.createElement('div');
        leftEye.className = 'eye left-eye';
        const rightEye = document.createElement('div');
        rightEye.className = 'eye right-eye';
        
        // Create beak
        const beak = document.createElement('div');
        beak.className = 'beak';
        
        // Assemble the duck
        duckFace.appendChild(leftEye);
        duckFace.appendChild(rightEye);
        duckFace.appendChild(beak);
        duckBody.appendChild(duckFace);
        this.duckElement.appendChild(duckBody);
        
        // Add to page
        document.body.appendChild(this.duckElement);
        
        this.hide();
    }

    setupEventListeners() {
        // Make duck clickable to dismiss
        this.duckElement.addEventListener('click', () => {
            this.temporaryDismiss();
        });

        // Make duck draggable
        this.makeDraggable();
    }

    show() {
        if (this.isVisible) return;
        
        this.duckElement.style.display = 'block';
        this.isVisible = true;
        
        // Start animations
        this.startMoving();
        this.startQuacking();
        
        console.log('🦆 Quack! Time to be productive!');
    }

    hide() {
        this.duckElement.style.display = 'none';
        this.isVisible = false;
        
        // Stop animations
        this.stopMoving();
        this.stopQuacking();
    }

    startMoving() {
        // Clear any existing interval
        this.stopMoving();
        
        // Move duck every 3-6 seconds
        this.moveInterval = setInterval(() => {
            this.moveToRandomPosition();
        }, 3000 + Math.random() * 3000);
        
        // Initial position
        this.moveToRandomPosition();
    }

    stopMoving() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
    }

    startQuacking() {
        // Clear any existing interval
        this.stopQuacking();
        
        // Quack every 5-10 seconds
        this.quackInterval = setInterval(() => {
            this.quack();
        }, 5000 + Math.random() * 5000);
        
        // Initial quack
        setTimeout(() => this.quack(), 1000);
    }

    stopQuacking() {
        if (this.quackInterval) {
            clearInterval(this.quackInterval);
            this.quackInterval = null;
        }
    }

    moveToRandomPosition() {
        if (!this.isVisible) return;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const duckWidth = 80;
        const duckHeight = 80;
        
        // Calculate safe area (not too close to edges)
        const safeX = Math.random() * (viewportWidth - duckWidth - 40) + 20;
        const safeY = Math.random() * (viewportHeight - duckHeight - 40) + 20;
        
        // Apply new position with smooth transition
        this.duckElement.style.transition = 'all 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.duckElement.style.left = `${safeX}px`;
        this.duckElement.style.top = `${safeY}px`;
        
        // Random waddle animation
        this.waddle();
    }

    waddle() {
        // Add waddle animation class
        this.duckElement.classList.add('waddling');
        
        // Remove after animation completes
        setTimeout(() => {
            this.duckElement.classList.remove('waddling');
        }, 500);
    }

    quack() {
        if (!this.isVisible) return;
        
        // Visual quack effect
        this.duckElement.classList.add('quacking');
        
        // Play quack sound if available
        this.playQuackSound();
        
        // Show quack text bubble occasionally
        if (Math.random() > 0.7) {
            this.showQuackBubble();
        }
        
        // Remove quacking class after animation
        setTimeout(() => {
            this.duckElement.classList.remove('quacking');
        }, 1000);
    }

    playQuackSound() {
        try {
            const audio = new Audio(chrome.runtime.getURL('duck/quack.mp3'));
            audio.volume = 0.3;
            audio.play().catch(e => {
                // Fallback: Use Web Speech API for quack sound
                this.syntheticQuack();
            });
        } catch (error) {
            this.syntheticQuack();
        }
    }

    syntheticQuack() {
        // Fallback quack using speech synthesis
        if ('speechSynthesis' in window) {
            const quack = new SpeechSynthesisUtterance('Quack!');
            quack.volume = 0.1;
            quack.rate = 1.5;
            quack.pitch = 2;
            window.speechSynthesis.speak(quack);
        }
    }

    showQuackBubble() {
        // Create speech bubble
        const bubble = document.createElement('div');
        bubble.className = 'quack-bubble';
        bubble.textContent = 'Quack!';
        
        // Position near duck
        const duckRect = this.duckElement.getBoundingClientRect();
        bubble.style.left = `${duckRect.left - 40}px`;
        bubble.style.top = `${duckRect.top - 30}px`;
        
        document.body.appendChild(bubble);
        
        // Remove bubble after delay
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, 2000);
    }

    temporaryDismiss() {
        // Hide duck for 30 seconds when clicked
        this.hide();
        
        // Show countdown tooltip
        this.showDismissMessage();
        
        // Reappear after 30 seconds
        setTimeout(() => {
            this.show();
        }, 30000);
    }

    showDismissMessage() {
        const message = document.createElement('div');
        message.className = 'duck-message';
        message.textContent = 'Duck will return in 30 seconds! 🦆';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #FFD700;
            padding: 10px 15px;
            border-radius: 20px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10001;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    makeDraggable() {
        let isDragging = false;
        let offsetX, offsetY;
        
        this.duckElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - this.duckElement.getBoundingClientRect().left;
            offsetY = e.clientY - this.duckElement.getBoundingClientRect().top;
            this.duckElement.style.transition = 'none';
            this.duckElement.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            // Keep within viewport bounds
            const boundedX = Math.max(10, Math.min(x, window.innerWidth - 90));
            const boundedY = Math.max(10, Math.min(y, window.innerHeight - 90));
            
            this.duckElement.style.left = `${boundedX}px`;
            this.duckElement.style.top = `${boundedY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.duckElement.style.cursor = 'grab';
                this.duckElement.style.transition = 'all 0.3s';
            }
        });
        
        // Touch support for mobile
        this.duckElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const touch = e.touches[0];
            offsetX = touch.clientX - this.duckElement.getBoundingClientRect().left;
            offsetY = touch.clientY - this.duckElement.getBoundingClientRect().top;
            this.duckElement.style.transition = 'none';
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const x = touch.clientX - offsetX;
            const y = touch.clientY - offsetY;
            
            const boundedX = Math.max(10, Math.min(x, window.innerWidth - 90));
            const boundedY = Math.max(10, Math.min(y, window.innerHeight - 90));
            
            this.duckElement.style.left = `${boundedX}px`;
            this.duckElement.style.top = `${boundedY}px`;
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
            this.duckElement.style.transition = 'all 0.3s';
        });
    }
}

// Initialize duck when script loads
const productiveDuck = new ProDUCKtiveDuck();

// Export for use in content.js
window.ProDUCKtiveDuck = productiveDuck;