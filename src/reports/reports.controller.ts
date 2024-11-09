import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { CreateReportDto, ReportDto } from './dto/report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @Req() req: any,
  ): Promise<ReportDto> {
    const reporterId = req.user.userId;
    return this.reportsService.createReport(createReportDto, reporterId);
  }
}
