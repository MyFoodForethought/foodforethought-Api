const axios = require('axios');
const { promisify } = require('util');

const sendUserDataToAI = async ({ tribe, state, age, gender, duration, dislikedMeals }) => {
  try {
    const apiUrl = 'http://213.199.35.161/get_mealplan/';
    
    const params = {
      tribe: String(tribe || ''),
      state: String(state || ''),
      age: Number(age || 0),
      gender: String(gender || ''),
      is_seven_days: duration === 'one week',
      disliked_meals: Array.isArray(dislikedMeals) ? dislikedMeals.join(',') : String(dislikedMeals || ''),
    };
    
    console.log('Sending request to AI service with params:', params);
    
    const timeoutPromise = promisify(setTimeout);
    
    const response = await Promise.race([
      axios.get(apiUrl, {
        params,
        headers: {
          Authorization: `Bearer ${process.env.AI_API_TOKEN}`,
          Accept: 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }),
      timeoutPromise(30000).then(() => {
        throw new Error('AI service request timed out');
      })
    ]);
    
    console.log('Received response from AI service:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error in sendUserDataToAI:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('AI service error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else if (error.request) {
        console.error('No response received from AI service:', error.request);
      } else {
        console.error('Error setting up AI service request:', error.message);
      }
    } else {
      console.error('Non-Axios error:', error.message);
    }
    
    throw new Error('Failed to generate meal plan');
  }
};

module.exports = { sendUserDataToAI };
