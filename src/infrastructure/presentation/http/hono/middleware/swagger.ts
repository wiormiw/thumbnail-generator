import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import type { HonoEnv } from '../types/context';
import { env, isDevelopment } from '@/config';

const openApiConfig = {
  openapi: '3.1.0',
  info: {
    version: '1.0.0',
    title: 'Thumbnail Generator API',
    description: 'API for generating and managing thumbnails',
  },
  servers: env.API_BASE_URL
    ? [{ url: env.API_BASE_URL, description: 'API Server' }]
    : [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Development server',
        },
      ],
};

export const setupSwagger = (app: OpenAPIHono<HonoEnv>): void => {
  if (!isDevelopment()) return;

  // Serve the OpenAPI document as JSON
  app.doc('/docs-json', openApiConfig);

  // Serve Swagger UI
  app.get('/docs', swaggerUI({ url: '/docs-json' }));
};
