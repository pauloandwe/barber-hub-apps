import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalWorkingHoursController } from './professional-working-hours.controller';
import { ProfessionalWorkingHoursService } from './professional-working-hours.service';
import { ProfessionalEntity, ProfessionalWorkingHoursEntity } from '../../database/entities';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfessionalWorkingHoursEntity, ProfessionalEntity]),
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
  controllers: [ProfessionalWorkingHoursController],
  providers: [ProfessionalWorkingHoursService, JwtAuthGuard, RolesGuard],
  exports: [ProfessionalWorkingHoursService],
})
export class ProfessionalWorkingHoursModule {}

