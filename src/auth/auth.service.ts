import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserLightDto } from '../users/dto/user.dto';
import { GuildsService } from '../guilds/services/guilds.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enum/user-role.enum';
import { GuildDto } from '../guilds/dto/guild.dto';
import { MembershipRequestsService } from '../membership-requests/membership-requests.service';
import { CreateGuildLeaderDto } from '../users/dto/create-guild-leader.dto';
import { JoinGuildMemberDto } from '../users/dto/join-guild-member.dto';
import { User } from '../users/entities/user.entity';
import { GuildCreationCodeService } from '../guilds/services/guild-creation-code.service';
import { MembershipRequestDto } from '../membership-requests/dto/membership-request.dto';
import { Guild } from '../guilds/entities/guild.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private guildsService: GuildsService,
    private guildCreationCodeService: GuildCreationCodeService,
    private membershipRequestsService: MembershipRequestsService,
    private jwtService: JwtService,
  ) {}

  async registerAsLeader(createGuildLeaderDto: CreateGuildLeaderDto): Promise<{
    user: UserLightDto;
    token: string;
  }> {
    const user = await this.createAndSaveUser({
      ...createGuildLeaderDto,
      role: UserRole.LEADER,
    });

    const guild = await this.createAndAssignGuild(user, createGuildLeaderDto);

    await this.guildCreationCodeService.invalidateCodes(
      createGuildLeaderDto.guildName,
    );

    user.guild = guild;

    const userLightDto = this.convertToUserLightDto(user);
    const token = this.generateToken(user);

    return { user: userLightDto, token };
  }

  async registerAsMember(joinGuildMemberDto: JoinGuildMemberDto): Promise<{
    user: UserLightDto;
    token: string;
  }> {
    const user = await this.createAndSaveUser({
      ...joinGuildMemberDto,
      role: UserRole.CANDIDATE,
    });

    await this.assignUserToGuild(user, joinGuildMemberDto.guildId);

    const userLightDto = this.convertToUserLightDto(user);
    const token = this.generateToken(user);

    return { user: userLightDto, token };
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.findUserWithCredentials(username, pass);
    return this.sanitizeUser(user);
  }

  async login(user: User): Promise<{
    user: UserLightDto;
    token: string;
    requests?: MembershipRequestDto[];
  }> {
    const userLightDto = this.convertToUserLightDto(user);
    const token = this.generateToken(user);

    return {
      user: userLightDto,
      token,
      requests: await this.membershipRequestsService.findRequestsForUser(
        user.id,
      ),
    };
  }

  async refreshUser(userId: number): Promise<{
    user: UserLightDto;
    token: string;
    requests?: MembershipRequestDto[];
  }> {
    const user = await this.usersService.findOneById(userId, {
      relations: ['guild', 'guild.allies', 'jobs', 'questionnaire'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userLightDto = this.convertToUserLightDto(user);
    const token = this.generateToken(user);

    return {
      user: userLightDto,
      token,
      requests: await this.membershipRequestsService.findRequestsForUser(
        user.id,
      ),
    };
  }

  private async assignUserToGuild(user: User, guildId: number): Promise<Guild> {
    const guild = await this.guildsService.findOne(guildId);
    if (!guild) {
      throw new Error('Guild not found');
    }

    await this.membershipRequestsService.createMembershipRequest(
      user.id,
      guildId,
    );
    return guild;
  }

  private async createAndSaveUser(dto: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      username: dto.username.toLowerCase(),
      password: hashedPassword,
    });

    await this.usersService.save(user);
    return user;
  }

  private async createAndAssignGuild(
    user: User,
    dto: CreateGuildLeaderDto,
  ): Promise<Guild> {
    return this.guildsService.create(
      {
        name: dto.guildName,
        logo: dto.logo,
        level: dto.level,
        description: dto.description,
      },
      user,
    );
  }

  private async findUserWithCredentials(
    username: string,
    pass: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username: this.normalizeUsername(username.toLowerCase()) },
      relations: ['guild', 'guild.allies', 'jobs', 'questionnaire'],
    });

    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const userInfo = { ...user };
    delete userInfo.password;
    return userInfo;
  }

  private generateToken(user: User): string {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return this.jwtService.sign(payload);
  }

  private convertToUserLightDto(user: User): UserLightDto {
    const guildDto: GuildDto = user.guild
      ? {
          id: user.guild.id,
          name: user.guild.name,
          description: user.guild.description,
          logo: user.guild.logo,
          level: user.guild.level,
        }
      : null;

    return {
      id: user.id,
      username: user.username,
      characterClass: user.characterClass,
      jobs: user.jobs,
      gender: user.gender,
      characterLevel: user.characterLevel,
      guild: guildDto,
      guildAlliesIds: user.guild?.allies?.map((ally) => ally.id) || [],
      role: user.role,
      questionnaire: user.questionnaire,
    };
  }

  private normalizeUsername(username: string): string {
    if (!username) return username;
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }
}
