import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateGuildLeaderDto } from '../users/dto/create-guild-leader.dto';
import { JoinGuildMemberDto } from '../users/dto/join-guild-member.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register-leader')
  @UseInterceptors(FileInterceptor('logo'))
  async registerAsLeader(
    @UploadedFile() file: Express.Multer.File,
    @Body() createGuildLeaderDto: CreateGuildLeaderDto,
  ) {
    if (file && file.buffer) {
      createGuildLeaderDto.logo = file.buffer;
    }
    return this.authService.registerAsLeader(createGuildLeaderDto);
  }

  @Post('register-member')
  async registerAsMember(@Body() joinGuildMemberDto: JoinGuildMemberDto) {
    return this.authService.registerAsMember(joinGuildMemberDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return this.authService.login(user);
  }
}
