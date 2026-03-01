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
    canvasCtx.save();
    
    // Clear the canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // 1. Draw the background
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // 2. The AI logic
    if (results.segmentationMask) {
        // We only want to draw where the person IS NOT
        canvasCtx.globalCompositeOperation = 'destination-out';
        canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
        
        // Now draw the background again in those holes
        canvasCtx.globalCompositeOperation = 'destination-over';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        // 3. Put the emoji over the person
        canvasCtx.globalCompositeOperation = 'source-over';
        
        // This is a "refined" trick: we use the mask to find the top of the head
        canvasCtx.font = "150px serif";
        canvasCtx.textAlign = "center";
        
        // For now, we'll keep it centered, but you can see the person is "cut out"
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

// 5. Start the Camera with a "Warm-up" Delay
const camera = new Camera(videoElement, {
    onFrame: async () => {
        try {
            await selfieSegmentation.send({image: videoElement});
        } catch (e) {
            console.error("AI frame dropped:", e);
        }
    },
    width: 1280,
    height: 720
});

// Instead of starting instantly, we wait 500ms
// This prevents the Mac 'Timeout' by letting the sensor wake up first
console.log("Waiting for camera hardware to initialize...");
setTimeout(() => {
    camera.start()
        .then(() => console.log("Camera successfully active."))
        .catch(err => console.error("Final camera check failed:", err));
}, 500);