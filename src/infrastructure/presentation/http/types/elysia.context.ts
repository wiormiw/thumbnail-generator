import type { DIContainer } from '@/index';
import type { ThumbnailsUseCase } from '@/application/thumbnails';
import type { ResultHandler } from '../plugins/result-handler.plugin';

/**
 * Base Elysia context with decorated properties
 * These types describe what properties are added to the Elysia context
 * by various plugins and decorators.
 */

/**
 * Properties added by requestIdPlugin
 */
interface RequestIdDecorations {
  requestId: string;
}

/**
 * Properties added by diPlugin
 */
interface DIDecorations {
  di: DIContainer;
  useCase: ThumbnailsUseCase;
}

/**
 * Properties added by resultHandlerPlugin
 */
type ResultHandlerDecorations = ResultHandler;

/**
 * Properties available in error handler context
 */
interface ErrorHandlerDecorations extends RequestIdDecorations {
  code: string;
  error: Error | unknown;
  set: {
    status: number | string;
    headers: Record<string, string>;
  };
}

/**
 * Properties available in request hooks
 */
interface RequestHookDecorations extends RequestIdDecorations {
  request: Request;
}

/**
 * Properties available in afterHandle hooks
 */
interface AfterHandleDecorations extends RequestIdDecorations {
  request: Request;
  set: {
    status: number | string;
    headers: Record<string, string>;
  };
}

export type {
  RequestIdDecorations,
  DIDecorations,
  ResultHandlerDecorations,
  ErrorHandlerDecorations,
  RequestHookDecorations,
  AfterHandleDecorations,
};
