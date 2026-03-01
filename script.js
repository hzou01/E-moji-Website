const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const emojiDisplay = document.getElementById('emoji-display');
const spinBtn = document.getElementById('spin-button');

// 1. Identity Data
const identities = ['🐶', '🐱', '🦊', '🐼', '🤖', '👽', '👻', '🎭', '🛡️', '👤', '🦁', '🐷', '🐸', '🐵', '🦄'];
let currentEmoji = '👤';

// 2. Randomizer Logic
spinBtn.addEventListener('click', () => {
    let spins = 0;
    spinBtn.disabled = true;
    spinBtn.innerText = "SEARCHING...";

    const interval = setInterval(() => {
        currentEmoji = identities[Math.floor(Math.random() * identities.length)];
        emojiDisplay.innerText = currentEmoji;
        
        spins++;
        if (spins > 12) {
            clearInterval(interval);
            spinBtn.disabled = false;
            spinBtn.innerText = "RANDOMIZE IDENTITY";
        }
    }, 70);
});

// 3. Face Mesh Setup (The "Brain")
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

// 4. The Render Loop
function onResults(results) {
    // Sync canvas size to video feed
    canvasElement.width = results.image.width;
    canvasElement.height = results.image.height;

    canvasCtx.save();
    
    // Clear and Draw the live webcam frame
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // If a face is found, pin the emoji
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Landmark 1 is the tip of the nose
        const x = landmarks[1].x * canvasElement.width;
        const y = landmarks[1].y * canvasElement.height;

        // Scale based on face height
        const faceSize = Math.abs(landmarks[10].y - landmarks[152].y) * canvasElement.height;
        
        // Calculate Rotation (tilt)
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

        canvasCtx.translate(x, y);
        canvasCtx.rotate(angle);
        
        canvasCtx.font = `${faceSize * 2.8}px serif`;
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "middle";
        
        canvasCtx.fillText(currentEmoji, 0, 0);
    }
    canvasCtx.restore();
}

// 5. Camera Initialization (The Fix)
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({image: videoElement});
    },
    width: 1280,
    height: 720
});

// We add a small delay and a catch block to ensure the camera starts
window.onload = () => {
    camera.start().catch(err => {
        console.error("Camera failed:", err);
        document.getElementById('status-tag').innerText = "ERROR: CAMERA BLOCKED";
    });
};