import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enum/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { PostDto } from './dto/post.dto';
import { FeedDto } from '../feed/entities/dto/feed.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  @UseInterceptors(FileInterceptor('image'))
  createPost(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPostDto: CreatePostDto,
    @Req() req: any,
  ): Promise<FeedDto> {
    if (file && file.buffer) {
      createPostDto.image = file.buffer;
    }
    return this.postsService.create(createPostDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  deletePost(@Param('id') id: number): Promise<void> {
    return this.postsService.delete(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getPost(@Param('id') id: number): Promise<PostDto> {
    return this.postsService.findOneById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId/last-posts')
  async getLastFivePosts(@Param('userId') userId: number, @Req() req: any) {
    const requestingUserId = req.user.userId;
    return this.postsService.findLastFivePostsByUser(userId, requestingUserId);
  }
}
