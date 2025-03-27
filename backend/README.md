# CreAI Component Generator Backend

Este es el backend para el generador de componentes UI utilizando la API de QWEN/OpenAI. El backend se encarga de comunicarse con estas APIs para generar componentes UI basados en descripciones textuales.

## Requisitos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- Una clave API de QWEN o OpenAI

## Configuración

1. Clona este repositorio:
```bash
git clone <url-del-repo>
cd <nombre-del-repo>/backend_nuevo
```

2. Crea un entorno virtual (recomendado):
```bash
python -m venv venv
```

3. Activa el entorno virtual:
   - En Windows:
   ```bash
   venv\Scripts\activate
   ```
   - En macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

5. Configura las variables de entorno:
   - Edita el archivo `.env` en la raíz del directorio backend_nuevo
   - Actualiza las siguientes variables con tus claves API:
   ```
   # Puedes usar la API de QWEN
   QWEN_API_KEY=tu_clave_api_de_qwen
   QWEN_API_BASE_URL=https://api.qwen.ai/v1
   
   # O la API de OpenAI como alternativa
   OPENAI_API_KEY=tu_clave_api_de_openai
   ```

### Cómo obtener las claves API:

#### QWEN API Key:
1. Regístrate en [QWEN API](https://api.qwen.ai)
2. Ve a tu panel de control o sección de API Keys
3. Genera una nueva clave API
4. Copia la clave y colócala en el archivo .env

#### OpenAI API Key:
1. Regístrate en [OpenAI Platform](https://platform.openai.com)
2. Ve a la sección de API Keys
3. Genera una nueva clave API (Secret Key)
4. Copia la clave y colócala en el archivo .env

## Ejecución

Para iniciar el servidor de desarrollo:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

El servidor estará disponible en `http://localhost:8000`.

## Uso

### Verificación de estado

```
GET /api/v1/health
```

Respuesta:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Generación de componentes

```
POST /api/v1/generate-component
```

Cuerpo de la petición (JSON):
```json
{
  "prompt": "Botón de login moderno con estilo neumórfico",
  "platform": "web"  // "web" o "mobile"
}
```

Respuesta:
```json
{
  "status": "success",
  "component": {
    "visual_description": "Descripción del componente generado",
    "preview_html": "<button class='login-button'>Login</button>",
    "component_code": "// Código del componente React\nfunction LoginButton() {\n  return <button className='login-button'>Login</button>;\n}"
  }
}
```

## Documentación API

La documentación de la API está disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Problemas comunes

### La API no responde

Asegúrate de que:
1. La clave API es correcta (QWEN o OpenAI)
2. La URL base de la API es correcta
3. Tienes saldo suficiente en tu cuenta

### Errores de CORS

El backend está configurado para permitir solicitudes desde cualquier origen en modo desarrollo.
Si necesitas restricciones en producción, modifica la configuración CORS en `app/main.py`. 