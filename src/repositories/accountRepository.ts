import { Account, Role } from '@prisma/client';
import prisma from '../../config/database';

export class AccountRepository {
  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: Role;
  }): Promise<Account> {
    return prisma.account.create({
      data,
    });
  }

  async findById(id: number): Promise<Account | null> {
    return prisma.account.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<Account | null> {
    return prisma.account.findUnique({
      where: { email },
    });
  }

  async findAll(): Promise<Account[]> {
    return prisma.account.findMany();
  }

  async searchAccounts(query: {
    firstName?: string;
    lastName?: string;
    email?: string;
    from?: number;
    size?: number;
  }): Promise<Account[]> {
    const { firstName, lastName, email, from = 0, size = 10 } = query;
    return prisma.account.findMany({
      where: {
        AND: [
          firstName
            ? { firstName: { contains: firstName, mode: 'insensitive' } }
            : {},
          lastName
            ? { lastName: { contains: lastName, mode: 'insensitive' } }
            : {},
          email ? { email: { contains: email, mode: 'insensitive' } } : {},
        ],
      },
      orderBy: { id: 'asc' },
      skip: from,
      take: size,
    });
  }

  async isLinkedToAnimals(id: number): Promise<boolean> {
    const [chippedCount, visitedCount] = await Promise.all([
      prisma.animal.count({ where: { chipperId: id } }),
      prisma.animalVisitedLocation.count({ where: { visitedByAccountId: id } }),
    ]);

    return chippedCount > 0 || visitedCount > 0;
  }

  async update(
    id: number,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role: Role;
    }>,
  ): Promise<Account | null> {
    try {
      return await prisma.account.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.account.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
