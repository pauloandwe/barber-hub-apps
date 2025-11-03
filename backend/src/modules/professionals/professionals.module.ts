import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalEntity } from '../../database/entities/professional.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfessionalEntity]),
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
  providers: [ProfessionalsService, JwtAuthGuard, RolesGuard],
  controllers: [ProfessionalsController],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
