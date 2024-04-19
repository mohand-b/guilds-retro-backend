import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from '../users/dto/user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { GuildsService } from '../guilds/guilds.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private guildsService: GuildsService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{
    user: UserDto;
    accessToken: string;
  }> {
    const { password, guildName, guildId, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      ...userData,
      password: hashedPassword,
    });

    let guild = null;
    if (guildName) {
      guild = await this.guildsService.create({ name: guildName }, user);
    } else if (guildId) {
      guild = await this.guildsService.findOne(guildId);
      if (!guild) {
        throw new Error('Guild not found');
      }
    }

    const userDto: UserDto = {
      id: user.id,
      username: user.username,
      characterClass: user.characterClass,
      guild: guild,
    };

    const payload = { username: user.username, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { user: userDto, accessToken };
  }
}
