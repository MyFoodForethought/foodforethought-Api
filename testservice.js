const { google } = require('googleapis');
require('dotenv').config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback' // Redirect URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

async function getAccessToken() {
  try {
    const { token } = await oAuth2Client.getAccessToken();
    console.log('Access Token:', token);
  } catch (error) {
    console.error('Error getting access token:', error);
  }
}

getAccessToken();
