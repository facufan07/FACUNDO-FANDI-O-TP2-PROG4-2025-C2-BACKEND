import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El usuario o correo es requerido' })
  @IsString({ message: 'El usuario o correo debe ser una cadena de texto' })
  usuarioOCorreo: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  contrasena: string;
}
