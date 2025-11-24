import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async create(
    publicacionId: string,
    createCommentDto: CreateCommentDto,
    usuarioId: string,
  ): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const newComment = new this.commentModel({
      publicacion: publicacionId,
      usuario: usuarioId,
      mensaje: createCommentDto.mensaje,
    });

    return newComment.save();
  }

  async findByPost(publicacionId: string, queryDto: QueryCommentDto) {
    if (!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const { limit = 10, offset = 0 } = queryDto;

    const comments = await this.commentModel
      .find({ publicacion: publicacionId })
      .populate('usuario', 'nombre apellido nombreUsuario urlImagenPerfil')
      .sort({ createdAt: -1 }) // Más recientes primero
      .skip(offset)
      .limit(limit)
      .exec();

    const total = await this.commentModel.countDocuments({
      publicacion: publicacionId,
    });

    return {
      comentarios: comments,
      total,
      limit,
      offset,
    };
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    usuarioId: string,
  ): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de comentario inválido');
    }

    const comment = await this.commentModel.findById(id);

    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    // Solo el creador puede modificar el comentario
    if (comment.usuario.toString() !== usuarioId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este comentario',
      );
    }

    comment.mensaje = updateCommentDto.mensaje;
    comment.modificado = true;

    return comment.save();
  }

  async remove(id: string, usuarioId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de comentario inválido');
    }

    const comment = await this.commentModel.findById(id);

    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    // Solo el creador puede eliminar el comentario
    // Nota: En el frontend también se verifica si es admin,
    // deberías agregar lógica para permitir que admins también eliminen
    if (comment.usuario.toString() !== usuarioId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este comentario',
      );
    }

    await this.commentModel.findByIdAndDelete(id);

    return { message: 'Comentario eliminado exitosamente' };
  }
}
