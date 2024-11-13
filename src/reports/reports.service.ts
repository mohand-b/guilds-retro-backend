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

    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.post', 'post')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.event', 'event')
      .orderBy('report.createdAt', 'DESC');

    if (reportTypes && reportTypes.length > 0) {
      query.andWhere('report.reportType IN (:...reportTypes)', { reportTypes });
    }

    const [data, total] = await query.skip(skip).take(take).getManyAndCount();

    return {
      data: data.map((report) => this.toReportDto(report)),
      total,
      page: Number(page),
      limit: Number(limit),
    };
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
    };
  }
}
