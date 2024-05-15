import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { convertBufferToBase64 } from '../utils/image.utils';

@Injectable()
export class ImageConversionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.recursiveConvertLogo(data)));
  }

  private recursiveConvertLogo(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.recursiveConvertLogo(item));
    } else if (data !== null && typeof data === 'object') {
      Object.keys(data).forEach((key) => {
        if (key === 'logo' && data[key] instanceof Buffer) {
          data[key] = convertBufferToBase64(data[key]);
        } else {
          data[key] = this.recursiveConvertLogo(data[key]);
        }
      });
      return data;
    }
    return data;
  }
}
