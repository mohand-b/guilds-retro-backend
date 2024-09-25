export class EventStatsDto {
  totalEvents: number;
  totalEventsByType: Record<string, number>;
  averageEventsPerWeek: number;
  averageEventsPerMonth: number;
}
