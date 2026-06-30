import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transform(data)));
  }

  private transform(value: unknown): unknown {
    if (value === null || value === undefined) return value;

    if (value instanceof Decimal) {
      return Number(value.toString());
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        obj[key] = this.transform(obj[key]);
      }
      return obj;
    }

    return value;
  }
}
