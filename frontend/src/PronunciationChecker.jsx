// frontend/src/PronunciationChecker.jsx

import React, { useState } from 'react';

function PronunciationChecker() {
  const sentenceToSpeak = "The quick brown fox jumps over the lazy dog";
  const [transcribedText, setTranscribedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  // State is now an object to hold both text and color
  const [feedback, setFeedback] = useState({ text: '', color: '' });

  const handleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support Speech Recognition.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);
    setFeedback({ text: '', color: '' });
    setTranscribedText('Listening...');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscribedText(`You said: "${transcript}"`);
      if (transcript.toLowerCase().includes(sentenceToSpeak.toLowerCase().substring(0,20))) {
        // Set feedback to green for correct answers
        setFeedback({ text: 'Great job! ✅', color: 'green' });
      } else {
        // Set feedback to red for incorrect answers
        setFeedback({ text: 'Not quite, try again! ❌', color: 'red' });
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setTranscribedText('');
      setFeedback({ text: 'Sorry, I could not hear you. Please try again.', color: 'red' });
      setIsListening(false);
    };
  };

  const containerStyles = {
    border: '1px solid #eee',
    padding: '20px',
    borderRadius: '8px',
  };
  
  const buttonStyles = {
    padding: '10px 15px',
    border: 'none',
    backgroundColor: isListening ? '#ccc' : '#28a745', // Green color
    color: 'white',
    borderRadius: '5px',
    cursor: isListening ? 'not-allowed' : 'pointer',
    fontSize: '16px',
  };

  const feedbackStyles = {
    marginTop: '20px',
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: feedback.color, // Color is now dynamic
    transition: 'all 0.5s ease', // Smooth transition for the color change
    opacity: feedback.text ? 1 : 0, // Makes the text fade in
  };

  return (
    <div style={containerStyles}>
      <h2>Pronunciation Practice</h2>
      <p>Click the button and say the following sentence:</p>
      <p style={{ fontStyle: 'italic', background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
        "{sentenceToSpeak}"
      </p>
      <button 
        onClick={handleListen} 
        disabled={isListening} 
        style={buttonStyles}
      >
        {isListening ? 'Listening...' : 'Start Recording'}
      </button>
      <div style={{ marginTop: '20px' }}>
        <p>{transcribedText}</p>
        <p style={feedbackStyles}>{feedback.text}</p>
      </div>
    </div>
  );
}

export default PronunciationChecker;