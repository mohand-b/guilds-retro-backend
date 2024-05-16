import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostEntity } from './entities/post.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  createPost(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPostDto: CreatePostDto,
    @Req() req: any,
  ): Promise<PostEntity> {
    if (file && file.buffer) {
      createPostDto.image = file.buffer;
    }
    return this.postsService.create(createPostDto, req.user.userId);
  }
}
