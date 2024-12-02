// __tests__/controllers/mealPlanController.test.js

const jwt = require('jsonwebtoken');
const { generateMealPlan, getPastMealPlans, regenerateMealPlan } = require('../../controllers/mealPlanController');
const { User } = require('../../models/user');
const { MealPlan } = require('../../models/mealPlan');
const { sendMealPlanNotification } = require('../../services/emailService');
const { sendUserDataToAI } = require('../../services/aiServices');

jest.mock('../../models/user');
jest.mock('../../models/mealPlan');
jest.mock('../../services/emailService');
jest.mock('../../services/aiServices');
jest.mock('jsonwebtoken');

describe('MealPlan Controller Tests', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      headers: {},
      user: 'test@example.com',
      session: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    // Clear console mocks
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMealPlan', () => {
    it('should generate meal plan for authenticated user', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        tribe: 'Yoruba',
        state: 'Lagos'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      mockRequest.body = {
        duration: '7days',
        tribe: 'Yoruba',
        state: 'Lagos'
      };

      // Mock the jwt.verify to return a valid decoded token
      jwt.verify = jest.fn().mockReturnValue({ email: 'test@example.com' });
      
      // Mock User.findOne to return a user
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      User.findOneAndUpdate = jest.fn().mockResolvedValue(mockUser);
      
      // Mock AI service response
      sendUserDataToAI.mockResolvedValue({ mealPlan: 'Generated meal plan' });
      
      // Mock MealPlan creation and save
      const mockSavedMealPlan = {
        userId: 'user-id',
        duration: '7days',
        plan: 'Generated meal plan'
      };
      MealPlan.prototype.save = jest.fn().mockResolvedValue(mockSavedMealPlan);
      
      // Mock notification
      sendMealPlanNotification.mockResolvedValue();

      await generateMealPlan(mockRequest, mockResponse);

      expect(jwt.verify).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalled();
      expect(sendUserDataToAI).toHaveBeenCalled();
      expect(MealPlan.prototype.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          mealPlan: expect.any(Object),
          token: expect.any(String)
        })
      );
    });

    it('should handle free trial for non-authenticated users', async () => {
      mockRequest.headers = {};
      mockRequest.body = {
        duration: '7days',
        tribe: 'Yoruba',
        state: 'Lagos'
      };
      mockRequest.session.mealPlans = 0;

      sendUserDataToAI.mockResolvedValue({ mealPlan: 'Generated meal plan' });
      MealPlan.prototype.save = jest.fn().mockResolvedValue({
        duration: '7days',
        plan: 'Generated meal plan'
      });

      await generateMealPlan(mockRequest, mockResponse);

      expect(mockRequest.session.mealPlans).toBe(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ mealPlan: expect.any(Object) })
      );
    });

    it('should reject users who exceed free trial limit', async () => {
      mockRequest.headers = {};
      mockRequest.session.mealPlans = 2;

      await generateMealPlan(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Sign up required to generate more meal plans'
      });
    });

    it('should handle invalid authentication token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await generateMealPlan(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token'
      });
    });
  });

  describe('getPastMealPlans', () => {
    it('should retrieve user\'s past meal plans', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com'
      };

      const mockMealPlans = [
        { _id: 'plan1', duration: '7days' },
        { _id: 'plan2', duration: '14days' }
      ];

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      MealPlan.find = jest.fn().mockResolvedValue(mockMealPlans);

      await getPastMealPlans(mockRequest, mockResponse);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(MealPlan.find).toHaveBeenCalledWith({ userId: mockUser._id });
      expect(mockResponse.json).toHaveBeenCalledWith(mockMealPlans);
    });

    it('should handle user not found error', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await getPastMealPlans(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });

    it('should handle database errors', async () => {
      User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      await getPastMealPlans(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to retrieve meal plans'
      });
    });
  });

  describe('regenerateMealPlan', () => {
    it('should regenerate existing meal plan', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        tribe: 'Yoruba',
        state: 'Lagos'
      };

      const mockMealPlan = {
        _id: 'plan-id',
        duration: '7days',
        save: jest.fn().mockResolvedValue(true)
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      mockRequest.params = {
        mealPlanId: 'plan-id'
      };

      jwt.verify = jest.fn().mockReturnValue({ email: 'test@example.com' });
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      MealPlan.findById = jest.fn().mockResolvedValue(mockMealPlan);
      sendUserDataToAI.mockResolvedValue({ mealPlan: 'Regenerated meal plan' });
      sendMealPlanNotification.mockResolvedValue();

      await regenerateMealPlan(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ mealPlan: expect.any(Object) })
      );
    });

    it('should handle meal plan not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      mockRequest.params = {
        mealPlanId: 'nonexistent-id'
      };

      jwt.verify = jest.fn().mockReturnValue({ email: 'test@example.com' });
      User.findOne = jest.fn().mockResolvedValue({ email: 'test@example.com' });
      MealPlan.findById = jest.fn().mockResolvedValue(null);

      await regenerateMealPlan(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Meal plan not found'
      });
    });

    it('should handle unauthorized access', async () => {
      mockRequest.headers = {};

      await regenerateMealPlan(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
    });
  });
});