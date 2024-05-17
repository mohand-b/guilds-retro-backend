import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostEntity } from '../posts/entities/post.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async getFeed(@Req() req: any): Promise<PostEntity[]> {
    return this.feedService.getFeed(req.user.userId);
  }
}
