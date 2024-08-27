const axios = require('axios');

// Function to send user data to the AI service
const sendUserDataToAI = async ({ tribe, state, age, gender, duration }) => {
  try {
    // Define the API endpoint
    const apiUrl = 'http://213.199.35.161/get_mealplan/';

    // Define query parameters based on the input
    const params = {
      tribe: tribe || '',  // Ensure tribe is a string
      state: state || '',  // Ensure state is a string
      age: age || 0,       // Ensure age is an integer
      gender: gender || '',// Ensure gender is a string
      is_seven_days: duration === 'one week'  // Adjust query parameter based on duration
    };

    // Log the request details for debugging
    console.log('Sending request to AI service with params:', params);

    // Make the GET request
    const response = await axios.get(apiUrl, {
      params: params,
      headers: {
        Authorization: `Bearer ${process.env.AI_API_TOKEN}`,  // Authorization token
        Accept: 'application/json'  // Request JSON response
      }
    });

    // Log the response details for debugging
    console.log('Received response from AI service:', response.data);

    // Return the data from the response
    return response.data;

  } catch (error) {
    // Handle errors and log details
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error('Error communicating with AI service:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // No response was received from the server
      console.error('No response received from AI service:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    // Throw a custom error
    throw new Error('Failed to generate meal plan');
  }
};

module.exports = { sendUserDataToAI };
