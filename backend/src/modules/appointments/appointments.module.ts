import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import {
  AppointmentEntity,
  BusinessEntity,
  ServiceEntity,
  BarberEntity,
} from 'src/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentEntity, BusinessEntity, ServiceEntity, BarberEntity])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
