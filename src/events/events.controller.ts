import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { Event } from './entities/event.entity';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  createEvent(
    @Body() createEventDto: CreateEventDto,
    @Req() req: any,
  ): Promise<Event> {
    const creatorId = req.user.userId;
    return this.eventsService.createEvent(createEventDto, creatorId);
  }

  @Get()
  getEvents(): Promise<Event[]> {
    return this.eventsService.getEvents();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  getAccessibleEvents(@Req() req: any): Promise<Event[]> {
    const userId = req.user.userId;
    return this.eventsService.getAccessibleEvents(userId);
  }

  @Post('join')
  joinEvent(@Body() joinEventDto: JoinEventDto): Promise<Event> {
    return this.eventsService.joinEvent(joinEventDto);
  }
}
