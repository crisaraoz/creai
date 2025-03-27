import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

class Settings(BaseSettings):
    # Configuración del proyecto
    PROJECT_NAME: str = "CreAI Component Generator"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Claves de API
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    QWEN_API_KEY: str = os.getenv("QWEN_API_KEY", "")
    QWEN_API_BASE_URL: str = os.getenv("QWEN_API_BASE_URL", "https://api.qwen.ai/v1")
    
    # Configuración de la base de datos (si se usa en el futuro)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Crear instancia de configuración
settings = Settings() 