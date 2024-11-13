import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/enum/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginatedCommentsDto } from './dto/paginated-comments.dto';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  createComment(@Body() createCommentDto: CreateCommentDto, @Req() req: any) {
    return this.commentsService.create(createCommentDto, req.user.userId);
  }

  @Get(':postId')
  @UseGuards(JwtAuthGuard)
  async getPaginatedComments(
    @Param('postId') postId: number,
    @Query('cursor') cursor?: number,
    @Query('limit') limit = 3,
  ): Promise<PaginatedCommentsDto> {
    return this.commentsService.getPaginatedComments(postId, cursor, limit);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async deleteComment(@Param('id') id: number, @Req() req: any) {
    return this.commentsService.delete(id, req.user.userId, req.user.appRank);
  }
}
