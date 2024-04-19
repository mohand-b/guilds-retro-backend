import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from '../users/dto/user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { GuildsService } from '../guilds/guilds.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enum/user-role.enum';
import { GuildDto } from '../guilds/dto/guild.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private guildsService: GuildsService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{
    user: UserDto;
    guild: Omit<GuildDto, 'members'>;
    accessToken: string;
  }> {
    const { password, guildName, guildId, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    let user = await this.usersService.create({
      ...userData,
      password: hashedPassword,
    });

    let guild = null;
    if (guildName) {
      user = await this.usersService.save({ ...user, role: UserRole.LEADER });

      guild = await this.guildsService.create({ name: guildName }, user);
    } else if (guildId) {
      guild = await this.guildsService.findOne(guildId);
      await this.usersService.save({ ...user, guild });
      if (!guild) {
        throw new Error('Guild not found');
      }
    }

    const payload = { username: user.username, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    const guildDto: Omit<GuildDto, 'members'> = {
      id: guild.id,
      name: guild.name,
      description: guild.description,
    };

    return { user, guild: guildDto, accessToken };
  }
}
