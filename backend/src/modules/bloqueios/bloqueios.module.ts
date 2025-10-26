import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BloqueiosController } from './bloqueios.controller';
import { BloqueiosService } from './bloqueios.service';
import { BloqueioEntity, BarberEntity } from 'src/database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([BloqueioEntity, BarberEntity]),
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
  controllers: [BloqueiosController],
  providers: [BloqueiosService],
  exports: [BloqueiosService],
})
export class BloqueiosModule {}
