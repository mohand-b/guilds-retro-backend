import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ReportEntity } from './entities/report.entity';
import { Event } from '../events/entities/event';
import { ReportDto } from './dto/report.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CommentEntity } from '../comments/entities/comment.entity';
import { ReportTypeEnum } from './enum/report-type.enum';
import { ReportStatusEnum } from './enum/report-status.enum';
import { ReportDecisionEnum } from './enum/report-decision.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ReportEntity)
    private reportRepository: Repository<ReportEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private notificationsService: NotificationsService,
  ) {}

  async createReport(
    createReportDto: CreateReportDto,
    reporterId: number,
  ): Promise<ReportDto> {
    const { entityId, entityType, reason, reasonText } = createReportDto;

    const reporter: Pick<User, 'id' | 'username'> =
      await this.userRepository.findOne({
        where: { id: reporterId },
        select: ['id', 'username'],
      });

    if (!reporter) {
      throw new NotFoundException('Reporter not found');
    }

    let report = new ReportEntity();
    report.reporter = reporter;
    report.reason = reason;
    report.reasonText = reasonText;

    switch (entityType) {
      case ReportTypeEnum.POST:
        report = await this.createPostReport(entityId, report);
        break;
      case ReportTypeEnum.USER:
        report = await this.createUserReport(entityId, report);
        break;
      case ReportTypeEnum.EVENT:
        report = await this.createEventReport(entityId, report);
        break;
      case ReportTypeEnum.COMMENT:
        report = await this.createCommentReport(entityId, report);
        break;
      default:
        throw new Error('Unsupported entity type for reporting');
    }

    await this.reportRepository.save(report);
    return this.toReportDto(report);
  }

  async getReports({
    reportTypes,
    page = 1,
    limit = 10,
  }: {
    reportTypes?: ReportTypeEnum[];
    page?: number;
    limit?: number;
  }): Promise<{
    data: ReportDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const reportTypesArray = Array.isArray(reportTypes)
      ? reportTypes
      : reportTypes
        ? [reportTypes]
        : [];

    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.post', 'post')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.event', 'event')
      .leftJoinAndSelect('report.comment', 'comment')
      .leftJoinAndSelect('report.resolvedBy', 'resolvedBy')
      .orderBy('report.createdAt', 'DESC');

    if (reportTypesArray.length > 0) {
      query.andWhere('report.reportType IN (:...reportTypes)', {
        reportTypes: reportTypesArray,
      });
    }

    const [data, total] = await query.getManyAndCount();

    const sortedData = data.sort((a, b) => {
      if (
        a.status === ReportStatusEnum.PENDING &&
        b.status !== ReportStatusEnum.PENDING
      ) {
        return -1;
      }
      if (
        a.status !== ReportStatusEnum.PENDING &&
        b.status === ReportStatusEnum.PENDING
      ) {
        return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const paginatedData = sortedData.slice(skip, skip + take);

    return {
      data: paginatedData.map((report) => this.toReportDto(report)),
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async resolveReport(
    reportId: number,
    userId: number,
    decision: ReportDecisionEnum,
  ): Promise<ReportDto> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: [
        'post',
        'post.user',
        'comment',
        'comment.user',
        'reporter',
        'resolvedBy',
      ],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const resolvedBy = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username'],
    });

    if (!resolvedBy) {
      throw new NotFoundException('User resolving the report not found');
    }

    let relatedEntity: any,
      notificationType: string,
      deletionMessage: string,
      relatedReports: ReportEntity[];

    switch (report.reportType) {
      case ReportTypeEnum.POST:
        relatedEntity = report.post;
        notificationType = 'post_deleted';
        deletionMessage =
          "Ton post a été supprimé car il ne respecte pas les conditions d'utilisation";
        relatedReports = await this.reportRepository.find({
          where: { post: { id: relatedEntity?.id } },
          relations: ['reporter'],
        });
        break;
      case ReportTypeEnum.COMMENT:
        relatedEntity = report.comment;
        notificationType = 'comment_deleted';
        deletionMessage =
          "Ton commentaire a été supprimé car il ne respecte pas les conditions d'utilisation";
        relatedReports = await this.reportRepository.find({
          where: { comment: { id: relatedEntity?.id } },
          relations: ['reporter'],
        });
        break;
      default:
        throw new Error('Unsupported report type');
    }

    if (
      decision === ReportDecisionEnum.OBJECT_DELETED &&
      relatedEntity &&
      !relatedEntity.archived
    ) {
      relatedEntity.archived = true;
      await this[`${report.reportType as string}Repository`].save(
        relatedEntity,
      );

      await this.notificationsService.createNotification(
        [relatedEntity.user.id],
        notificationType,
        deletionMessage,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        userId,
      );
    }

    for (const relatedReport of relatedReports) {
      relatedReport.status = ReportStatusEnum.PROCESSED;
      relatedReport.resolvedAt = new Date();
      relatedReport.resolvedBy = resolvedBy;
      relatedReport.decision = decision;
    }

    await this.reportRepository.save(relatedReports);

    const updatedReport = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: [
        'post',
        'post.user',
        'comment',
        'comment.user',
        'reporter',
        'resolvedBy',
      ],
    });

    await this.notificationsService.createNotification(
      [report.reporter.id],
      'report_processed',
      `Ton signalement pour le ${report.reportType.toLowerCase()} a été traité`,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      userId,
    );

    return this.toReportDto(updatedReport);
  }

  private async createPostReport(entityId: number, report: ReportEntity) {
    const post = await this.postRepository.findOne({
      where: { id: entityId },
      relations: ['user'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    report.post = post;
    report.reportType = ReportTypeEnum.POST;
    return report;
  }

  private async createCommentReport(entityId: number, report: ReportEntity) {
    const comment = await this.commentRepository.findOne({
      where: { id: entityId },
      relations: ['user'],
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    report.comment = comment;
    report.reportType = ReportTypeEnum.COMMENT;
    return report;
  }

  private async createUserReport(entityId: number, report: ReportEntity) {
    const user = await this.userRepository.findOne({ where: { id: entityId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    report.user = user;
    report.reportType = ReportTypeEnum.USER;
    return report;
  }

  private async createEventReport(entityId: number, report: ReportEntity) {
    const event = await this.eventRepository.findOne({
      where: { id: entityId },
      relations: ['creator'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    report.event = event;
    report.reportType = ReportTypeEnum.EVENT;
    return report;
  }

  private toReportDto(report: ReportEntity): ReportDto {
    return {
      id: report.id,
      reportType: report.reportType,
      reason: report.reason,
      reasonText: report.reasonText,
      createdAt: report.createdAt,
      status: report.status,
      reporter: {
        id: report.reporter.id,
        username: report.reporter.username,
      },
      event: report.event,
      post: report.post,
      user: report.user,
      comment: report.comment,
      resolvedAt: report.resolvedAt,
      resolvedBy: {
        id: report.resolvedBy?.id,
        username: report.resolvedBy?.username,
      },
      decision: report.decision,
    };
  }
}
