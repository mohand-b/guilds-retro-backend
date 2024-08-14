import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { FindOneOptions, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from './enum/user-role.enum';
import { UserDto } from './dto/user.dto';
import { Job } from './entities/job.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const username = this.normalizeUsername(createUserDto.username);
    const existingUser = await this.findOneByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already taken');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      username,
    });
    return this.userRepository.save(user);
  }

  async getCurrentUser(userId: number): Promise<User> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild', 'guild.allies', 'posts'],
    });
  }

  async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<any[]> {
    const users = await this.userRepository.find({ relations: ['guild'] });
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      characterClass: user.characterClass,
      guildId: user.guild ? user.guild.id : null,
      role: user.role,
    }));
  }

  async findOneById(id: number, options?: FindOneOptions<User>): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      ...options,
    });
  }

  async findOneByUsername(
    username: string,
    options?: FindOneOptions<User>,
  ): Promise<User> {
    return this.userRepository.findOne({
      where: { username: this.normalizeUsername(username) },
      ...options,
    });
  }

  async findMembersByGuild(guildId: number): Promise<User[]> {
    return this.userRepository.find({
      where: {
        guild: { id: guildId },
        role: Not(UserRole.CANDIDATE),
      },
    });
  }

  async updateFeedPreference(
    userId: number,
    feedClosingToGuildAndAllies: boolean,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.feedClosingToGuildAndAllies = feedClosingToGuildAndAllies;
    return this.userRepository.save(user);
  }

  async updateUserRole(userId: number, role: UserRole): Promise<UserDto> {
    const user: User = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return this.userRepository.save(user);
  }

  async addJobToUser(
    userId: number,
    jobName: string,
    level: number,
    isForgemaging: boolean,
  ): Promise<Job> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['jobs'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const normalJobs = user.jobs.filter((job) => !job.isForgemaging);
    const forgemagingJobs = user.jobs.filter((job) => job.isForgemaging);

    if (!isForgemaging && normalJobs.length >= 3) {
      throw new BadRequestException(
        'User already has the maximum number of normal jobs',
      );
    }

    if (isForgemaging && forgemagingJobs.length >= 3) {
      throw new BadRequestException(
        'User already has the maximum number of forgemaging jobs',
      );
    }

    const newJob = this.jobRepository.create({
      name: jobName,
      level,
      isForgemaging,
      user,
    });

    return this.jobRepository.save(newJob);
  }

  private normalizeUsername(username: string): string {
    if (!username) return username;
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }
}
