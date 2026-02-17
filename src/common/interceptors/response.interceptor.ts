import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  constructor(private reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    const httpResponse = context.switchToHttp().getResponse();
    const customMessage = this.reflector.get<string>('response_message', context.getHandler());

    return next.handle().pipe(
      map((data: T) => {
        const meta = data as unknown as { statusCode?: number; message?: string };
        return {
          statusCode: meta?.statusCode || httpResponse.statusCode || 200,
          message: meta?.message || customMessage || 'success',
          data: this.clearResponseData(data),
        };
      }),
    );
  }

  // NOTE: If we want to set custom statusCode and message in response it will set values from data to response then remove
  private clearResponseData(data: T): T {
    if (data && typeof data === 'object') {
      const record = data as unknown as Record<string, unknown>;
      if ('statusCode' in record) record.statusCode = undefined;
      if ('message' in record) record.message = undefined;
    }

    return data;
  }
}
