import { UserDto } from '../../users/dto/user.dto';
import { ReportReasonEnum } from '../enum/report-reason.enum';
import { ReportTypeEnum } from '../enum/report-type.enum';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { Event } from '../../events/entities/event';
import { ReportDecisionEnum } from '../enum/report-decision.enum';

export class ReportDto {
  id: number;
  reportType: ReportTypeEnum;
  reason: ReportReasonEnum;
  reasonText: string;
  createdAt: Date;
  status: string;
  reporter: Pick<UserDto, 'id' | 'username'>;
  event?: Event;
  post?: PostEntity;
  user?: UserDto;
  comment?: CommentEntity;
  resolvedAt?: Date;
  resolvedBy?: Pick<UserDto, 'id' | 'username'>;
  decision?: ReportDecisionEnum;
}
