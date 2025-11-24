import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UsersService } from './users.service';
import { PostsService } from '../posts/posts.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @Get(':id/perfil')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Param('id') id: string) {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener las últimas 3 publicaciones del usuario
    const posts = await this.postsService.getMyPosts(id, 3);

    // Retornar el usuario sin la contraseña
    const userObject = user.toJSON();
    const { contrasena, ...result } = userObject;

    return {
      ...result,
      publicaciones: posts,
    };
  }

  // Rutas de administración
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const users = await this.usersService.findAll();
    // Retornar usuarios sin contraseñas
    return users.map((user: any) => {
      const userObject = user.toJSON ? user.toJSON() : user;
      const { contrasena, ...result } = userObject;
      return result;
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('imagenPerfil', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'perfiles'),
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `perfil-${uniqueSuffix}${ext}`);
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
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async create(
    @Body() createAdminUserDto: CreateAdminUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagenPerfil = file ? `http://localhost:3001/uploads/perfiles/${file.filename}` : undefined;
    const user = await this.usersService.createByAdmin(
      createAdminUserDto,
      imagenPerfil,
    );

    // Retornar usuario sin contraseña
    const userObject = user.toJSON();
    const { contrasena, ...result } = userObject;
    return result;
  }

  @Delete(':id/disable')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async disableUser(@Param('id') id: string) {
    const user = await this.usersService.disableUser(id);
    const userObject = user.toJSON();
    const { contrasena, ...result } = userObject;
    return result;
  }

  @Post(':id/enable')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async enableUser(@Param('id') id: string) {
    const user = await this.usersService.enableUser(id);
    const userObject = user.toJSON();
    const { contrasena, ...result } = userObject;
    return result;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('imagenPerfil', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'perfiles'),
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `perfil-${uniqueSuffix}${ext}`);
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
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async updateProfile(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagenPerfil = file ? `http://localhost:3001/uploads/perfiles/${file.filename}` : undefined;
    const user = await this.usersService.updateProfile(id, updateUserDto, imagenPerfil);

    // Retornar usuario sin contraseña
    const userObject = user.toJSON();
    const { contrasena, ...result } = userObject;
    return result;
  }
}
