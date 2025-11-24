# Red Social - Backend

API REST desarrollada con NestJS para una aplicación de red social.

## Descripción

Backend de una aplicación de red social que permite a los usuarios registrarse, hacer publicaciones, comentar y dar "me gusta" a las publicaciones de otros usuarios.

## Tecnologías

- NestJS v11
- MongoDB con Mongoose
- TypeScript
- JWT para autenticación (Sprint 3)
- Bcrypt para encriptación de contraseñas
- Multer para manejo de archivos

## Configuración del Proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar MongoDB

Asegúrate de tener MongoDB instalado y corriendo en tu máquina local, o configura una URI de MongoDB Atlas.

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (ya existe un ejemplo):

```env
MONGODB_URI=mongodb://localhost:27017/red-social
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRATION=15m
PORT=3000
UPLOAD_PATH=./uploads
```

### 4. Iniciar el servidor

```bash
# Modo desarrollo
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

El servidor estará disponible en `http://localhost:3000`

## API Endpoints - Sprint #1

### Autenticación

#### POST /auth/registro
Registra un nuevo usuario en el sistema.

**Body (multipart/form-data):**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan@example.com",
  "nombreUsuario": "juanperez",
  "contrasena": "Password123",
  "fechaNacimiento": "1990-01-01",
  "descripcion": "Desarrollador de software",
  "imagenPerfil": [archivo]
}
```

**Validaciones:**
- Contraseña: mínimo 8 caracteres, una mayúscula y un número
- Correo y nombre de usuario deben ser únicos
- Imagen: solo jpg, jpeg, png, gif - máximo 5MB

**Respuesta exitosa (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan@example.com",
  "nombreUsuario": "juanperez",
  "fechaNacimiento": "1990-01-01T00:00:00.000Z",
  "descripcion": "Desarrollador de software",
  "urlImagenPerfil": "/uploads/perfiles/perfil-1234567890.jpg",
  "perfil": "usuario",
  "activo": true
}
```

#### POST /auth/login
Inicia sesión con correo/usuario y contraseña.

**Body:**
```json
{
  "usuarioOCorreo": "juan@example.com",
  "contrasena": "Password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan@example.com",
  "nombreUsuario": "juanperez",
  "fechaNacimiento": "1990-01-01T00:00:00.000Z",
  "descripcion": "Desarrollador de software",
  "urlImagenPerfil": "/uploads/perfiles/perfil-1234567890.jpg",
  "perfil": "usuario",
  "activo": true
}
```

**Errores:**
- 401: Credenciales inválidas
- 401: Cuenta deshabilitada

## API Endpoints - Sprint #2

### Publicaciones

#### POST /posts
Crea una nueva publicación.

**Body (multipart/form-data):**
```json
{
  "titulo": "Mi primera publicación",
  "mensaje": "Este es el contenido de mi publicación",
  "usuarioId": "507f1f77bcf86cd799439011",
  "imagen": [archivo opcional]
}
```

**Validaciones:**
- Título y mensaje son requeridos
- Imagen: solo jpg, jpeg, png, gif - máximo 10MB

**Respuesta exitosa (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "titulo": "Mi primera publicación",
  "mensaje": "Este es el contenido de mi publicación",
  "usuario": "507f1f77bcf86cd799439011",
  "urlImagen": "/uploads/publicaciones/post-1234567890.jpg",
  "meGusta": [],
  "activo": true,
  "createdAt": "2025-01-19T10:00:00.000Z",
  "updatedAt": "2025-01-19T10:00:00.000Z"
}
```

#### GET /posts
Obtiene el listado de publicaciones con paginación y ordenamiento.

**Query Parameters:**
- `ordenamiento`: "fecha" (default) | "meGusta"
- `usuario`: ID del usuario para filtrar sus publicaciones
- `limit`: Cantidad de publicaciones (default: 10)
- `offset`: Desde qué publicación empezar (default: 0)

**Ejemplo:**
```
GET /posts?ordenamiento=meGusta&limit=20&offset=0
```

**Respuesta exitosa (200):**
```json
{
  "posts": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "titulo": "Mi primera publicación",
      "mensaje": "Este es el contenido",
      "usuario": {
        "_id": "507f1f77bcf86cd799439011",
        "nombre": "Juan",
        "apellido": "Pérez",
        "nombreUsuario": "juanperez",
        "urlImagenPerfil": "/uploads/perfiles/perfil-123.jpg"
      },
      "urlImagen": "/uploads/publicaciones/post-1234567890.jpg",
      "meGusta": ["507f1f77bcf86cd799439013"],
      "activo": true,
      "createdAt": "2025-01-19T10:00:00.000Z"
    }
  ],
  "total": 50,
  "limit": 10,
  "offset": 0
}
```

#### GET /posts/:id
Obtiene una publicación específica por ID.

**Respuesta exitosa (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "titulo": "Mi primera publicación",
  "mensaje": "Este es el contenido de mi publicación",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan",
    "apellido": "Pérez"
  },
  "meGusta": [],
  "createdAt": "2025-01-19T10:00:00.000Z"
}
```

**Errores:**
- 400: ID inválido
- 404: Publicación no encontrada

#### DELETE /posts/:id
Elimina (baja lógica) una publicación. Solo el creador o un administrador pueden eliminarla.

**Body:**
```json
{
  "usuarioId": "507f1f77bcf86cd799439011",
  "esAdmin": false
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Publicación eliminada exitosamente"
}
```

**Errores:**
- 400: ID inválido
- 404: Publicación no encontrada
- 403: No tienes permisos para eliminar esta publicación

#### POST /posts/:id/me-gusta
Agrega un "me gusta" a una publicación. Un usuario solo puede dar un "me gusta" por publicación.

**Body:**
```json
{
  "usuarioId": "507f1f77bcf86cd799439011"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Me gusta agregado",
  "totalMeGusta": 5
}
```

**Errores:**
- 400: Ya le diste me gusta a esta publicación
- 404: Publicación no encontrada

#### DELETE /posts/:id/me-gusta
Elimina un "me gusta" de una publicación. Solo si el usuario previamente lo había dado.

**Body:**
```json
{
  "usuarioId": "507f1f77bcf86cd799439011"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Me gusta eliminado",
  "totalMeGusta": 4
}
```

**Errores:**
- 400: No habías dado me gusta a esta publicación
- 404: Publicación no encontrada

### Usuarios

#### GET /users/:id/perfil
Obtiene el perfil de un usuario con sus últimas 3 publicaciones.

**Respuesta exitosa (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan@example.com",
  "nombreUsuario": "juanperez",
  "fechaNacimiento": "1990-01-01T00:00:00.000Z",
  "descripcion": "Desarrollador de software",
  "urlImagenPerfil": "/uploads/perfiles/perfil-1234567890.jpg",
  "perfil": "usuario",
  "activo": true,
  "publicaciones": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "titulo": "Mi publicación",
      "mensaje": "Contenido",
      "meGusta": [],
      "createdAt": "2025-01-19T10:00:00.000Z"
    }
  ]
}
```

**Errores:**
- 404: Usuario no encontrado

## API Endpoints - Sprint #3

### Comentarios

#### POST /posts/:postId/comments
Agrega un comentario a una publicación.

**Body:**
```json
{
  "mensaje": "Excelente publicación!",
  "usuarioId": "507f1f77bcf86cd799439011"
}
```

**Respuesta exitosa (201):**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "publicacion": "507f1f77bcf86cd799439012",
  "usuario": "507f1f77bcf86cd799439011",
  "mensaje": "Excelente publicación!",
  "modificado": false,
  "createdAt": "2025-01-19T10:00:00.000Z",
  "updatedAt": "2025-01-19T10:00:00.000Z"
}
```

**Errores:**
- 400: ID de publicación inválido

#### GET /posts/:postId/comments
Obtiene los comentarios de una publicación con paginación.

**Query Parameters:**
- `limit`: Cantidad de comentarios (default: 10)
- `offset`: Desde qué comentario empezar (default: 0)

**Ejemplo:**
```
GET /posts/507f1f77bcf86cd799439012/comments?limit=20&offset=0
```

**Respuesta exitosa (200):**
```json
{
  "comentarios": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "publicacion": "507f1f77bcf86cd799439012",
      "usuario": {
        "_id": "507f1f77bcf86cd799439011",
        "nombre": "Juan",
        "apellido": "Pérez",
        "nombreUsuario": "juanperez",
        "urlImagenPerfil": "/uploads/perfiles/perfil-123.jpg"
      },
      "mensaje": "Excelente publicación!",
      "modificado": false,
      "createdAt": "2025-01-19T10:00:00.000Z"
    }
  ],
  "total": 50,
  "limit": 10,
  "offset": 0
}
```

**Errores:**
- 400: ID de publicación inválido

#### PUT /posts/:postId/comments/:id
Modifica un comentario. Solo el creador puede modificarlo.

**Body:**
```json
{
  "mensaje": "Comentario editado",
  "usuarioId": "507f1f77bcf86cd799439011"
}
```

**Respuesta exitosa (200):**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "publicacion": "507f1f77bcf86cd799439012",
  "usuario": "507f1f77bcf86cd799439011",
  "mensaje": "Comentario editado",
  "modificado": true,
  "createdAt": "2025-01-19T10:00:00.000Z",
  "updatedAt": "2025-01-19T10:05:00.000Z"
}
```

**Errores:**
- 400: ID de comentario inválido
- 404: Comentario no encontrado
- 403: No tienes permisos para modificar este comentario

### Autenticación JWT

#### POST /auth/autorizar
Valida un token JWT y devuelve los datos del usuario.

**Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta exitosa (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan@example.com",
  "nombreUsuario": "juanperez",
  "perfil": "usuario",
  "activo": true
}
```

**Errores:**
- 401: Token inválido o expirado
- 401: Usuario no encontrado
- 401: Cuenta deshabilitada

#### POST /auth/refrescar
Refresca un token JWT válido, generando uno nuevo con 15 minutos de validez.

**Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta exitosa (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoidXN1YXJpbyIsImlhdCI6MTY0Mjc1MjAwMCwiZXhwIjoxNjQyNzUyOTAwfQ..."
}
```

**Errores:**
- 401: Token inválido o expirado
- 401: Usuario inválido

### Cambios en Endpoints Existentes

**POST /auth/registro y POST /auth/login** ahora también devuelven un token JWT:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan@example.com",
  "nombreUsuario": "juanperez",
  "perfil": "usuario",
  "activo": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Estructura del Proyecto

```
src/
├── modules/
│   ├── auth/              # Módulo de autenticación
│   │   ├── dto/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/             # Módulo de usuarios
│   │   ├── dto/
│   │   ├── schemas/
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── posts/             # Módulo de publicaciones (Sprint 2+)
├── config/                # Configuración
│   └── configuration.ts
├── app.module.ts
└── main.ts
```

## Progreso por Sprint

### Sprint #1 - Completado ✓
- [x] Configuración de MongoDB
- [x] Módulo de usuarios con schema
- [x] Módulo de autenticación
- [x] Registro de usuarios con imagen de perfil
- [x] Login con validación de credenciales
- [x] Encriptación de contraseñas con bcrypt
- [x] Validaciones con class-validator
- [x] Manejo de archivos con multer
- [x] Status HTTP correctos

### Sprint #2 - Completado ✓
- [x] Módulo de publicaciones completo
- [x] CRUD de publicaciones (crear, listar, eliminar)
- [x] Sistema de "me gusta" (agregar y quitar)
- [x] Paginación y ordenamiento (por fecha o por me gusta)
- [x] Filtro de publicaciones por usuario
- [x] Endpoint de perfil con últimas 3 publicaciones
- [x] Baja lógica de publicaciones
- [x] Validación de permisos (solo el creador o admin puede eliminar)

### Sprint #3 - Completado ✓
- [x] Sistema de comentarios completo
- [x] CRUD de comentarios (crear, listar, modificar)
- [x] Paginación de comentarios
- [x] Marca de comentarios modificados
- [x] Validación de permisos (solo el creador puede modificar)
- [x] JWT tokens en registro y login
- [x] Ruta de autorización (validar token)
- [x] Ruta de refrescar token
- [x] Tokens con expiración de 15 minutos
- [x] Payload con userId y role

### Sprint #4 - Completado ✓
- [x] Panel de administración de usuarios
- [x] CRUD completo de usuarios (solo admin)
- [x] Alta y baja lógica de usuarios
- [x] Creación de usuarios con perfil seleccionable
- [x] Guards JWT para proteger rutas
- [x] Guard de administrador para rutas protegidas
- [x] Estadísticas: Publicaciones por usuario en lapso de tiempo
- [x] Estadísticas: Comentarios en lapso de tiempo
- [x] Estadísticas: Comentarios por publicación en lapso
- [x] Agregaciones de MongoDB para estadísticas
- [x] Protección de rutas admin con JWT + AdminGuard

## API Endpoints - Sprint #4

### Gestión de Usuarios (Admin)

**Nota:** Todas las rutas requieren token JWT con rol de administrador en el header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### GET /users
Lista todos los usuarios del sistema.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan@example.com",
    "nombreUsuario": "juanperez",
    "perfil": "usuario",
    "activo": true
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "nombre": "María",
    "apellido": "García",
    "correo": "maria@example.com",
    "nombreUsuario": "mariagarcia",
    "perfil": "administrador",
    "activo": true
  }
]
```

**Errores:**
- 401: Token inválido o expirado
- 403: Se requieren permisos de administrador

#### POST /users
Crea un nuevo usuario (solo administradores). Permite elegir el perfil.

**Headers:**
```
Authorization: Bearer <token>
```

**Body (multipart/form-data):**
```json
{
  "nombre": "Carlos",
  "apellido": "López",
  "correo": "carlos@example.com",
  "nombreUsuario": "carloslopez",
  "contrasena": "Password123",
  "fechaNacimiento": "1995-05-15",
  "descripcion": "Nuevo usuario del sistema",
  "perfil": "usuario",
  "imagenPerfil": [archivo opcional]
}
```

**Respuesta exitosa (201):**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "nombre": "Carlos",
  "apellido": "López",
  "correo": "carlos@example.com",
  "nombreUsuario": "carloslopez",
  "perfil": "usuario",
  "activo": true,
  "urlImagenPerfil": "/uploads/perfiles/perfil-123456.jpg"
}
```

**Errores:**
- 401: Token inválido o expirado
- 403: Se requieren permisos de administrador
- 409: Correo o nombre de usuario ya registrado

#### DELETE /users/:id/disable
Deshabilita un usuario (baja lógica). El usuario no podrá iniciar sesión.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nombre": "Juan",
  "apellido": "Pérez",
  "activo": false
}
```

**Errores:**
- 401: Token inválido o expirado
- 403: Se requieren permisos de administrador
- 404: Usuario no encontrado

#### POST /users/:id/enable
Rehabilita un usuario previamente deshabilitado.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nombre": "Juan",
  "apellido": "Pérez",
  "activo": true
}
```

**Errores:**
- 401: Token inválido o expirado
- 403: Se requieren permisos de administrador
- 404: Usuario no encontrado

### Estadísticas (Admin)

**Nota:** Todas las rutas requieren token JWT con rol de administrador.

#### GET /statistics/posts-by-user
Cantidad de publicaciones realizadas por cada usuario en un lapso de tiempo.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `fechaInicio`: Fecha de inicio (formato ISO: YYYY-MM-DD)
- `fechaFin`: Fecha de fin (formato ISO: YYYY-MM-DD)

**Ejemplo:**
```
GET /statistics/posts-by-user?fechaInicio=2025-01-01&fechaFin=2025-01-31
```

**Respuesta exitosa (200):**
```json
[
  {
    "usuarioId": "507f1f77bcf86cd799439011",
    "nombreUsuario": "juanperez",
    "nombre": "Juan",
    "apellido": "Pérez",
    "cantidad": 15
  },
  {
    "usuarioId": "507f1f77bcf86cd799439012",
    "nombreUsuario": "mariagarcia",
    "nombre": "María",
    "apellido": "García",
    "cantidad": 8
  }
]
```

**Errores:**
- 401: Token inválido o expirado
- 403: Se requieren permisos de administrador
- 400: Fechas inválidas

#### GET /statistics/comments-by-timeframe
Cantidad de comentarios realizados en un lapso de tiempo, agrupados por día.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `fechaInicio`: Fecha de inicio (formato ISO: YYYY-MM-DD)
- `fechaFin`: Fecha de fin (formato ISO: YYYY-MM-DD)

**Ejemplo:**
```
GET /statistics/comments-by-timeframe?fechaInicio=2025-01-01&fechaFin=2025-01-31
```

**Respuesta exitosa (200):**
```json
{
  "total": 150,
  "porDia": [
    {
      "fecha": "2025-01-01",
      "cantidad": 12
    },
    {
      "fecha": "2025-01-02",
      "cantidad": 18
    },
    {
      "fecha": "2025-01-03",
      "cantidad": 15
    }
  ]
}
```

**Errores:**
- 401: Token inválido o expirado
- 403: Se requieren permisos de administrador
- 400: Fechas inválidas

#### GET /statistics/comments-by-post
Cantidad de comentarios en cada publicación en un lapso de tiempo (top 20).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `fechaInicio`: Fecha de inicio (formato ISO: YYYY-MM-DD)
- `fechaFin`: Fecha de fin (formato ISO: YYYY-MM-DD)

**Ejemplo:**
```
GET /statistics/comments-by-post?fechaInicio=2025-01-01&fechaFin=2025-01-31
```

**Respuesta exitosa (200):**
```json
[
  {
    "publicacionId": "507f1f77bcf86cd799439012",
    "titulo": "Mi primera publicación",
    "cantidad": 45
  },
  {
    "publicacionId": "507f1f77bcf86cd799439013",
    "titulo": "Consejos de programación",
    "cantidad": 32
  }
]
```

**Errores:**
- 401: Token inválido o expirado
- 403: Se requieren permisos de administrador
- 400: Fechas inválidas

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```
