import { DataSource } from 'typeorm';
import {
  BusinessEntity,
  WorkingHoursEntity,
  ServiceEntity,
  BarberEntity,
  SettingsEntity,
} from '../entities';

export const seedBusiness = async (dataSource: DataSource) => {
  const businessRepository = dataSource.getRepository(BusinessEntity);
  const workingHoursRepository = dataSource.getRepository(WorkingHoursEntity);
  const serviceRepository = dataSource.getRepository(ServiceEntity);
  const barberRepository = dataSource.getRepository(BarberEntity);
  const settingsRepository = dataSource.getRepository(SettingsEntity);

  // Check if data already exists
  const existingBusiness = await businessRepository.findOne({
    where: { phone: '5511999999999' },
  });

  if (existingBusiness) {
    console.log('Business data already exists, skipping seed...');
    return;
  }

  // Create Business
  const business = businessRepository.create({
    name: 'BarberHub',
    phone: '5511999999999',
    type: 'barbershop',
    token: 'mocked_token_abc123',
  });

  const savedBusiness = await businessRepository.save(business);

  // Create Working Hours
  const workingHours = [
    { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00', closed: false },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00', closed: false },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00', closed: false },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00', closed: false },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00', closed: false },
    { dayOfWeek: 6, openTime: '09:00', closeTime: '14:00', breakStart: null, breakEnd: null, closed: false },
    { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', breakStart: null, breakEnd: null, closed: true },
  ];

  for (const wh of workingHours) {
    await workingHoursRepository.save({
      businessId: savedBusiness.id,
      ...wh,
    });
  }

  // Create Services
  const services = [
    { businessId: savedBusiness.id, name: 'Corte Simples', description: 'Corte de cabelo tradicional', duration: 30, price: 40, active: true },
    { businessId: savedBusiness.id, name: 'Corte + Barba', description: 'Corte de cabelo + barba completa', duration: 50, price: 65, active: true },
    { businessId: savedBusiness.id, name: 'Barba', description: 'Aparar e modelar barba', duration: 20, price: 30, active: true },
    { businessId: savedBusiness.id, name: 'Platinado', description: 'Descoloração completa', duration: 90, price: 120, active: true },
    { businessId: savedBusiness.id, name: 'Relaxamento', description: 'Relaxamento capilar', duration: 60, price: 80, active: true },
  ];

  await serviceRepository.save(services);

  // Create Barbers
  const barbers = [
    { businessId: savedBusiness.id, name: 'João', specialties: ['Corte', 'Barba'], active: true },
    { businessId: savedBusiness.id, name: 'Pedro', specialties: ['Corte', 'Platinado'], active: true },
    { businessId: savedBusiness.id, name: 'Carlos', specialties: ['Barba', 'Relaxamento'], active: true },
  ];

  await barberRepository.save(barbers);

  // Create Settings
  await settingsRepository.save({
    businessId: savedBusiness.id,
    reminderHours: ['24', '2'],
    enableReminders: true,
    allowCancellation: true,
    cancellationDeadlineHours: 2,
    allowReschedule: true,
    rescheduleDeadlineHours: 2,
    autoConfirmAppointments: true,
  });

  console.log('Business seed completed successfully!');
};
