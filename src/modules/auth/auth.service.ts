import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto, imagenPerfil?: string | null) {
    const user = await this.usersService.create(
      createUserDto,
      imagenPerfil || undefined,
    );

    
    const token = this.generateToken(user._id.toString(), user.perfil);

    
    const userObject = user.toJSON();
    const { contrasena, ...result } = userObject;
    return {
      ...result,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailOrUsername(
      loginDto.usuarioOCorreo,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    
    if (!user.activo) {
      throw new UnauthorizedException(
        'Su cuenta ha sido deshabilitada. Contacte al administrador.',
      );
    }

    
    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.contrasena,
      user.contrasena,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    
    const token = this.generateToken(user._id.toString(), user.perfil);

    
    const userObject = user.toJSON();
    const { contrasena, ...result } = userObject;
    return {
      ...result,
      token,
    };
  }

  async authorize(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      if (!user.activo) {
        throw new UnauthorizedException('Cuenta deshabilitada');
      }

      // Retornar usuario sin contraseña
      const userObject = user.toJSON();
      const { contrasena, ...result } = userObject;
      return result;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.activo) {
        throw new UnauthorizedException('Usuario inválido');
      }

      // Generar nuevo token
      const newToken = this.generateToken(user._id.toString(), user.perfil);

      return { token: newToken };
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private generateToken(userId: string, role: string): string {
    const payload = {
      sub: userId,
      role: role,
    };

    return this.jwtService.sign(payload);
  }
}
