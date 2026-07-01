import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';
import { swaggerSchemas } from '../shared/schemas/swagger-schemas';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Bebang Sistem Informasi API',
            version: '1.0.0',
            description: 'API Documentation for Employee Management System',
        },
        servers: [
            {
                url: `http://localhost:${env.port}/api`,
                description: 'Development Server',
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
            schemas: swaggerSchemas,
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        './src/modules/*/routes/*.ts',
        './src/modules/*/docs/*.ts', // Separate doc files support
    ],
};

const specs = swaggerJsdoc(options);

export default specs;
