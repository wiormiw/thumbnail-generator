import type { Dependencies } from '@/application/di/dependencies';
import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';

export interface HonoVariables {
  requestId: string;
  handleResult: <T>(result: Result<T, BaseError>) => Promise<
    | {
        success: true;
        requestId: string;
        data: T;
      }
    | Response
  >;
  deps: Dependencies;
}

export type HonoEnv = {
  Variables: HonoVariables;
};
