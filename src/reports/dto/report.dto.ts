import { UserDto } from '../../users/dto/user.dto';
import { ReportReasonEnum } from '../enum/report-reason.enum';
import { ReportTypeEnum } from '../enum/report-type.enum';

export class ReportDto {
  id: number;
  reportType: ReportTypeEnum;
  reason: ReportReasonEnum;
  reasonText: string;
  createdAt: Date;
  status: string;
  reporter: Pick<UserDto, 'id' | 'username'>;
  event?: any;
  post?: any;
  user?: any;
}
