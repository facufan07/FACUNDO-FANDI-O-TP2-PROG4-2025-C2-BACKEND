import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @GetUser('sub') usuarioId: string,
  ) {
    return this.commentsService.create(postId, createCommentDto, usuarioId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findByPost(
    @Param('postId') postId: string,
    @Query() queryDto: QueryCommentDto,
  ) {
    return this.commentsService.findByPost(postId, queryDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetUser('sub') usuarioId: string,
  ) {
    return this.commentsService.update(id, updateCommentDto, usuarioId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('postId') postId: string,
    @Param('id') id: string,
    @GetUser('sub') usuarioId: string,
  ) {
    return this.commentsService.remove(id, usuarioId);
  }
}
