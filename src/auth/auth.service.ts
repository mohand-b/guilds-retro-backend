import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from '../users/dto/user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { GuildsService } from '../guilds/guilds.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enum/user-role.enum';
import { GuildDto } from '../guilds/dto/guild.dto';
import { Guild } from '../guilds/entities/guild.entity';
import { MembershipRequestsService } from '../membership-requests/membership-requests.service';
import { MembershipRequest } from '../membership-requests/entities/membership-request.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private guildsService: GuildsService,
    private membershipRequestsService: MembershipRequestsService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{
    user: UserDto;
    guild: Omit<GuildDto, 'members'>;
    token: string;
    request?: MembershipRequest;
  }> {
    const { password, guildName, guildId, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      ...userData,
      password: hashedPassword,
    });

    let guild = null;
    let request = null;

    if (guildName) {
      await this.usersService.save({ ...user, role: UserRole.LEADER });
      user.role = UserRole.LEADER;
      guild = await this.guildsService.create({ name: guildName }, user);
    } else if (guildId) {
      guild = await this.guildsService.findOne(guildId);
      if (!guild) {
        throw new Error('Guild not found');
      }
      request = await this.membershipRequestsService.createMembershipRequest(
        user.id,
        guildId,
      );
    }

    const payload = { username: user.username, sub: user.id };
    const token = this.jwtService.sign(payload);

    const guildDto: Omit<GuildDto, 'members'> = {
      id: guild.id,
      name: guild.name,
      description: guild.description,
    };

    return { user, guild: guildDto, token, request };
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any): Promise<{
    user: any;
    guild: Omit<Guild, 'members'>;
    token: string;
  }> {
    const { password, guild, ...userInfo } = user;
    const payload = { username: user.username, sub: user.id };
    const token = this.jwtService.sign(payload);
    return {
      user: userInfo,
      guild: guild,
      token: token,
    };
  }
}
