import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(
    createPostDto: CreatePostDto,
    usuarioId: string,
    urlImagen?: string,
  ): Promise<PostDocument> {
    const newPost = new this.postModel({
      ...createPostDto,
      usuario: usuarioId,
      urlImagen: urlImagen || null,
    });

    return newPost.save();
  }

  async findAll(queryDto: QueryPostDto) {
    const { ordenamiento, usuario, limit = 10, offset = 0 } = queryDto;

    // Construir el filtro
    const filter: any = { activo: true };
    if (usuario) {
      filter.usuario = usuario;
    }

    let posts;

    // Si ordenamos por popularidad, usamos aggregation pipeline
    if (ordenamiento === 'meGusta') {
      posts = await this.postModel.aggregate([
        { $match: filter },
        {
          $addFields: {
            meGustaCount: { $size: '$meGusta' },
          },
        },
        { $sort: { meGustaCount: -1, createdAt: -1 } },
        { $skip: offset },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'usuario',
            foreignField: '_id',
            as: 'usuario',
          },
        },
        { $unwind: '$usuario' },
        {
          $project: {
            'usuario.contrasena': 0,
            meGustaCount: 0,
          },
        },
      ]);
    } else {
      // Ordenar por fecha (más reciente primero)
      posts = await this.postModel
        .find(filter)
        .populate('usuario', 'nombre apellido nombreUsuario urlImagenPerfil')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec();
    }

    const total = await this.postModel.countDocuments(filter);

    return {
      posts,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const post = await this.postModel
      .findOne({ _id: id, activo: true })
      .populate('usuario', 'nombre apellido nombreUsuario urlImagenPerfil')
      .exec();

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return post;
  }

  async remove(id: string, usuarioId: string, esAdmin: boolean = false) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const post = await this.postModel.findById(id);

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (!post.activo) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Verificar que sea el creador o un administrador
    if (post.usuario.toString() !== usuarioId && !esAdmin) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta publicación',
      );
    }

    // Baja lógica
    post.activo = false;
    await post.save();

    return { message: 'Publicación eliminada exitosamente' };
  }

  async addLike(postId: string, usuarioId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const post = await this.postModel.findOne({ _id: postId, activo: true });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const userObjectId = new Types.ObjectId(usuarioId);

    // Verificar si el usuario ya dio like
    const yaLeDioLike = post.meGusta.some(
      (id) => id.toString() === usuarioId,
    );

    if (yaLeDioLike) {
      throw new BadRequestException('Ya le diste me gusta a esta publicación');
    }

    post.meGusta.push(userObjectId);
    await post.save();

    return { message: 'Me gusta agregado', publicacion: post };
  }

  async removeLike(postId: string, usuarioId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const post = await this.postModel.findOne({ _id: postId, activo: true });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Verificar si el usuario había dado like
    const indexLike = post.meGusta.findIndex(
      (id) => id.toString() === usuarioId,
    );

    if (indexLike === -1) {
      throw new BadRequestException('No habías dado me gusta a esta publicación');
    }

    post.meGusta.splice(indexLike, 1);
    await post.save();

    return { message: 'Me gusta eliminado', publicacion: post };
  }

  async getMyPosts(usuarioId: string, limit: number = 3) {
    return this.postModel
      .find({ usuario: usuarioId, activo: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
