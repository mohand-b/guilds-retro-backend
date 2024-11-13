import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ReportReasonEnum } from '../enum/report-reason.enum';
import { ReportTypeEnum } from '../enum/report-type.enum';

export class CreateReportDto {
  @IsInt()
  @IsNotEmpty()
  entityId: number;

  @IsEnum(ReportTypeEnum)
  @IsNotEmpty()
  entityType: ReportTypeEnum;

  @IsEnum(ReportReasonEnum)
  @IsNotEmpty()
  reason: ReportReasonEnum;

  @IsString()
  @IsNotEmpty()
  reasonText: string;
}
