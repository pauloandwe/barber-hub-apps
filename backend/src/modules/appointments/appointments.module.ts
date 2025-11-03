import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import {
  AppointmentEntity,
  BusinessEntity,
  ServiceEntity,
  ProfessionalEntity,
  ProfileEntity,
  ClientContactEntity,
  ProfessionalWorkingHoursEntity,
} from 'src/database/entities';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentEntity,
      BusinessEntity,
      ServiceEntity,
      ProfessionalEntity,
      ProfileEntity,
      ClientContactEntity,
      ProfessionalWorkingHoursEntity,
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
    RemindersModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, JwtAuthGuard, RolesGuard],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
