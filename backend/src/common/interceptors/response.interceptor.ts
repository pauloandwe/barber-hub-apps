import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If response is already wrapped in the format { data: { data: ... } }, return as is
        if (data && data.data && data.data.data) {
          return data;
        }

        // Otherwise wrap it
        return {
          data: {
            data,
          },
        };
      }),
    );
  }
}
