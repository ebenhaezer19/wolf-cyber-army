const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wolf Cyber Army API',
      version: '1.0.0',
      description: 'API documentation for Wolf Cyber Army Forum (for educational & security research only).',
      contact: {
        name: 'Wolf Cyber Army',
      },
    },
    servers: [
      {
        url: 'http://localhost:5002',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // Scan route files for swagger comments
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
