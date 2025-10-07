// GrammarChecker.jsx (in your frontend/src folder)
import React, { useState } from 'react';
import axios from 'axios';

function GrammarChecker() {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkGrammar = async () => {
    setLoading(true);
    setErrors([]);
    try {
      // This sends the text to our backend server!
      const response = await axios.post('http://localhost:3001/api/check-grammar', { text });
      setErrors(response.data.matches);
    } catch (error) {
      console.error("There was an error checking grammar:", error);
      alert("Could not connect to the server. Is it running?");
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: '40px' }}>
      <h2>Grammar Checker</h2>
      <p>Type a sentence and we'll check it for you.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your text here..."
        style={{ width: '100%', minHeight: '100px', padding: '10px', boxSizing: 'border-box' }}
      />
      <button onClick={checkGrammar} disabled={loading} style={{ marginTop: '10px' }}>
        {loading ? 'Checking...' : 'Check My Grammar'}
      </button>

      {errors.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Suggestions:</h3>
          {errors.map((error, index) => (
            <div key={index} style={{ border: '1px solid #ffcccb', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
              <p><strong>Error:</strong> {error.message}</p>
              <p><strong>Suggestion:</strong> {error.replacements[0]?.value || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GrammarChecker;