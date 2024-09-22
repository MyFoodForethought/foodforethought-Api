
// require('dotenv').config({ path: '.env' });
// const request = require('supertest');
// const app = require('../app'); // Your Express app
// const mongoose = require('mongoose');
// const { User } = require('../models/user');
// const { MealPlan } = require('../models/mealPlan');
// const { sendVerificationEmail } = require('../services/emailService'); // Adjust path as necessary

// jest.mock('../services/emailService'); // Mock email service

// describe('User Controller Tests', () => {
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

//   test('should register a user', async () => {
//     sendVerificationEmail.mockResolvedValue(); // Mock email service response

//     const response = await request(server)
//       .post('/reg/user')
//       .send({
//         fullName: 'Test User',
//         email: 'test@example.com',
//         weight: 70,
//         height: 175,
//         age: 30,
//         dietaryNeeds: 'none',
//         dislikedMeals: 'test meals',
//         duration: 1,
//         tribe: 'Test Tribe',
//         state: 'Test State',
//         gender: 'male',
//       });

//     expect(response.status).toBe(200);
//     expect(response.body.message).toBe('Please verify your email to complete registration.');
//     expect(sendVerificationEmail).toHaveBeenCalledWith(expect.any(Object), 'test@example.com'); // Check if email was sent
//   });

//   test('should verify email', async () => {
//     const user = new User({
//       fullName: 'Test User',
//       email: 'test@example.com',
//       weight: 70,
//       height: 175,
//       age: 30,
//       dietaryNeeds: 'none',
//       dislikedMeals: 'test meals',
//       duration: 1,
//       tribe: 'Test Tribe',
//       state: 'Test State',
//       gender: 'male',
//       verificationToken: 'some-token',
//     });
//     await user.save();

//     const response = await request(server)
//       .get('/verify-email?token=some-token');

//     expect(response.status).toBe(200);
//     expect(response.body.message).toBe('Email verified successfully');
//   });

//   // Add more tests for login, Google login, and editing user as needed
// });
