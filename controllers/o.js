router.get('/verify-email', (req, res, next) => {
    console.log('Verify email route hit at:', new Date().toISOString());
    console.log('Query parameters:', req.query);
    next();
  }, verifyEmail);