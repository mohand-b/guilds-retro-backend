import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuildCreationCode } from '../entities/guild-creation-code.entity';

@Injectable()
export class GuildCreationCodeService {
  private readonly dofusNames: string[] = [
    'VULBIS',
    'EMERAUDE',
    'POURPRE',
    'TURQUOISE',
    'EBENE',
    'IVOIRE',
    'OTOMAI',
    'CANIA',
    'ASTRUB',
    'BWORK',
    'PICHON',
    'TOFU',
    'BOUFTOU',
    'KWAK',
    'MULOU',
    'SKEUNK',
    'WABBIT',
    'ARAKNE',
    'CHAFER',
    'PANDALA',
    'QUTAN',
    'ILYZAELLE',
    'RUSHU',
    'BONTA',
    'BRAKMAR',
  ];

  constructor(
    @InjectRepository(GuildCreationCode)
    private guildCreationCodeRepository: Repository<GuildCreationCode>,
  ) {}

  private generateRandomSuffix(): string {
    return Math.floor(10 + Math.random() * 90).toString();
  }

  private getRandomDofusName(): string {
    const randomIndex = Math.floor(Math.random() * this.dofusNames.length);
    return this.dofusNames[randomIndex];
  }

  async generateCode(guildName: string): Promise<string> {
    const namePart = this.getRandomDofusName();
    const numberPart = this.generateRandomSuffix();
    const code = `${namePart}${numberPart}`;

    const creationCode = this.guildCreationCodeRepository.create({
      code,
      guildName,
    });
    await this.guildCreationCodeRepository.save(creationCode);
    return code;
  }

  async validateCode(code: string): Promise<string> {
    const creationCode = await this.guildCreationCodeRepository.findOne({
      where: { code, isValid: true },
    });

    if (!creationCode) {
      throw new NotFoundException('Invalid or expired code');
    }

    return creationCode.guildName;
  }

  async invalidateCodes(guildName: string): Promise<void> {
    await this.guildCreationCodeRepository.update(
      { guildName },
      { isValid: false },
    );
  }
}
