import { Elysia } from 'elysia';
import { thumbnailsRoutes } from './thumbnails.routes';
import { healthRoutes } from './health.routes';

export const routes = new Elysia().use(thumbnailsRoutes).use(healthRoutes);
