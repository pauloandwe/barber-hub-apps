import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnavailabilityController } from './unavailability.controller';
import { UnavailabilityService } from './unavailability.service';
import { UnavailabilityEntity, ProfessionalEntity } from 'src/database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnavailabilityEntity, ProfessionalEntity]),
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
  controllers: [UnavailabilityController],
  providers: [UnavailabilityService],
  exports: [UnavailabilityService],
})
export class UnavailabilityModule {}
