export class EventStatsDto {
  averageEventsPerWeek: number;
  averageEventsPerMonth: number;
  averageEventsByTypePerWeek: Record<string, number>;
  averageEventsByTypePerMonth: Record<string, number>;
}
