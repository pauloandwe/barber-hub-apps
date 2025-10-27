import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import {
  BusinessEntity,
  ServiceEntity,
  BarberEntity,
  WorkingHoursEntity,
  AppointmentEntity,
  BloqueioEntity,
} from '../../database/entities';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessEntity,
      ServiceEntity,
      BarberEntity,
      WorkingHoursEntity,
      AppointmentEntity,
      BloqueioEntity,
    ]),
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
  providers: [BusinessService, JwtAuthGuard, RolesGuard],
  controllers: [BusinessController],
  exports: [BusinessService],
})
export class BusinessModule {}
