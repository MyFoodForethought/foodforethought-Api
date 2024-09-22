
// require('dotenv').config({ path: '.env' });
// const request = require('supertest');
// const app = require('../app');
// const mongoose = require('mongoose');
// const { User } = require('../models/user');
// const { MealPlan } = require('../models/mealPlan');
// const { sendUserDataToAI } = require('../services/aiServices'); // Adjust path as necessary
// const { sendVerificationEmail } = require('../services/emailService'); // Adjust path as necessary

// jest.mock('../services/aiServices'); // Mock AI service
// jest.mock('../services/emailService'); // Mock email service

// describe('Meal Plan Controller Tests', () => {
//   let server;
//   let isConnected;

//   const PORT = process.env.TEST_PORT || 3001; 

//   beforeAll(async () => {
//     if (!isConnected) {
//       await mongoose.connect(process.env.TEST_MONGO_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       });
//       isConnected = true;
//     }
//     server = app.listen(PORT);
//   });

//   afterAll(async () => {
//     await server.close();
//     await mongoose.connection.close();
//   });

//   beforeEach(async () => {
//     await User.deleteMany({});
//     await MealPlan.deleteMany({});
//   });

//   test('should generate meal plan for authenticated user', async () => {
//     const user = new User({
//       email: 'test@example.com',
//       fullName: 'Test User',
//       tribe: 'Test Tribe',
//       state: 'Test State',
//       age: 30,
//       gender: 'male',
//       duration: 1,
//       dislikedMeals: 'test meals',
//     });
//     await user.save();

//     const token = user.generateAuthToken(); // Adjust this to match your token generation method

//     sendUserDataToAI.mockResolvedValue({ plan: 'mocked meal plan' }); // Mock AI service response

//     const response = await request(server)
//       .post('/get/generate-meal-plans')
//       .set('Authorization', `Bearer ${token}`)
//       .send({
//         tribe: 'Test Tribe',
//         state: 'Test State',
//         age: 30,
//         gender: 'male',
//         dislikedMeals: 'test meals',
//         duration: 1,
//       });

//     expect(response.status).toBe(200);
//     expect(response.body.mealPlan).toEqual('mocked meal plan'); // Check mocked response
//   });

//   // Add more tests for non-authenticated user meal plan generation and past plans retrieval
// });
