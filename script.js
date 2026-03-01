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
    // Set canvas size to match the window
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw the webcam feed
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // If a human is detected, replace them
    if (results.segmentationMask) {
        canvasCtx.globalCompositeOperation = 'source-in';
        
        // This creates the "Counter-Surveillance" mask 
        // We fill the person's shape with a slight blur or solid color
        canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.2)'; 
        canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

        // Draw the emoji over the detected person
        canvasCtx.globalCompositeOperation = 'source-over';
        canvasCtx.font = `${canvasElement.width * 0.2}px serif`; // Scale emoji to screen size
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "middle";
        
        // In this basic experiment, we place the emoji in the center 
        // whenever a person is detected in the frame.
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

// 5. Start the Camera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await selfieSegmentation.send({image: videoElement});
    },
    width: 1280,
    height: 720
});
camera.start();