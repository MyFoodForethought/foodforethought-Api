// __tests__/controllers/userController.test.js

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { verifyEmail, register, login, editUser, deleteAccount } = require('../../controllers/user');
const { sendVerificationEmail, sendLoginVerificationEmail } = require('../../services/emailService');

// Mock all dependencies first
jest.mock('mongoose');
jest.mock('jsonwebtoken');
jest.mock('../../services/emailService');
jest.mock('../../models/mealPlan');

// Mock the User model
jest.mock('../../models/user', () => ({
  User: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    collection: {
      drop: jest.fn()
    },
    prototype: {
      save: jest.fn()
    }
  },
  Feedback: {
    create: jest.fn(),
    find: jest.fn()
  }
}));

// After all mocks, import the actual modules
const userController = require('../../controllers/user');
const emailService = require('../../services/emailService');
const { User } = require('../../models/user');
const { MealPlan } = require('../../models/mealPlan');

describe('User Controller Tests', () => {
  let mockRequest;
  let mockResponse;
  let mockSession;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      query: {},
      headers: {},
      user: 'test@example.com'
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn()
    };

    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };

    // Setup mongoose session mock
    mongoose.startSession.mockResolvedValue(mockSession);
    
    // Mock the User model methods
    User.findOne = jest.fn();
    User.deleteOne = jest.fn();
    User.prototype.save = jest.fn();

    // Mock the MealPlan model methods
    MealPlan.deleteMany = jest.fn();
    MealPlan.find = jest.fn();

    // Mock console to suppress errors in tests
    console.error = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        email: 'test@example.com',
        fullName: 'Test User',
        save: jest.fn().mockResolvedValue(true)
      };

      mockRequest.body = {
        email: 'test@example.com',
        fullName: 'Test User'
      };

      User.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(null)
      });
      User.prototype.save.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue();

      await userController.register(mockRequest, mockResponse);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Please verify your email to complete registration.'
        })
      );
    });

    it('should handle existing unverified user', async () => {
      const mockUser = {
        email: 'test@example.com',
        isVerified: false,
        save: jest.fn().mockResolvedValue(true)
      };

      mockRequest.body = {
        email: 'test@example.com',
        fullName: 'Test User'
      };

      User.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockUser)
      });
      emailService.sendVerificationEmail.mockResolvedValue();

      await userController.register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'A new verification email has been sent to your email address.'
        })
      );
    });

    it('should handle registration error', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        fullName: 'Test User'
      };

      mockUserModel.findOne.mockRejectedValue(new Error('Database error'));

      await userController.register(mockRequest, mockResponse);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to register user'
        })
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUser = {
        isVerified: false,
        verificationToken: 'valid-token',
        save: jest.fn().mockResolvedValue(true)
      };

      mockRequest.query = { token: 'valid-token' };

      mockUserModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockUser)
      });

      jwt.sign.mockReturnValue('mock-jwt-token');

      await userController.verifyEmail(mockRequest, mockResponse);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.verificationToken).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalled();
    });

    it('should handle invalid token', async () => {
      mockRequest.query = { token: 'invalid-token' };

      mockUserModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(null)
      });

      await userController.verifyEmail(mockRequest, mockResponse);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid token or already verified'
        })
      );
    });
  });

  describe('login', () => {
    it('should send login verification email successfully', async () => {
      const mockUser = {
        email: 'test@example.com',
        isVerified: true
      };

      mockRequest.body = { email: 'test@example.com' };
      
      User.findOne.mockResolvedValue(mockUser);
      emailService.sendLoginVerificationEmail.mockResolvedValue();

      await userController.login(mockRequest, mockResponse);

      expect(emailService.sendLoginVerificationEmail).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Verification email sent. Please check your email to log in.'
        })
      );
    });

    it('should handle non-existent user', async () => {
      mockRequest.body = { email: 'nonexistent@example.com' };
      
      User.findOne.mockResolvedValue(null);

      await userController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User does not exist. Please register.'
        })
      );
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      jwt.verify.mockReturnValue({ email: 'test@example.com' });
      User.findOne.mockResolvedValue(mockUser);
      MealPlan.deleteMany.mockResolvedValue({ deletedCount: 1 });
      User.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await userController.deleteAccount(mockRequest, mockResponse);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(MealPlan.deleteMany).toHaveBeenCalled();
      expect(User.deleteOne).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Account deleted successfully'
      });
    });

    it('should handle missing token', async () => {
      mockRequest.headers = {};

      await userController.deleteAccount(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No token provided'
      });
    });
  });
});