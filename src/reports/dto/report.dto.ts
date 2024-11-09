import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { UserDto } from '../../users/dto/user.dto';

export class CreateReportDto {
  @IsInt()
  @IsNotEmpty()
  entityId: number;

  @IsEnum(['post', 'user', 'event'])
  @IsNotEmpty()
  entityType: 'post' | 'user' | 'event';

  @IsNotEmpty()
  reason: string;
}

export type ReportType = 'post' | 'user' | 'event';

export class ReportDto {
  id: number;
  reportType: string;
  reason: string;
  createdAt: Date;
  status: string;
  reporter: Pick<UserDto, 'id' | 'username'>;
  event?: any;
  post?: any;
  user?: any;
}
