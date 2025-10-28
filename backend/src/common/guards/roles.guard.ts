import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/database/entities';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('[RolesGuard] User:', user);
    console.log('[RolesGuard] Required roles:', requiredRoles);

    if (!user) {
      throw new ForbiddenException('User information not found');
    }

    if (!requiredRoles.includes(user.role)) {
      console.log(`[RolesGuard] User role '${user.role}' not in required roles`);
      throw new ForbiddenException(
        `User role '${user.role}' is not authorized to access this resource. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
