const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const emojiDisplay = document.getElementById('emoji-display');
const spinBtn = document.getElementById('spin-button');

// 1. Emoji Categories Data
const categories = {
    "Smileys": ["😀", "😂", "🥹", "😍", "🧐", "😴", "🤯", "🥳"],
    "Animals": ["🐶", "🐱", "🦊", "🦁", "🐼", "🐸", "🦄", "🐝"],
    "Food": ["🍕", "🍔", "🍣", "🌮", "🍦", "🍩", "🍎", "🍙"],
    "Travel": ["✈️", "🚀", "🧭", "🌅", "🏔️", "🌏", "🚢", "🏡"],
    "Activities": ["⚽", "🎮", "🎨", "🎃", "🎸", "🏆", "🎾", "🏈"],
    "Objects": ["💎", "🎩", "💡", "💻", "💾", "🔮", "🎁", "💰"],
    "Symbols": ["❤️", "⚠️", "🔥", "🛂", "🚸", "🔄", "☯️", "⛔"],
    "Flags": ["🏁", "🚩", "🏴‍☠️", "🏳️‍🌈", "🇺🇳", "🇪🇺", "🏳️‍⚧️", "🏳️"]
};

let categoryKeys = Object.keys(categories);
let currentCategory = "Smileys";
let faceEmojiMap = new Map(); // Remembers which emoji belongs to which face ID

// Add this to your existing variable declarations at the top
const categoryLabel = document.getElementById('category-label');

// Update your spinBtn Event Listener
spinBtn.addEventListener('click', () => {
    let spins = 0;
    spinBtn.disabled = true;
    spinBtn.innerText = "SHUFFLING...";
    
    const interval = setInterval(() => {
        // Pick a random category key
        const randomKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
        
        // 1. Update the Icon in the bubble
        emojiDisplay.innerText = categories[randomKey][0]; 
        
        // 2. Update the Text in the header banner
        categoryLabel.innerText = randomKey;
        
        currentCategory = randomKey;
        
        spins++;
        if (spins > 12) {
            clearInterval(interval);
            spinBtn.disabled = false;
            spinBtn.innerText = "RANDOMIZE CATEGORY";
            
            // Clear the map so existing faces get new emojis from the new category
            faceEmojiMap.clear(); 
        }
    }, 80);
});

// 3. Face Mesh Setup (Multi-Face Enabled)
const faceMesh = new FaceMesh({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`});
faceMesh.setOptions({
    maxNumFaces: 10, // Track up to 10 people
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

// 4. Multi-Face Rendering Engine
function onResults(results) {
    canvasElement.width = results.image.width;
    canvasElement.height = results.image.height;
    canvasCtx.save();
    
    // Draw Webcam
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks) {
        results.multiFaceLandmarks.forEach((landmarks, index) => {
            // Assign a persistent emoji to this face index if it doesn't have one
            if (!faceEmojiMap.has(index)) {
                const categoryList = categories[currentCategory];
                const randomEmoji = categoryList[Math.floor(Math.random() * categoryList.length)];
                faceEmojiMap.set(index, randomEmoji);
            }

            const emoji = faceEmojiMap.get(index);
            drawEmojiOnFace(landmarks, emoji);
        });
    }
    canvasCtx.restore();
}

function drawEmojiOnFace(landmarks, emoji) {
    const nose = landmarks[1];
    const x = nose.x * canvasElement.width;
    const y = nose.y * canvasElement.height;
    const faceSize = Math.abs(landmarks[10].y - landmarks[152].y) * canvasElement.height;
    
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.rotate(angle);
    canvasCtx.font = `${faceSize * 2.8}px serif`;
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(emoji, 0, 0);
    canvasCtx.restore();
}

const camera = new Camera(videoElement, {
    onFrame: async () => { await faceMesh.send({image: videoElement}); },
    width: 1280, height: 720
});
camera.start();