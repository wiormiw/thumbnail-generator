import type { DIContainer } from '@/index';
import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';

/**
 * Shared app context type
 * Used with .decorate<AppContext>() to add typed context to routes
 */
export interface AppContext {
  handleResult: <T>(result: Result<T, BaseError>) => { success: true; requestId: string; data: T };
  di: DIContainer;
}
