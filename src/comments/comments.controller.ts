import {
  Body,
  Controller,
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

  @UseGuards(JwtAuthGuard)
  @Get(':postId')
  async getPaginatedComments(
    @Param('postId') postId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 3,
  ): Promise<PaginatedCommentsDto> {
    return this.commentsService.getPaginatedComments(postId, page, limit);
  }
}
