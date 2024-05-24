import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserLightDto } from '../users/dto/user.dto';
import { GuildsService } from '../guilds/services/guilds.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enum/user-role.enum';
import { GuildDto } from '../guilds/dto/guild.dto';
import { MembershipRequestsService } from '../membership-requests/membership-requests.service';
import { MembershipRequest } from '../membership-requests/entities/membership-request.entity';
import { CreateGuildLeaderDto } from '../users/dto/create-guild-leader.dto';
import { JoinGuildMemberDto } from '../users/dto/join-guild-member.dto';
import { User } from '../users/entities/user.entity';
import { GuildCreationCodeService } from '../guilds/services/guild-creation-code.service';

@Injectable()
export class AuthService {
  constructor(
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
    const { password, guildName, logo, level, ...userData } =
      createGuildLeaderDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      ...userData,
      username: userData.username.toLowerCase(), // convert the username to lowercase
      password: hashedPassword,
    });

    await this.usersService.save({ ...user, role: UserRole.LEADER });
    user.role = UserRole.LEADER;

    const guild = await this.guildsService.create(
      { name: guildName, logo, level },
      user,
    );

    await this.guildCreationCodeService.invalidateCodes(guildName);

    const payload = { username: user.username, sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    const guildDto: Omit<GuildDto, 'members'> = {
      id: guild.id,
      name: guild.name,
      description: guild.description,
      logo: guild.logo,
      level: guild.level,
    };

    const userLightDto: UserLightDto = {
      ...user,
      guild: guildDto,
      guildAlliesIds: guild.allies ? guild.allies.map((ally) => ally.id) : [],
    };

    return { user: userLightDto, token };
  }

  async registerAsMember(joinGuildMemberDto: JoinGuildMemberDto): Promise<{
    user: User;
    token: string;
    request: MembershipRequest;
  }> {
    const { password, guildId, ...userData } = joinGuildMemberDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      ...userData,
      username: userData.username.toLowerCase(), // convert the username to lowercase
      password: hashedPassword,
    });

    const guild = await this.guildsService.findOne(guildId);
    if (!guild) {
      throw new Error('Guild not found');
    }

    const request =
      await this.membershipRequestsService.createMembershipRequest(
        user.id,
        guildId,
      );

    const payload = { username: user.username, sub: user.id };
    const token = this.jwtService.sign(payload);

    return { user: user, token, request };
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(
      username.toLowerCase(),
      {
        relations: ['guild', 'guild.allies'],
      },
    );
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userInfo } = user;
    return userInfo;
  }

  async login(user: any): Promise<{
    user: UserLightDto;
    token: string;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, guild, ...userInfo } = user;
    const payload = { username: user.username, sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    const userLightDto: UserLightDto = {
      ...userInfo,
      guild: guild,
      guildAlliesIds:
        guild && guild.allies ? guild.allies.map((ally) => ally.id) : [],
    };

    return {
      user: userLightDto,
      token: token,
    };
  }
}
