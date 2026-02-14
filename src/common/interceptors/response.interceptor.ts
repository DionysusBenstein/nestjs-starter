import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
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
      map((data: any) => {
        return {
          statusCode: data?.statusCode || httpResponse.statusCode || 200,
          message: data?.message || customMessage || 'success',
          data: this.clearResponseData(data),
        };
      }),
    );
  }

  // NOTE: If we want to set custom statusCode and message in response it will set values from data to response then remove
  private clearResponseData(data: any) {
    if (data?.statusCode) {
      data.statusCode = undefined;
    }

    if (data?.message) {
      data.message = undefined;
    }

    return data;
  }
}
