import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'publicaciones'),
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `post-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(
            new Error('Solo se permiten imágenes (jpg, jpeg, png, gif)'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async create(
    @Body() createPostDto: CreatePostDto,
    @GetUser('sub') usuarioId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const appUrl = this.configService.get<string>('app.url');
    const urlImagen = file ? `${appUrl}/uploads/publicaciones/${file.filename}` : undefined;
    return this.postsService.create(createPostDto, usuarioId, urlImagen);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() queryDto: QueryPostDto) {
    return this.postsService.findAll(queryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @GetUser('sub') usuarioId: string,
    @GetUser('role') userRole: string,
  ) {
    const esAdmin = userRole === 'administrador';
    return this.postsService.remove(id, usuarioId, esAdmin);
  }

  @Post(':id/me-gusta')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addLike(
    @Param('id') id: string,
    @GetUser('sub') usuarioId: string,
  ) {
    return this.postsService.addLike(id, usuarioId);
  }

  @Delete(':id/me-gusta')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeLike(
    @Param('id') id: string,
    @GetUser('sub') usuarioId: string,
  ) {
    return this.postsService.removeLike(id, usuarioId);
  }
}
