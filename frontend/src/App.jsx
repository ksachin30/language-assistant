// App.jsx (in your frontend/src folder)
import React from 'react';

// We will create these two components next
import GrammarChecker from './GrammarChecker';
import PronunciationChecker from './PronunciationChecker';

function App() {
  const appStyles = {
    fontFamily: 'sans-serif',
    maxWidth: '800px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  };

  const headerStyles = {
    textAlign: 'center',
    color: '#333',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
    marginBottom: '20px',
  };

  return (
    <div style={appStyles}>
      <h1 style={headerStyles}>AI Language Learning Assistant</h1>
      <GrammarChecker />
      <PronunciationChecker />
    </div>
  );
}

export default App;