import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (
      info?.name === 'TokenExpiredError' ||
      info?.name === 'JsonWebTokenError'
    ) {
      throw new UnauthorizedException({
        error: 'InvalidToken',
        message: info.message || 'Authentication token is invalid or expired',
      });
    }

    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
