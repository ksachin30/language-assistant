// index.js (in your backend folder)

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001; // Port for our backend server

// Middleware to allow our frontend to talk to our backend
app.use(cors());
// Middleware to parse JSON data from requests
app.use(express.json());

// This is our API endpoint for checking grammar
// An endpoint is like a specific URL our app can send requests to
app.post('/api/check-grammar', async (req, res) => {
  try {
    const { text } = req.body; // Get the text from the frontend's request

    // We use 'axios' to send this text to the LanguageTool API
    const response = await axios.post(
      `https://api.languagetoolplus.com/v2/check`,
      `language=en-US&text=${encodeURIComponent(text)}`
    );

    // Send the corrections back to our frontend
    res.json(response.data);

  } catch (error) {
    console.error('Error checking grammar:', error);
    res.status(500).json({ message: 'Error checking grammar' });
  }
});

// Start the server and listen for requests
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});