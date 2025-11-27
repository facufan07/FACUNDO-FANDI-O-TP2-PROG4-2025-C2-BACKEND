import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(
    createUserDto: CreateUserDto,
    imagenPerfil?: string,
  ): Promise<UserDocument> {
    // Verificar si el correo ya existe
    const existingEmail = await this.userModel
      .findOne({ correo: createUserDto.correo })
      .exec();
    if (existingEmail) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Verificar si el nombre de usuario ya existe
    const existingUsername = await this.userModel
      .findOne({ nombreUsuario: createUserDto.nombreUsuario })
      .exec();
    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.contrasena, 10);

    // Crear el nuevo usuario
    const newUser = new this.userModel({
      ...createUserDto,
      contrasena: hashedPassword,
      urlImagenPerfil: imagenPerfil || null,
      perfil: createUserDto.perfil || 'usuario',
    });

    return newUser.save();
  }

  async findByEmailOrUsername(
    usuarioOCorreo: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        $or: [{ correo: usuarioOCorreo }, { nombreUsuario: usuarioOCorreo }],
      })
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findAllPaginated(
    offset: number = 0,
    limit: number = 10,
    busqueda?: string,
    rol?: 'usuario' | 'administrador',
  ): Promise<{ usuarios: User[]; total: number }> {
    const query: any = {};

    // Filtro por rol si se proporciona
    if (rol) {
      query.perfil = rol;
    }

    // Filtro de búsqueda por nombre, apellido, correo o nombreUsuario
    if (busqueda) {
      query.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { apellido: { $regex: busqueda, $options: 'i' } },
        { correo: { $regex: busqueda, $options: 'i' } },
        { nombreUsuario: { $regex: busqueda, $options: 'i' } },
      ];
    }

    const [usuarios, total] = await Promise.all([
      this.userModel.find(query).skip(offset).limit(limit).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { usuarios, total };
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Métodos para administradores
  async createByAdmin(
    createAdminUserDto: CreateAdminUserDto,
    imagenPerfil?: string,
  ): Promise<UserDocument> {
    // Verificar si el correo ya existe
    const existingEmail = await this.userModel
      .findOne({ correo: createAdminUserDto.correo })
      .exec();
    if (existingEmail) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Verificar si el nombre de usuario ya existe
    const existingUsername = await this.userModel
      .findOne({ nombreUsuario: createAdminUserDto.nombreUsuario })
      .exec();
    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(
      createAdminUserDto.contrasena,
      10,
    );

    // Crear el nuevo usuario
    const newUser = new this.userModel({
      ...createAdminUserDto,
      contrasena: hashedPassword,
      urlImagenPerfil: imagenPerfil || null,
    });

    return newUser.save();
  }

  async disableUser(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.activo = false;
    return user.save();
  }

  async enableUser(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.activo = true;
    return user.save();
  }

  async updateProfile(
    id: string,
    updateUserDto: UpdateUserDto,
    imagenPerfil?: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se intenta actualizar el correo, verificar que no exista
    if (updateUserDto.correo && updateUserDto.correo !== user.correo) {
      const existingEmail = await this.userModel
        .findOne({ correo: updateUserDto.correo })
        .exec();
      if (existingEmail) {
        throw new ConflictException('El correo ya está registrado');
      }
      user.correo = updateUserDto.correo;
    }

    // Si se intenta actualizar el nombre de usuario, verificar que no exista
    if (
      updateUserDto.nombreUsuario &&
      updateUserDto.nombreUsuario !== user.nombreUsuario
    ) {
      const existingUsername = await this.userModel
        .findOne({ nombreUsuario: updateUserDto.nombreUsuario })
        .exec();
      if (existingUsername) {
        throw new ConflictException('El nombre de usuario ya está registrado');
      }
      user.nombreUsuario = updateUserDto.nombreUsuario;
    }

    // Actualizar otros campos si están presentes
    if (updateUserDto.nombre) user.nombre = updateUserDto.nombre;
    if (updateUserDto.apellido) user.apellido = updateUserDto.apellido;
    if (updateUserDto.descripcion) user.descripcion = updateUserDto.descripcion;
    if (imagenPerfil) user.urlImagenPerfil = imagenPerfil;

    return user.save();
  }
}
