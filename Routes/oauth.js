const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // 'http://localhost:3000/oauth2callback' 
  'https://foodforethought.up.railway.app/oauth2callback'// Ensure this matches the redirect URI in your Google API Console
);

router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Log tokens to verify they are received
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    // Store tokens securely (e.g., in a session or database)
    req.session.tokens = tokens;

    // Redirect after successful authorization
    res.redirect('/');
  } catch (error) {
    console.error('Error during OAuth callback:', error.message);
    res.status(500).send(`Error during OAuth callback: ${error.message}`);
  }
});

module.exports = router;
