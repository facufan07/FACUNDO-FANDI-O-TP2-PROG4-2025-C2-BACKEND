import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { QueryStatisticsDto } from './dto/query-statistics.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('statistics')
@UseGuards(JwtAuthGuard, AdminGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('posts-by-user')
  @HttpCode(HttpStatus.OK)
  async getPostsByUser(@Query() queryDto: QueryStatisticsDto) {
    return this.statisticsService.getPostsByUser(queryDto);
  }

  @Get('comments-by-timeframe')
  @HttpCode(HttpStatus.OK)
  async getCommentsByTimeframe(@Query() queryDto: QueryStatisticsDto) {
    return this.statisticsService.getCommentsByTimeframe(queryDto);
  }

  @Get('comments-by-post')
  @HttpCode(HttpStatus.OK)
  async getCommentsByPost(@Query() queryDto: QueryStatisticsDto) {
    return this.statisticsService.getCommentsByPost(queryDto);
  }

  @Get('users-by-date')
  @HttpCode(HttpStatus.OK)
  async getUsersByDate(@Query() queryDto: QueryStatisticsDto) {
    return this.statisticsService.getUsersByDate(queryDto);
  }
}
