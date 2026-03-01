const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const emojiDisplay = document.getElementById('emoji-preview');
const categoryLabel = document.getElementById('category-display');
const landingPage = document.getElementById('landing-page');
const appContainer = document.getElementById('app-container');
const activateToken = document.getElementById('activate-token');

// 1. Emoji Categories Data
const categories = {
    "Smileys": ["😀", "😂", "🥹", "😍", "🧐", "😴", "🤯", "🥳"],
    "Animals": ["🐶", "🐱", "🦊", "🦁", "🐼", "🐸", "🦄", "🐝"],
    "Food": ["🍕", "🍔", "🍣", "🌮", "🍦", "🍩", "🍎", "🍙"],
    "Travel": ["✈️", "🚀", "🧭", "🌅", "🏔️", "🌏", "🚕", "🏡"],
    "Activities": ["⚽", "🎮", "🎨", "🎃", "🎸", "🏆", "🎾", "🏈"],
    "Objects": ["💎", "🎩", "💡", "💻", "💾", "🔮", "🎁", "💰"],
    "Symbols": ["❤️", "⚠️", "🔥", "🛂", "🚸", "🔄", "☯️", "⛔"],
    "Flags": ["🏁", "🚩", "🏴‍☠️", "🏳️‍🌈", "🇺🇳", "🇪🇺", "🏳️‍⚧️", "🏳️"]
};

let categoryKeys = Object.keys(categories);
let currentCategory = "Smileys & Emotions";
let faceEmojiMap = new Map(); // Tracks unique emojis for different face IDs

// 3. AI Face Mesh Configuration
const faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});

faceMesh.setOptions({
    maxNumFaces: 16, // Multi-user support
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

// 4. Camera Setup
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({image: videoElement});
    },
    width: 1280,
    height: 720
});

// 5. Landing Page Activation
activateToken.addEventListener('click', () => {
    // Smooth transition
    landingPage.style.opacity = '0';
    setTimeout(() => {
        landingPage.style.display = 'none';
        appContainer.classList.remove('hidden');
        
        // Start Camera and Auto-Shuffle
        camera.start();
        initAutoShuffle();
    }, 800);
});

// 6. Auto-Shuffle Logic (Every 30 Seconds)
function initAutoShuffle() {
    // Run the first shuffle immediately
    triggerShuffleEffect();

    // Set interval for every 30 seconds
    setInterval(() => {
        triggerShuffleEffect();
    }, 20000);
}

function triggerShuffleEffect() {
    let spins = 0;
    const shuffleInterval = setInterval(() => {
        const randomKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
        
        // Update the Glass Bubble HUD
        emojiDisplay.innerText = categories[randomKey][0];
        categoryLabel.innerText = `CATEGORY: ${randomKey}`;
        
        currentCategory = randomKey;
        
        spins++;
        if (spins > 15) {
            clearInterval(shuffleInterval);
            faceEmojiMap.clear();
        }
    }, 80);
}

// 7. Core Rendering Engine
function onResults(results) {
    // Make canvas fill the screen exactly
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw full-screen webcam mirror
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks) {
        results.multiFaceLandmarks.forEach((landmarks, index) => {
            // Assign a persistent emoji to this face index if it doesn't have one
            if (!faceEmojiMap.has(index)) {
                const list = categories[currentCategory];
                const randomEmoji = list[Math.floor(Math.random() * list.length)];
                faceEmojiMap.set(index, randomEmoji);
            }

            const emoji = faceEmojiMap.get(index);
            drawEmoji(landmarks, emoji);
        });
    }
    canvasCtx.restore();
}

// 8. Emoji Drawing & Math
function drawEmoji(landmarks, emoji) {
    const noseTip = landmarks[1];
    const x = noseTip.x * canvasElement.width;
    const y = noseTip.y * canvasElement.height;

    // Scale emoji based on distance between top of forehead (10) and chin (152)
    const faceSize = Math.abs(landmarks[10].y - landmarks[152].y) * canvasElement.height;
    
    // Calculate head tilt (rotation)
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.rotate(angle);
    
    // Adjust font size multiplier (2.8x seems to cover most faces well)
    canvasCtx.font = `${faceSize * 2.8}px serif`;
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    
    canvasCtx.fillText(emoji, 0, 0);
    canvasCtx.restore();
}

// Ensure the canvas resizes if the window does
window.addEventListener('resize', () => {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
});