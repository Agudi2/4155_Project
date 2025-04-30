const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const statusDisplay = document.getElementById('status');
const emotionDisplay = document.getElementById('emotion');
const confidenceDisplay = document.getElementById('confidence');
const detailsDisplay = document.getElementById('details');

let emotionChart = null;

let predictionInProgress = false;

navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        video.srcObject = stream;
        captureBtn.disabled = false;
        statusDisplay.textContent = 'Webcam ready. Click "Start Prediction" to begin.';
    })
    .catch((err) => {
        console.error("Error accessing webcam:", err);
        statusDisplay.textContent = 'Error accessing webcam.';
    });

function createEmotionChart() {
    const ctx = document.getElementById('emotionChart').getContext('2d');
    emotionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral'],
            datasets: [{
                label: 'Emotion Scores (%)',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',   // Angry
                    'rgba(153, 102, 255, 0.6)',  // Disgust
                    'rgba(255, 159, 64, 0.6)',   // Fear
                    'rgba(75, 192, 192, 0.6)',   // Happy
                    'rgba(54, 162, 235, 0.6)',   // Sad
                    'rgba(255, 206, 86, 0.6)',   // Surprise
                    'rgba(201, 203, 207, 0.6)'   // Neutral
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateEmotionChart(details) {
    if (!emotionChart) return;

    emotionChart.data.datasets[0].data = [
        details.angry || 0,
        details.disgust || 0,
        details.fear || 0,
        details.happy || 0,
        details.sad || 0,
        details.surprise || 0,
        details.neutral || 0
    ];
    emotionChart.update();
}

async function captureAndPredict() {
    statusDisplay.textContent = 'Capturing...';

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');

    try {
        statusDisplay.textContent = 'Sending for prediction...';
        const response = await fetch('http://127.0.0.1:5000/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Received prediction data:', data);

        if (data.error) {
            statusDisplay.textContent = 'Error: ' + (data.error || 'Unknown error.');
            emotionDisplay.textContent = '---';
            confidenceDisplay.textContent = '---';
            detailsDisplay.textContent = 'No details available.';
            updateEmotionChart({ angry: 0, disgust: 0, fear: 0, happy: 0, sad: 0, surprise: 0, neutral: 0 });
        } else {
            statusDisplay.textContent = 'Prediction received.';
            emotionDisplay.textContent = data.emotion || 'N/A';
            confidenceDisplay.textContent = (data.confidence !== undefined)
                ? `${parseFloat(data.confidence).toFixed(2)}%`
                : '---';

            let detailsText = 'Emotion Scores:\n';
            if (data.details && typeof data.details === 'object') {
                for (const [emotion, score] of Object.entries(data.details)) {
                    detailsText += `${emotion}: ${parseFloat(score).toFixed(2)}%\n`;
                }
                updateEmotionChart(data.details);
            } else {
                detailsText += 'No details available.';
                updateEmotionChart({ angry: 0, disgust: 0, fear: 0, happy: 0, sad: 0, surprise: 0, neutral: 0 });
            }
            detailsDisplay.textContent = detailsText;
        }
    } catch (error) {
        console.error('Error during prediction:', error);
        statusDisplay.textContent = 'Prediction failed: ' + (error.message || error);
        emotionDisplay.textContent = '---';
        confidenceDisplay.textContent = '---';
        detailsDisplay.textContent = 'No details available.';
        updateEmotionChart({ angry: 0, disgust: 0, fear: 0, happy: 0, sad: 0, surprise: 0, neutral: 0 });
    }
}


function startAutoPredict() {
    autoPredictInterval = setInterval(async () => {
      if (!predictionInProgress) {
        predictionInProgress = true;
        await captureAndPredict();
        predictionInProgress = false;
      }
    }, 2000);
  }
function stopAutoPredict() {
    if (autoPredictInterval) {
      clearInterval(autoPredictInterval);
      autoPredictInterval = null;
      statusDisplay.textContent = 'Auto-prediction stopped.';
    }
  }

captureBtn.addEventListener('click', () => {
    startAutoPredict();
    captureBtn.disabled = true;
    stopBtn.disabled = false;
    statusDisplay.textContent = 'Auto-prediction started!';
  });

stopBtn.addEventListener('click', () => {
    stopAutoPredict();
    captureBtn.disabled = false;
    stopBtn.disabled = true;
});

createEmotionChart();




