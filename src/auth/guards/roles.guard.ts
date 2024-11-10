import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enum/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roleHierarchy = {
      [UserRole.CANDIDATE]: [],
      [UserRole.MEMBER]: [UserRole.CANDIDATE],
      [UserRole.OFFICER]: [UserRole.MEMBER, UserRole.CANDIDATE],
      [UserRole.LEADER]: [
        UserRole.OFFICER,
        UserRole.MEMBER,
        UserRole.CANDIDATE,
      ],
    };

    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    console.log(requiredRoles);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException('User not authenticated');
    }

    const hasRole = requiredRoles.some(
      (role) =>
        role === user.role ||
        (roleHierarchy[user.role] && roleHierarchy[user.role].includes(role)),
    );

    if (!hasRole) {
      throw new UnauthorizedException('User does not have the required roles');
    }

    return true;
  }
}
