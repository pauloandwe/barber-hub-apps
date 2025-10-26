import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { BusinessEntity } from '../../database/entities/business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEntity])],
  providers: [BusinessService],
  controllers: [BusinessController],
  exports: [BusinessService],
})
export class BusinessModule {}
