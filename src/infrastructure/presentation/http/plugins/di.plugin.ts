import { Elysia } from 'elysia';
import type { DIContainer } from '@/index';

const diPlugin = new Elysia({ name: 'plugin:di' }).resolve((context) => {
  const ctx = context as unknown as { di: DIContainer };
  return {
    useCase: ctx.di.getThumbnailsUseCase(),
  };
});

export { diPlugin };
