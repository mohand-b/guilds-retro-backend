import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('likes')
export class LikesController {
  constructor(private likeService: LikesService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':postId')
  async likePost(@Param('postId') postId: number, @Req() req: any) {
    const userId = req.user.userId;
    return this.likeService.likePost(userId, postId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':postId')
  async unlikePost(@Param('postId') postId: number, @Req() req: any) {
    const userId = req.user.userId;
    return this.likeService.unlikePost(userId, postId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':postId')
  async getLikesByPost(@Param('postId') postId: number) {
    return this.likeService.getLikesByPost(postId);
  }
}
