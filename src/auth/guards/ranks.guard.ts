import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRank } from '../../users/enum/app-rank.enum';

@Injectable()
export class RanksGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rankHierarchy = {
      [AppRank.USER]: [],
      [AppRank.MODERATOR]: [AppRank.USER],
      [AppRank.ADMIN]: [AppRank.MODERATOR, AppRank.USER],
    };

    const requiredRanks = this.reflector.get<string[]>(
      'ranks',
      context.getHandler(),
    );

    if (!requiredRanks) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.appRank) {
      throw new UnauthorizedException('User not authenticated');
    }

    const hasRank = requiredRanks.some(
      (requiredRank) =>
        requiredRank === user.appRank ||
        (rankHierarchy[user.appRank] &&
          rankHierarchy[user.appRank].includes(requiredRank)),
    );

    if (!hasRank) {
      throw new UnauthorizedException('User does not have the required rank');
    }

    return true;
  }
}
