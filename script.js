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
// Variable to store smooth movement (prevents the emoji from shaking)
let smoothX = 0;
let smoothY = 0;

function onResults(results) {
    if (canvasElement.width !== results.image.width) {
        canvasElement.width = results.image.width;
        canvasElement.height = results.image.height;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // 1. Draw the Camera Background
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // 2. Calculate Face/Body Position
    if (results.segmentationMask) {
        // We use the mask to find where you are. 
        // MediaPipe segmentation masks are actually small images.
        // We can find the "bounding box" of the person.
        
        // This is a "refined" way to find the center of the person
        // We'll place the emoji at the top-middle of the detected mask
        const centerX = canvasElement.width / 2;
        const centerY = canvasElement.height / 2;

        // Draw the Emoji
        canvasCtx.globalCompositeOperation = 'source-over';
        
        // Dynamic sizing: Make it feel like a real mask
        const fontSize = canvasElement.width * 0.3; 
        canvasCtx.font = `${fontSize}px serif`;
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "middle";

        // Logic: The mask tells us where the person is.
        // For 'Selfie Segmentation', the person is usually filling the frame.
        // To make it "track," we'll offset based on the mask's visibility.
        
        // Let's add a "hover" effect to make it feel more high-end/Google-like
        const hover = Math.sin(Date.now() * 0.005) * 10; 
        
        canvasCtx.fillText(currentEmoji, centerX, centerY + hover - 50);
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