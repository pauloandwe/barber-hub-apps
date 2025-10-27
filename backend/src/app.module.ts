import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { BloqueiosModule } from './modules/bloqueios/bloqueios.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessModule } from './modules/business/business.module';
import { BarbersModule } from './modules/barbers/barbers.module';
import { ServicesModule } from './modules/services/services.module';
import { getDatabaseConfig } from './config/database.config';
import {
  BusinessEntity,
  WorkingHoursEntity,
  ServiceEntity,
  BarberEntity,
  SettingsEntity,
  AppointmentEntity,
  ProfileEntity,
  BloqueioEntity,
} from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    TypeOrmModule.forFeature([
      BusinessEntity,
      WorkingHoursEntity,
      ServiceEntity,
      BarberEntity,
      SettingsEntity,
      AppointmentEntity,
      ProfileEntity,
      BloqueioEntity,
    ]),
    AuthModule,
    AppointmentsModule,
    BloqueiosModule,
    UsersModule,
    BusinessModule,
    BarbersModule,
    ServicesModule,
  ],
})
export class AppModule {}
