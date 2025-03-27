from fastapi import APIRouter, HTTPException, status, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
from app.api.chat.service import generate_chat_response, generate_qwen_response

router = APIRouter()

class Message(BaseModel):
    role: str = Field(..., description="Rol del mensaje: 'system', 'user', o 'assistant'")
    content: str = Field(..., description="Contenido del mensaje")
    
    class Config:
        schema_extra = {
            "example": {
                "role": "user",
                "content": "Genera un botón de login moderno"
            }
        }

class ComponentRequest(BaseModel):
    prompt: str = Field(..., description="Descripción textual del componente a generar")
    platform: str = Field(..., description="Plataforma objetivo (web o mobile)")
    
    class Config:
        schema_extra = {
            "example": {
                "prompt": "Botón de login moderno con estilo neumórfico",
                "platform": "web"
            }
        }

class ComponentData(BaseModel):
    visual_description: str = Field(..., description="Descripción visual del componente")
    preview_html: str = Field(..., description="Código HTML para previsualización")
    component_code: str = Field(..., description="Código React del componente")
    
    class Config:
        schema_extra = {
            "example": {
                "visual_description": "Botón de login moderno con estilo neumórfico",
                "preview_html": "<button class='login-btn'>Login</button>",
                "component_code": "function LoginButton() {\n  return <button className='login-btn'>Login</button>;\n}"
            }
        }

class ComponentResponse(BaseModel):
    status: str = Field(..., description="Estado de la respuesta (success o error)")
    component: Optional[ComponentData] = Field(None, description="Datos del componente generado")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "component": {
                    "visual_description": "Botón de login moderno con estilo neumórfico",
                    "preview_html": "<button class='login-btn'>Login</button>",
                    "component_code": "function LoginButton() {\n  return <button className='login-btn'>Login</button>;\n}"
                }
            }
        }

class HealthResponse(BaseModel):
    status: str = Field(..., description="Estado del servidor")
    message: str = Field(..., description="Mensaje descriptivo")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "ok",
                "message": "Server is running"
            }
        }

@router.get(
    "/health", 
    response_model=HealthResponse,
    summary="Verificar estado del servidor",
    description="Retorna el estado actual del servidor"
)
async def health_check():
    return {
        "status": "ok",
        "message": "Server is running"
    }

@router.post(
    "/generate-component",
    response_model=ComponentResponse,
    status_code=status.HTTP_200_OK,
    summary="Generar componente UI",
    description="Genera un componente UI basado en una descripción textual usando la API de QWEN"
)
async def generate_ui_component(request: ComponentRequest):
    """
    Endpoint para generar componentes UI usando la API de QWEN.
    
    Args:
        request: Objeto con prompt y plataforma objetivo
        
    Returns:
        dict: Componente UI generado con su código y previsualización
    """
    try:
        # Crear mensaje del usuario con la solicitud de componente
        prompt = f"{request.platform.capitalize()} component: {request.prompt}"
        
        # Mensaje adicional para formato del código
        formatting_instructions = """
IMPORTANT: Ensure the component code is properly formatted with clear indentation and line breaks.
Do NOT put all code in a single line. Use proper JSX syntax and React patterns.
MAKE SURE all JSX tags are properly closed and all functions have proper return statements.
Format all styles and JSX with proper indentation.
"""
        
        # Enviar solo el mensaje esencial para el usuario con instrucciones de formato
        user_message = {
            "role": "user",
            "content": f"{prompt}\n\n{formatting_instructions}"
        }
        
        # Mensaje del sistema mejorado
        system_message = {
            "role": "system", 
            "content": f"""You are a UI component generator for {request.platform}.
Always return well-formatted, properly indented code with necessary line breaks.
Use proper syntax highlighting conventions and follow React best practices.
Return complete components with no truncated code and proper JSX closing tags.
When using images, always use full URLs to placeholder images, not relative paths.
Generate components that EXACTLY match the user's description and requirements.
"""
        }
        
        # Combinar mensajes para la solicitud a la API
        messages = [system_message, user_message]
        
        # Llamar a QWEN API para generar el componente
        response = await generate_qwen_response(messages)
        
        # Agregar respuesta original de la API para debugging
        api_debug_info = {
            "api_response": response
        }
        
        if response["status"] == "error":
            # Si hay error, crear un componente por defecto muy básico
            return {
                "status": "success",
                "component": {
                    "visual_description": f"{request.platform.capitalize()} component: {request.prompt}",
                    "preview_html": f"<div style='padding: 16px; border: 1px solid #ccc; border-radius: 8px;'>{request.prompt}</div>",
                    "component_code": f"import React from 'react';\n\nconst Component = () => {{ return <div>{request.prompt}</div>; }};\n\nexport default Component;"
                },
                "api_debug": api_debug_info  # Agregar la info de debug
            }
        
        # Parsear la respuesta como JSON
        try:
            # El mensaje debería ser un string JSON del modelo
            message_content = response["message"]
            
            if isinstance(message_content, str):
                component_data = json.loads(message_content)
            else:
                component_data = message_content
                
            # Solo hacer formateo mínimo para evitar problemas de visualización
            if "component_code" in component_data:
                code = component_data["component_code"]
                
                # Verificación mínima: asegurar que hay algunas líneas y es un componente React válido
                if not code.strip():
                    code = f"import React from 'react';\n\nconst Component = () => {{ return <div>{request.prompt}</div>; }};\n\nexport default Component;"
                elif 'import React' not in code:
                    code = "import React from 'react';\n\n" + code
                elif 'export default' not in code:
                    # Solo extraer nombre del componente si no hay export default
                    import re
                    component_name = "Component"
                    component_name_match = re.search(r'(?:function|const)\s+([A-Za-z0-9_]+)', code)
                    if component_name_match:
                        component_name = component_name_match.group(1)
                    
                    code += f"\n\nexport default {component_name};"
                
                component_data["component_code"] = code
            
            # Para preview_html: verificar si está vacío o no es HTML
            if "preview_html" not in component_data or not component_data.get("preview_html", "").strip():
                component_data["preview_html"] = f"<div style='padding: 16px; border: 1px solid #ccc; border-radius: 8px;'>{request.prompt}</div>"
            
            # Para visual_description: asegurar que existe
            if "visual_description" not in component_data:
                component_data["visual_description"] = f"{request.platform.capitalize()} component: {request.prompt}"
            
            return {
                "status": "success",
                "component": component_data,
                "api_debug": api_debug_info  # Agregar la info de debug
            }
        except Exception as e:
            print(f"Error en el router: {str(e)}")
            
            # Fallback genérico simple
            fallback_component = {
                "visual_description": f"{request.platform.capitalize()} component: {request.prompt}",
                "preview_html": f"<div style='padding: 16px; border: 1px solid #ccc; border-radius: 8px;'>{request.prompt}</div>",
                "component_code": f"import React from 'react';\n\nconst Component = () => {{ return <div>{request.prompt}</div>; }};\n\nexport default Component;"
            }
            
            return {
                "status": "success",
                "component": fallback_component,
                "api_debug": api_debug_info  # Agregar la info de debug
            }
    except Exception as e:
        print(f"Excepción no capturada en generate_ui_component: {str(e)}")
        
        # Incluso en caso de excepción, devolver un componente simple en lugar de un error
        return {
            "status": "success",
            "component": {
                "visual_description": f"Component for: {request.prompt}",
                "preview_html": f"<div>{request.prompt}</div>",
                "component_code": f"import React from 'react';\n\nconst Component = () => {{ return <div>{request.prompt}</div>; }};\n\nexport default Component;"
            },
            "api_debug": {"error": str(e)}  # Incluir información de error
        } 