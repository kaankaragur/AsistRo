window.onload = function() {
  var recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US'; // Set language to en-US
  recognition.continuous = true;
  recognition.interimResults = true;

  var isListening = false;
  var canToggle = true;
  var fullText = "";

  recognition.onresult = function(event) {
    event.preventDefault();
    var interimTranscript = "";
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var result = event.results[i];
      var text = result[0].transcript;
      if (result.isFinal) {
        fullText += text + " "; // Append final results to fullText
      } else {
        interimTranscript += text; // Capture interim results
      }
    }
    document.getElementById("textInput").value = fullText + interimTranscript; // Update the textbox with both interim and final results
  };

  recognition.onend = function(e) {
    e.preventDefault();
    isListening = false;
    document.getElementById("toggleButton").textContent = "Start Listening";
    document.getElementById("speechOutput").value = "Thinking..."; // Indicate waiting for result
    sendReceiveGPTCode(fullText).then(response => {
      var resultText = response.result; 
      speak(resultText).then(()=>{
        document.getElementById("speechOutput").value = resultText; // Update the second textbox with the response
      })
    }).catch(error => {
      console.error(error);
      document.getElementById("speechOutput").value = "Error retrieving result";
    });
  };

  document.getElementById("toggleButton").addEventListener("click", function(e) {
    e.preventDefault(); // Prevent the default action of the button

    if (!isListening) {
      canToggle = false;      isListening = true;
      fullText = ""; // Reset fullText for new session
      recognition.start(); // Start recognition
      this.textContent = "Listening...";
      document.getElementById("textInput").value = ""; // Clear the first textbox
      document.getElementById("speechOutput").value = ""; // Clear the second textbox
    } else {
      isListening = false;
      recognition.stop(); // Stop recognition
    }
  });
};

async function sendReceiveGPTCode(chat) {
  const url = 'http://localhost:3000/rapidAPI';  // Local endpoint
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      chat: chat
    })
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    if (result.status) {
      return result;
    } else {
      throw new Error('API response status indicates failure');
    }
  } catch (error) {
    console.error(error);
    throw new Error('Failed to retrieve result');
  }
}


// Function to speak text using Google's built-in TTS
async function speak(text) {
  // Check if the SpeechSynthesis API is available in the browser
  if ('speechSynthesis' in window) {
    // Create a new SpeechSynthesisUtterance object with the provided text
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use Google as the voice
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.name === 'Google UK English Male'); // Adjust the voice according to your preference

    // Wait for the speech to end
    utterance.onend = function() {
      console.log('Speech has finished');
    };

    // Speak the text
    window.speechSynthesis.speak(utterance);
  } else {
    console.error('Speech synthesis not supported in this browser');
  }
}



function DeleteFile(loc){

fetch('http://192.168.1.28:3000/test?filePath='+ encodeURIComponent(loc), {
  method: 'DELETE'
})
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  return response.json();
})
.then(data => {
  console.log(data); // Output: { message: 'File deleted successfully.' }
})
.catch(error => {
  console.error('Error:', error);
  ocument.getElementById("speechOutput").value = "Error";
});
}




function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}