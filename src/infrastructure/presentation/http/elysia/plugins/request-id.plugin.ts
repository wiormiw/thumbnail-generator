import { Elysia } from 'elysia';

const requestIdPlugin = new Elysia({ name: 'plugin:request-id' })
  .derive(({ request }) => {
    // Avoid optional chaining and conditional shape - always create requestId
    const existingId = request.headers.get('x-request-id');
    const requestId = existingId !== null ? existingId : crypto.randomUUID();

    return {
      requestId,
    };
  })
  .onBeforeHandle(({ set, requestId }) => {
    set.headers['x-request-id'] = requestId;
  });

export { requestIdPlugin };
