import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { Event } from './entities/event';
import { EventFeedDto } from './dto/event-feed.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  @UseInterceptors(FileInterceptor('image'))
  createEvent(
    @UploadedFile() file: Express.Multer.File,
    @Body() createEventDto: CreateEventDto,
    @Req() req: any,
  ): Promise<Event> {
    if (file && file.buffer) {
      createEventDto.image = file.buffer;
    }
    const creatorId = req.user.userId;
    return this.eventsService.createEvent(createEventDto, creatorId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async cancelEvent(
    @Param('id') eventId: number,
    @Req() req: any,
  ): Promise<void> {
    const userId = req.user.userId;
    return this.eventsService.cancelEvent(eventId, userId);
  }

  @Get()
  getEvents(): Promise<Event[]> {
    return this.eventsService.getEvents();
  }

  @Get('accessible')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  getAccessibleEvents(@Req() req: any): Promise<Event[]> {
    const userId = req.user.userId;
    return this.eventsService.getAccessibleEvents(userId);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  joinEvent(
    @Body('eventId') eventId: number,
    @Req() req: any,
  ): Promise<EventFeedDto> {
    const userId = req.user.userId;
    return this.eventsService.joinEvent(eventId, userId);
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  withdrawFromEvent(
    @Body('eventId') eventId: number,
    @Req() req: any,
  ): Promise<EventFeedDto> {
    const userId = req.user.userId;
    return this.eventsService.withdrawFromEvent(eventId, userId);
  }

  @Get(':eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  getEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: any,
  ): Promise<Event> {
    const userId = req.user.userId;
    return this.eventsService.getEventById(eventId, userId);
  }
}
