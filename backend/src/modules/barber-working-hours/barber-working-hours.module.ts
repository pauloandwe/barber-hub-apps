import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarberWorkingHoursController } from './barber-working-hours.controller';
import { BarberWorkingHoursService } from './barber-working-hours.service';
import { BarberEntity, BarberWorkingHoursEntity } from '../../database/entities';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([BarberWorkingHoursEntity, BarberEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'jwt-secret-key'),
        signOptions: {
          expiresIn: configService.get<string | number>('JWT_EXPIRATION', '24h') as any,
        },
      }),
    }),
  ],
  controllers: [BarberWorkingHoursController],
  providers: [BarberWorkingHoursService, JwtAuthGuard, RolesGuard],
  exports: [BarberWorkingHoursService],
})
export class BarberWorkingHoursModule {}

