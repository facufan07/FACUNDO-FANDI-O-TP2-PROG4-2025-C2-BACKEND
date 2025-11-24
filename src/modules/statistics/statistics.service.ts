import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { QueryStatisticsDto } from './dto/query-statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getPostsByUser(queryDto: QueryStatisticsDto) {
    const { fechaInicio, fechaFin } = queryDto;

    const results = await this.postModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin),
          },
          activo: true,
        },
      },
      {
        $group: {
          _id: '$usuario',
          cantidad: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      {
        $unwind: '$usuario',
      },
      {
        $project: {
          _id: 0,
          usuarioId: '$_id',
          nombreUsuario: '$usuario.nombreUsuario',
          nombre: '$usuario.nombre',
          apellido: '$usuario.apellido',
          cantidad: 1,
        },
      },
      {
        $sort: { cantidad: -1 },
      },
    ]);

    return results;
  }

  async getCommentsByTimeframe(queryDto: QueryStatisticsDto) {
    const { fechaInicio, fechaFin } = queryDto;

    const total = await this.commentModel.countDocuments({
      createdAt: {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin),
      },
    });

    // Agrupar por día
    const byDay = await this.commentModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          fecha: '$_id',
          cantidad: 1,
        },
      },
    ]);

    return {
      total,
      porDia: byDay,
    };
  }

  async getCommentsByPost(queryDto: QueryStatisticsDto) {
    const { fechaInicio, fechaFin } = queryDto;

    const results = await this.commentModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin),
          },
        },
      },
      {
        $group: {
          _id: '$publicacion',
          cantidad: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: '_id',
          as: 'publicacion',
        },
      },
      {
        $unwind: '$publicacion',
      },
      {
        $project: {
          _id: 0,
          publicacionId: '$_id',
          titulo: '$publicacion.titulo',
          cantidad: 1,
        },
      },
      {
        $sort: { cantidad: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    return results;
  }

  async getUsersByDate(queryDto: QueryStatisticsDto) {
    const { fechaInicio, fechaFin } = queryDto;

    const total = await this.userModel.countDocuments({
      createdAt: {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin),
      },
    });

    // Agrupar por día
    const byDay = await this.userModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          fecha: '$_id',
          cantidad: 1,
        },
      },
    ]);

    return {
      total,
      porDia: byDay,
    };
  }
}
