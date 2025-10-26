import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';

describe('Appointments (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Setup global pipes, filters, and interceptors
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /appointments/suggest', () => {
    it('should return suggestions for appointment', () => {
      return request(app.getHttpServer())
        .post('/appointments/suggest')
        .send({
          businessId: 1,
          serviceId: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
        });
    });
  });

  describe('POST /:businessId/appointments', () => {
    it('should create an appointment', () => {
      const appointmentData = {
        businessId: 1,
        serviceId: 1,
        barberId: 1,
        clientName: 'John Doe',
        clientPhone: '5511999999999',
        appointmentDate: '2025-01-15',
        appointmentTime: '10:00',
        notes: 'Test appointment',
      };

      return request(app.getHttpServer())
        .post('/appointments/1/appointments')
        .send(appointmentData)
        .expect(201)
        .expect((res) => {
          expect(res.body.data.data).toBeDefined();
          expect(res.body.data.data.clientName).toBe('John Doe');
        });
    });

    it('should fail when businessId mismatch', () => {
      const appointmentData = {
        businessId: 2,
        serviceId: 1,
        barberId: 1,
        clientName: 'John Doe',
        clientPhone: '5511999999999',
        appointmentDate: '2025-01-15',
        appointmentTime: '10:00',
      };

      return request(app.getHttpServer())
        .post('/appointments/1/appointments')
        .send(appointmentData)
        .expect(400);
    });
  });

  describe('GET /auth/:businessId/:phone', () => {
    it('should return business information', () => {
      return request(app.getHttpServer())
        .get('/auth/153/5511999999999')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.data).toBeDefined();
          expect(res.body.data.data.id).toBe(153);
          expect(res.body.data.data.name).toBe('BarberHub');
        });
    });
  });
});
