import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/enum/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  createComment(@Body() createCommentDto: CreateCommentDto, @Req() req: any) {
    return this.commentsService.create(createCommentDto, req.user.userId);
  }
}
