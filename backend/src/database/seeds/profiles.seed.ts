import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ProfileEntity, UserRole } from '../entities';

export const seedProfiles = async (dataSource: DataSource) => {
  const profileRepository = dataSource.getRepository(ProfileEntity);

  // Check if users already exist
  const existingAdmin = await profileRepository.findOne({
    where: { email: 'admin@barberhub.com' },
  });

  if (existingAdmin) {
    console.log('Profile data already exists, skipping seed...');
    return;
  }

  // Create sample users
  const users = [
    {
      email: 'admin@barberhub.com',
      nome: 'Administrador',
      telefone: '5511988888888',
      role: UserRole.ADMIN,
      barbearia_id: null,
      password: 'admin123',
    },
    {
      email: 'barbearia@barberhub.com',
      nome: 'Barbearia BarberHub',
      telefone: '5511999999999',
      role: UserRole.BARBEARIA,
      barbearia_id: 1, // Will be set after business is created
      password: 'barbearia123',
    },
    {
      email: 'cliente@barberhub.com',
      nome: 'João Silva',
      telefone: '5511987654321',
      role: UserRole.CLIENTE,
      barbearia_id: null,
      password: 'cliente123',
    },
    {
      email: 'cliente2@barberhub.com',
      nome: 'Maria Santos',
      telefone: '5511987654322',
      role: UserRole.CLIENTE,
      barbearia_id: null,
      password: 'cliente123',
    },
  ];

  for (const userData of users) {
    const password_hash = await bcrypt.hash(userData.password, 10);

    const profile = profileRepository.create({
      email: userData.email,
      nome: userData.nome,
      telefone: userData.telefone,
      role: userData.role,
      barbearia_id: userData.barbearia_id,
      password_hash,
    });

    await profileRepository.save(profile);
    console.log(`✓ Created user: ${userData.email}`);
  }

  console.log('✓ Profile seed completed!');
};
