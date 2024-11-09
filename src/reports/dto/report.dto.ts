import { UserDto } from '../../users/dto/user.dto';
import { ReportReasonEnum } from '../enum/report-reason.enum';

export type ReportType = 'post' | 'user' | 'event';

export class ReportDto {
  id: number;
  reportType: ReportType;
  reason: ReportReasonEnum;
  reasonText: string;
  createdAt: Date;
  status: string;
  reporter: Pick<UserDto, 'id' | 'username'>;
  event?: any;
  post?: any;
  user?: any;
}
