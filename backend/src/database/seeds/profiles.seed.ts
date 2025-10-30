import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ProfileEntity, UserRole } from '../entities';

export const seedProfiles = async (dataSource: DataSource) => {
  const profileRepository = dataSource.getRepository(ProfileEntity);

  const existingAdmin = await profileRepository.findOne({
    where: { email: 'admin@barberhub.com' },
  });

  if (existingAdmin) {
    console.log('Profile data already exists, skipping seed...');
    return;
  }

  const users: Array<{
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    businessId?: number;
    password: string;
  }> = [
    {
      email: 'admin@barberhub.com',
      name: 'Administrador',
      phone: '5511988888888',
      role: UserRole.ADMIN,
      password: 'admin123',
    },
    {
      email: 'barbearia@barberhub.com',
      name: 'Barbearia BarberHub',
      phone: '15551806855',
      role: UserRole.BARBERSHOP,
      businessId: 1,
      password: 'barbearia123',
    },
    {
      email: 'cliente@barberhub.com',
      name: 'João Silva',
      phone: '5511987654321',
      role: UserRole.CLIENT,
      password: 'cliente123',
    },
    {
      email: 'cliente2@barberhub.com',
      name: 'Maria Santos',
      phone: '5511987654322',
      role: UserRole.CLIENT,
      password: 'cliente123',
    },
  ];

  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const profile = profileRepository.create({
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      role: userData.role,
      businessId: userData.businessId,
      passwordHash,
    });

    await profileRepository.save(profile);
    console.log(`✓ Created user: ${userData.email}`);
  }

  console.log('✓ Profile seed completed!');
};
