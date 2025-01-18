

// const axios = require('axios');

// const sendUserDataToAI = async ({ tribe, state, age, gender, duration, dislikedMeals }) => {
//   try {
//     // Log the parameters being sent
//     const params = {
//       tribe: tribe || '',  // Ensure tribe is a string
//       state: state || '',  // Ensure state is a string
//       age: age || 0,       // Ensure age is an integer
//       gender: gender || '',// Ensure gender is a string
//       is_seven_days: duration === 'one week',  // Adjust query parameter based on duration
//       disliked_meals: dislikedMeals || '', 
//     };

//     // Handle dislikedMeals differently - if it's null/undefined, don't include it at all
//     if (dislikedMeals !== null && dislikedMeals !== undefined) {
//       // If it's an empty string, convert to a space to satisfy the API requirement
//       params.disliked_meals = dislikedMeals.trim() === '' ? ' ' : dislikedMeals;
//     }
    
//     console.log('Sending request to AI service with params:', params);
    
//     const response = await axios.get('http://213.199.35.161/get_mealplan/', {
//       params,
//       headers: {
//         Authorization: `Bearer ${process.env.AI_API_TOKEN}`,
//         Accept: 'application/json'
//       },
//       timeout: 120000
//     });
    
//     console.log('Received response from AI service:', response.data);
    
//     return response.data;
//   } catch (error) {
//     console.error('Error in sendUserDataToAI:', error);
    
//     if (axios.isAxiosError(error)) {
//       if (error.response) {
//         console.error('AI service error response:', {
//           status: error.response.status,
//           data: error.response.data,
//           headers: error.response.headers,
//         });
//       } else if (error.request) {
//         console.error('No response received from AI service:', error.request);
//       } else {
//         console.error('Error setting up AI service request:', error.message);
//       }
//     } else {
//       console.error('Non-Axios error:', error.message);
//     }
    
//     throw new Error('Failed to generate meal plan');
//   }
// };

// module.exports = { sendUserDataToAI };






const axios = require('axios');

const sendUserDataToAI = async ({ tribe, state, age, gender, duration, dislikedMeals }) => {
  try {
    const params = {
      tribe: tribe || '',
      state: state || '',
      age: age || 0,
      gender: gender || '',
      is_seven_days: duration === 'one week',
      disliked_meals: dislikedMeals || '', 
    };

    // Handle dislikedMeals
    if (dislikedMeals !== null && dislikedMeals !== undefined) {
      params.disliked_meals = dislikedMeals.trim() === '' ? ' ' : dislikedMeals;
    }
    
    console.log('Sending request to AI service with params:', params);
    
    // Create Axios instance with custom config
    const aiService = axios.create({
      baseURL: 'http://213.199.35.161',
      timeout: 180000, // Increased timeout to 3 minutes
      headers: {
        'Authorization': `Bearer ${process.env.AI_API_TOKEN}`,
        'Accept': 'application/json'
      },
      // Add retry logic
      validateStatus: status => status < 500,
      maxRedirects: 5,
      maxContentLength: 50 * 1000 * 1000, // 50MB
      httpsAgent: new (require('https').Agent)({ 
        keepAlive: true,
        keepAliveMsecs: 60000,
        timeout: 180000,
        maxSockets: 10
      })
    });

    // Add request interceptor for logging
    aiService.interceptors.request.use(request => {
      console.log('Starting AI service request:', {
        url: request.url,
        method: request.method,
        params: request.params,
        timestamp: new Date().toISOString()
      });
      return request;
    });

    // Add response interceptor for logging
    aiService.interceptors.response.use(
      response => {
        console.log('AI service response received:', {
          status: response.status,
          timestamp: new Date().toISOString()
        });
        return response;
      },
      error => {
        console.error('AI service error:', {
          status: error.response?.status,
          message: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    );
    
    const response = await aiService.get('/get_mealplan/', { params });
    
    if (!response.data) {
      throw new Error('Empty response from AI service');
    }
    
    console.log('Received response from AI service:', {
      status: response.status,
      dataSize: JSON.stringify(response.data).length
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in sendUserDataToAI:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('AI service error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
        
        // Handle specific status codes
        if (error.response.status === 502) {
          throw new Error('AI service temporarily unavailable. Please try again in a few minutes.');
        }
        if (error.response.status === 504) {
          throw new Error('AI service request timed out. Please try again.');
        }
      } else if (error.request) {
        console.error('No response received:', {
          request: {
            method: error.request.method,
            path: error.request.path,
            headers: error.request.getHeaders()
          }
        });
        throw new Error('Unable to reach AI service. Please try again later.');
      }
    }
    
    throw new Error('Failed to generate meal plan: ' + error.message);
  }
};

module.exports = { sendUserDataToAI };