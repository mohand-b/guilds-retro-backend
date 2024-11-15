import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { ReportDto } from './dto/report.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportTypeEnum } from './enum/report-type.enum';
import { RanksGuard } from '../auth/guards/ranks.guard';
import { AppRank } from '../users/enum/app-rank.enum';
import { Ranks } from '../common/decorators/ranks.decorator';
import { ReportDecisionEnum } from './enum/report-decision.enum';

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

  @Get()
  @UseGuards(JwtAuthGuard, RanksGuard)
  @Ranks(AppRank.MODERATOR)
  async getReports(
    @Query('reportTypes') reportTypes?: ReportTypeEnum[],
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{
    data: ReportDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.reportsService.getReports({ reportTypes, page, limit });
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard, RanksGuard)
  @Ranks(AppRank.MODERATOR)
  async resolveReport(
    @Param('id') reportId: number,
    @Body('decision') decision: ReportDecisionEnum,
    @Req() req: any,
  ): Promise<ReportDto> {
    const userId = req.user.userId;
    return this.reportsService.resolveReport(reportId, userId, decision);
  }
}
