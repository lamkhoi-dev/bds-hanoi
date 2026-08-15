import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('property_up')
export class PropertyProcessor {
  private readonly logger = new Logger(PropertyProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('up-property')
  async handleUpProperty(job: Job<{ propertyId: string; userId: string; upDurationDays: number; price: number }>) {
    this.logger.debug(`Processing UP for property ${job.data.propertyId}...`);
    const { propertyId, userId, upDurationDays, price } = job.data;

    try {
      await this.prisma.$transaction(async (tx) => {
        const property = await tx.property.findUnique({
          where: { id: propertyId },
          select: { title: true, tierExpiresAt: true, tier: true },
        });

        if (!property) {
          throw new Error(`Property not found: ${propertyId}`);
        }

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, balance: true },
        });

        if (!user) {
          throw new Error(`User not found: ${userId}`);
        }

        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(now.getDate() + upDurationDays);

        await tx.property.update({
          where: { id: propertyId },
          data: {
            tier: 'UP',
            tierExpiresAt: expiresAt,
            pushedAt: now,
            updatedAt: now,
          }
        });
        
        await tx.propertyHistory.create({
          data: {
            propertyId: propertyId,
            changedBy: userId,
            changes: JSON.stringify({ action: 'UP_TIER', tier: 'UP', tierExpiresAt: expiresAt })
          }
        });
      });
      
      this.logger.debug(`Property ${propertyId} UP successful.`);
    } catch (e) {
      this.logger.error(`Error processing UP property: ${(e as Error).message}`, (e as Error).stack);
      throw e;
    }
  }
}
