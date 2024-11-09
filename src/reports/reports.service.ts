import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ReportEntity } from './entities/report.entity';
import { Event } from '../events/entities/event';
import { ReportDto } from './dto/report.dto';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
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
      case 'post':
        report = await this.createPostReport(entityId, report);
        break;
      case 'user':
        report = await this.createUserReport(entityId, report);
        break;
      case 'event':
        report = await this.createEventReport(entityId, report);
        break;
      default:
        throw new Error('Unsupported entity type for reporting');
    }

    await this.reportRepository.save(report);
    return this.toReportDto(report);
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
    report.reportType = 'post';
    return report;
  }

  private async createUserReport(entityId: number, report: ReportEntity) {
    const user = await this.userRepository.findOne({ where: { id: entityId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    report.user = user;
    report.reportType = 'user';
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
    report.reportType = 'event';
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
