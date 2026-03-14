#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

// Lê o prompt do arquivo
const promptFile = process.argv[2] || './board-prompt.md';
const prompt = fs.readFileSync(promptFile, 'utf8');

// Usaremos o Gemini API via um request simples
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

const requestBody = JSON.stringify({
  contents: [
    {
      parts: [
        {
          text: prompt
        }
      ]
    }
  ]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-2.0-flash-lite-preview:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestBody)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
          const text = response.candidates[0].content.parts[0].text;
          console.log(text);
        } else {
          console.error('Unexpected response structure:', JSON.stringify(response, null, 2));
        }
      } catch (e) {
        console.error('Failed to parse response:', e.message);
        console.log('Raw response:', data);
      }
    } else {
      console.error(`API returned status ${res.statusCode}`);
      console.error('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
  process.exit(1);
});

req.write(requestBody);
req.end();
