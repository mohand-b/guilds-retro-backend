import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ReportReasonEnum } from '../enum/report-reason.enum';

export class CreateReportDto {
  @IsInt()
  @IsNotEmpty()
  entityId: number;

  @IsEnum(['post', 'user', 'event'])
  @IsNotEmpty()
  entityType: 'post' | 'user' | 'event';

  @IsEnum(ReportReasonEnum)
  @IsNotEmpty()
  reason: ReportReasonEnum;

  @IsString()
  @IsNotEmpty()
  reasonText: string;
}
