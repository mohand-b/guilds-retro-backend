import { ConflictException, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username } = createUserDto;
    const existingUser = await this.usersRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username is already taken.');
    }

    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async save(user: User): Promise<User> {
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<any[]> {
    const users = await this.usersRepository.find({ relations: ['guild'] });
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      characterClass: user.characterClass,
      guildId: user.guild ? user.guild.id : null,
      role: user.role,
    }));
  }

  async findOneById(id: number): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async findOneByUsername(username: string): Promise<User> {
    return this.usersRepository.findOneBy({ username });
  }
}
