const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const statusDisplay = document.getElementById('status');
const emotionDisplay = document.getElementById('emotion');
const confidenceDisplay = document.getElementById('confidence');
const detailsDisplay = document.getElementById('details');
const captureBtn = document.getElementById('captureBtn');


const API_URL = 'http://localhost:5000/api/predict'; 

let intervalId = null;
let isPredicting = false;

async function setupWebcam() {
    statusDisplay.textContent = 'Requesting webcam access...';
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            statusDisplay.textContent = 'Webcam ready. Click button to start.';
            captureBtn.disabled = false;
        };
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        statusDisplay.textContent = 'Error accessing webcam. Please allow access and refresh.';
        alert('Error accessing webcam: ' + err.message);
    }
}

async function captureAndPredict() {
    if (!video.srcObject) return; 

    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    
    const imageData = canvas.toDataURL('image/jpeg', 0.8); 

    statusDisplay.textContent = 'Sending frame...';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
             statusDisplay.textContent = `Error: ${data.error}`;
             emotionDisplay.textContent = 'Error';
             confidenceDisplay.textContent = '---';
             detailsDisplay.textContent = '';
        } else {
            statusDisplay.textContent = 'Prediction received.';
            emotionDisplay.textContent = data.emotion || 'N/A';
            confidenceDisplay.textContent = data.confidence ? `${(data.confidence).toFixed(2)}%` : '---';

            let detailsText = 'Emotion Scores:\n';
            if (data.details && typeof data.details === 'object') {
                for (const [emotion, score] of Object.entries(data.details)) {
                    detailsText += `${emotion}: ${score.toFixed(2)}%\n`;
                }
            } else {
                detailsText += 'No details available.';
            }
             detailsDisplay.textContent = detailsText;
        }

    } catch (error) {
        console.error('Error sending/receiving prediction:', error);
        statusDisplay.textContent = `Error: ${error.message}. Check console & backend.`;
        emotionDisplay.textContent = 'Error';
        confidenceDisplay.textContent = '---';
        detailsDisplay.textContent = '';
        togglePrediction();
    }
}

function togglePrediction() {
    if (isPredicting) {
        clearInterval(intervalId);
        intervalId = null;
        isPredicting = false;
        captureBtn.textContent = 'Start Prediction';
        statusDisplay.textContent = 'Prediction stopped.';
    } else {
        
        intervalId = setInterval(captureAndPredict, 1000); 
        isPredicting = true;
        captureBtn.textContent = 'Stop Prediction';
        statusDisplay.textContent = 'Prediction started...';
        captureAndPredict(); 
    }
}


captureBtn.addEventListener('click', togglePrediction);


setupWebcam();


window.addEventListener('beforeunload', () => {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    if (intervalId) {
        clearInterval(intervalId);
    }
});