const express = require('express');
const path = require('path'); 
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Swagger definition options
const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'FoodForThought API',
      version: '1.0.0',
      description: 'API documentation for the FoodForThought application',
    },
    servers: [
      {
        url: 'https://foodforethought-api-production.up.railway.app/api',
      },
    ],
  },
  apis: [path.join(__dirname, 'Routes', 'route.js')], // Path to the API docs
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsDoc(options);

// Set up Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Sample route for testing
app.get('/api/test', (req, res) => {
  res.send('API is working!');
});

// Start the server
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on https://foodforethought-api-production.up.railway.app:${PORT}`);
});
