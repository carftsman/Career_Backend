const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Career Backend API",
      version: "1.0.0",
      description: "API documentation for Career Backend"
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
      {
        url: "https://career-backend-hwnq.onrender.com",
        description: "Render Production Server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./src/modules/**/*.js"]
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};