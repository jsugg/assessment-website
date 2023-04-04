async function submitForm() {
    // Get the values from the form inputs
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    if (name == '' || email == '') {
        alert('Please fill out the name and email fields.');
        return;
     }

    // Collect answers
    const answers = [];
    for (let i = 1; i <= 18; i++) {
        const select = document.querySelector('select[name="q' + i + '"]');
        if (select) {
            const selectedValue = select.value;
            answers.push(selectedValue);
        }
    }

    // Get the audio URLs
    const speakingRecording = document.getElementById('speaking-recording').src;
    const pronunciationRecording = document.getElementById('pronunciation-recording').src;

    // Send the form data to the server
    const response = await fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            email,
            answers,
            speakingRecording,
            pronunciationRecording,
        }),
    });

    if (response.status === 200) {
        alert('Your assessment results have been submitted!');
    } else {
        alert('There was an error submitting your assessment results. Please try again.');
    }
}

let mediaRecorder;
let recordedBlobs;

async function startRecording(id) {
    recordedBlobs = [];
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.onstop = (event) => {
        let audio = document.getElementById(`${id}-audio`);
        let recording = document.getElementById(`${id}-recording`);
        const superBuffer = new Blob(recordedBlobs, { type: 'audio/webm' });
        audio.src = window.URL.createObjectURL(superBuffer);
        recording.src = URL.createObjectURL(superBuffer);
        document.getElementById(`stop-recording-${id}`).classList.remove('enabled');
        document.getElementById(`start-recording-${id}`).classList.remove('disabled');
        document.getElementById(`${id}-audio`).style.visibility = 'visible';

    };

    mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
        }
    };

    mediaRecorder.start(30000);
    document.getElementById(`stop-recording-${id}`).classList.add('enabled');
    document.getElementById(`start-recording-${id}`).classList.add('disabled');
}

function stopRecording() {
    if (mediaRecorder) {
        mediaRecorder.stop();
    }
}