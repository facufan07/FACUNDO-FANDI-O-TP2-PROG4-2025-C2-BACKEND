import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPostDto {
  @IsOptional()
  @IsString({ message: 'El ordenamiento debe ser una cadena de texto' })
  @IsIn(['fecha', 'meGusta'], {
    message: 'El ordenamiento debe ser "fecha" o "meGusta"',
  })
  ordenamiento?: string = 'fecha';

  @IsOptional()
  @IsString({ message: 'El ID del usuario debe ser una cadena de texto' })
  usuario?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El offset debe ser un número entero' })
  @Min(0, { message: 'El offset no puede ser negativo' })
  offset?: number = 0;
}
