const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const emojiDisplay = document.getElementById('emoji-display');
const spinBtn = document.getElementById('spin-button');

const emojis = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐷', '🐸', '🍕', '🍔', '🌮', '🍦', '🌵', '🎄', '🌸', '🍄'];
let currentEmoji = '👤';

// Slot Machine Logic
spinBtn.addEventListener('click', () => {
    let spins = 0;
    spinBtn.disabled = true;
    const interval = setInterval(() => {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        emojiDisplay.innerText = randomEmoji;
        spins++;
        if (spins > 10) {
            clearInterval(interval);
            currentEmoji = emojiDisplay.innerText;
            spinBtn.disabled = false;
        }
    }, 80);
});

// The Brain: FaceMesh Logic
function onResults(results) {
    if (canvasElement.width !== results.image.width) {
        canvasElement.width = results.image.width;
        canvasElement.height = results.image.height;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // 1. Draw Camera Feed
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // 2. Track Face Landmarks
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Landmark 1 is the tip of the nose
        const nose = landmarks[1]; 
        const x = nose.x * canvasElement.width;
        const y = nose.y * canvasElement.height;

        // Calculate face size (distance between forehead and chin)
        // to make the emoji scale as you move closer/further
        const faceSize = Math.abs(landmarks[10].y - landmarks[152].y) * canvasElement.height;

        canvasCtx.globalCompositeOperation = 'source-over';
        canvasCtx.font = `${faceSize * 2}px serif`; // Scale emoji to face size
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "middle";

        // Optional: Add rotation based on eye positions
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
        
        canvasCtx.translate(x, y);
        canvasCtx.rotate(angle);
        canvasCtx.fillText(currentEmoji, 0, 0);
    }
    canvasCtx.restore();
}

// 3. Initialize FaceMesh
const faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

// 4. Start Camera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({image: videoElement});
    }
});

setTimeout(() => {
    camera.start().catch(err => console.error("Camera Error:", err));
}, 1000);