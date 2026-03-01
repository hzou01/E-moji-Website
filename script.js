const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const emojiDisplay = document.getElementById('emoji-display');
const spinBtn = document.getElementById('spin-button');

// 1. Emoji Themes
const emojis = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐷', '🐸', '🍕', '🍔', '🌮', '🍦', '🌵', '🎄', '🌸', '🍄'];
let currentEmoji = '👤';

// 2. Slot Machine Animation
spinBtn.addEventListener('click', () => {
    let spins = 0;
    spinBtn.disabled = true; // Prevent clicking while spinning
    
    const interval = setInterval(() => {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        emojiDisplay.innerText = randomEmoji;
        spins++;

        if (spins > 12) {
            clearInterval(interval);
            currentEmoji = emojiDisplay.innerText;
            spinBtn.disabled = false;
            spinBtn.innerText = "NEW IDENTITY";
        }
    }, 80); // Speed of the spin
});

// 3. The AI Processing Logic
function onResults(results) {
    // 1. Maintain proportions
    if (canvasElement.width !== results.image.width) {
        canvasElement.width = results.image.width;
        canvasElement.height = results.image.height;
    }

    canvasCtx.save();
    
    // 2. Clear the frame
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // 3. LAYER 1: Draw the full camera feed (The Background)
    canvasCtx.globalCompositeOperation = 'source-over';
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // 4. LAYER 2: Draw the Emoji (The Filter)
    if (results.segmentationMask) {
        // We only want to draw the emoji where a person is detected
        canvasCtx.globalCompositeOperation = 'source-over';
        
        const fontSize = canvasElement.width * 0.25; 
        canvasCtx.font = `${fontSize}px serif`;
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "middle";
        
        // This puts the emoji in the center of the frame
        canvasCtx.fillText(currentEmoji, canvasElement.width / 2, canvasElement.height / 2);
    }
    
    canvasCtx.restore();
}

// 4. Initialize MediaPipe Selfie Segmentation
const selfieSegmentation = new SelfieSegmentation({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
}});

selfieSegmentation.setOptions({
    modelSelection: 1, // 0 for general, 1 for landscape/high accuracy
});

selfieSegmentation.onResults(onResults);

/// 5. Optimized "Lightweight" Start
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await selfieSegmentation.send({image: videoElement});
    },
    // Removing fixed width/height allows the Mac to pick its own default
});

// We use a "User Gesture" to start the camera if the auto-start fails
console.log("Attempting to wake up camera...");
camera.start().catch(err => {
    console.error("Auto-start failed, waiting for user click:", err);
    // If it fails, we change the button text to 'Enable Camera'
    spinBtn.innerText = "ENABLE CAMERA TO START";
});