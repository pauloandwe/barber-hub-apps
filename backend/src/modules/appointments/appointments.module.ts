import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import {
  AppointmentEntity,
  BusinessEntity,
  ServiceEntity,
  BarberEntity,
  ProfileEntity,
} from 'src/database/entities';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentEntity,
      BusinessEntity,
      ServiceEntity,
      BarberEntity,
      ProfileEntity,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, JwtService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
