import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/database/entities';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
