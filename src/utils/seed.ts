import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AccountRepository } from '../repositories/accountRepository';

const accountRepository = new AccountRepository();

const defaultAccounts = [
  {
    firstName: 'adminFirstName',
    lastName: 'adminLastName',
    email: 'admin@simbirsoft.com',
    password: 'qwerty123',
    role: Role.ADMIN,
  },
  {
    firstName: 'chipperFirstName',
    lastName: 'chipperLastName',
    email: 'chipper@simbirsoft.com',
    password: 'qwerty123',
    role: Role.CHIPPER,
  },
  {
    firstName: 'userFirstName',
    lastName: 'userLastName',
    email: 'user@simbirsoft.com',
    password: 'qwerty123',
    role: Role.USER,
  },
];

export async function seedDefaultAccounts() {
  try {
    for (const accountData of defaultAccounts) {
      const existingAccount = await accountRepository.findByEmail(accountData.email);
      if (!existingAccount) {
        const hashedPassword = await bcrypt.hash(accountData.password, 10);
        await accountRepository.create({
          ...accountData,
          password: hashedPassword,
        });
        console.log(`Created default account: ${accountData.email}`);
      } else {
        console.log(`Account already exists: ${accountData.email}`);
      }
    }
  } catch (error) {
    console.error('Error seeding default accounts:', error);
  }
}