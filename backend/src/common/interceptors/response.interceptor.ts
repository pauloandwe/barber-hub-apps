import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          Object.prototype.hasOwnProperty.call(data, 'data')
        ) {
          const { data: nestedData, ...metadata } = data as { data: unknown } & Record<
            string,
            unknown
          >;

          if (Object.keys(metadata).length > 0) {
            return {
              ...metadata,
              data: nestedData,
            };
          }

          return {
            data: nestedData,
          };
        }

        return {
          data,
        };
      }),
    );
  }
}
