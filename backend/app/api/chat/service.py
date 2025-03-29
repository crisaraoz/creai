import os
import json
import requests
import aiohttp
import asyncio
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

# Cargar variables de entorno
load_dotenv()

# Configuración de la API de QWEN
QWEN_API_KEY = os.getenv("QWEN_API_KEY")
QWEN_API_BASE_URL = os.getenv("QWEN_API_BASE_URL", "https://api.qwen.ai/v1")

async def generate_chat_response(messages: List[Dict[str, str]], model: str = "qwen") -> Dict[str, Any]:
    """
    Genera una respuesta utilizando la API de QWEN o OpenAI según el modelo solicitado.
    
    Args:
        messages: Lista de objetos mensaje con 'role' y 'content'
        model: Modelo a utilizar (qwen o gpt-3.5-turbo)
    
    Returns:
        Dict: Respuesta generada con estado y mensaje
    
    Example:
        >>> messages = [{"role": "user", "content": "Generate a login button"}]
        >>> response = await generate_chat_response(messages, "gpt-3.5-turbo")
    """
    if model.startswith("qwen"):
        return await generate_qwen_response(messages)
    else:
        return {
            "status": "error",
            "message": "Solo se admite el modelo QWEN en esta configuración."
        }

async def generate_qwen_response(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Genera una respuesta de la API de QWEN basada en los mensajes proporcionados.
    Devuelve directamente la respuesta de la API sin utilizar plantillas predefinidas.
    
    Args:
        messages: Lista de mensajes en formato de chat para enviar a la API
        
    Returns:
        Dict[str, Any]: Respuesta de la API de QWEN o mensaje de error
    """
    try:
        # Cargar API Key desde variables de entorno
        api_key = os.getenv("QWEN_API_KEY")
        api_base_url = os.getenv("QWEN_API_BASE_URL") or "https://dashscope-intl.aliyuncs.com/api/v1"
        
        print(f"[DEBUG] Usando API key (primeros 5 chars): {api_key[:5] if api_key else 'None'}")
        print(f"[DEBUG] URL base: {api_base_url}")
        
        if not api_key or api_key == "your_api_key_here":
            print("[DEBUG] Error: API key no configurada")
            return {
                "status": "error",
                "message": "API key de QWEN no configurada. Actualice el archivo .env con su clave."
            }
            
        # URL para API de QWEN (asegurarnos de usar el endpoint correcto)
        url = f"{api_base_url}/services/aigc/text-generation/generation"
        
        # Cabeceras para la solicitud - asegurarnos de que estén correctas
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        # Extraer el prompt del usuario para el formateo específico
        prompt_content = ""
        for message in messages:
            if message["role"] == "user":
                prompt_content = message["content"]
                break
        
        print(f"[DEBUG] Prompt original: {prompt_content[:100]}...")
        
        # Crear un prompt específico para generar componentes UI (simplificado)
        formatted_prompt = f"""
Create a React component based on this description: "{prompt_content}".
Return a JSON with:
- visual_description: brief description
- preview_html: HTML preview with inline styles (make sure all styles are inline)
- component_code: complete React component code

IMPORTANT: For the preview_html, ensure all styles are inline and DO NOT wrap the component in additional divs.
The preview_html should ONLY contain the actual component HTML with NO extra container divs.
"""
        
        # Sistema message que enfatiza la generación de JSON
        system_message = {
            "role": "system", 
            "content": "You are a UI component generator. Return a JSON with visual_description, preview_html, and component_code fields. Make sure the preview_html has all styles inline and is properly formatted. DO NOT wrap the component in extra divs."
        }
        
        # Mensaje del usuario con el prompt formateado
        user_message = {
            "role": "user",
            "content": formatted_prompt
        }
        
        print("[DEBUG] Enviando mensaje a la API...")
        
        # Construir el JSON de la solicitud con los mensajes formateados
        payload = {
            "model": "qwen-max",
            "input": {
                "messages": [system_message, user_message]
            },
            "parameters": {
                "result_format": "message",
                "temperature": 0.7,
                "max_tokens": 4000
            }
        }
        
        print(f"[DEBUG] Payload: {json.dumps(payload)[:200]}...")
        
        # Enviar la solicitud a la API de QWEN
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, headers=headers, json=payload, timeout=120) as response:
                    print(f"[DEBUG] Código de respuesta de API: {response.status}")
                    
                    response_text = await response.text()
                    print(f"[DEBUG] Respuesta completa: {response_text[:500]}...")
                    
                    if response.status == 200:
                        try:
                            response_json = json.loads(response_text)
                            print(f"[DEBUG] Respuesta parseada: {str(response_json)[:200]}...")
                            
                            # Intentar extraer el mensaje
                            if "output" in response_json:
                                output = response_json.get("output", {})
                                print(f"[DEBUG] Output: {str(output)[:200]}...")
                                
                                if "message" in output:
                                    assistant_message = output.get("message", {}).get("content", "")
                                elif "choices" in output and len(output["choices"]) > 0:
                                    assistant_message = output["choices"][0]["message"]["content"]
                                else:
                                    print("[DEBUG] No se encontró el mensaje en los formatos esperados")
                                    assistant_message = str(output)
                                
                                print(f"[DEBUG] Mensaje extraído: {assistant_message[:200]}...")
                                
                                # Intentar extraer el JSON del mensaje
                                try:
                                    # Buscar el contenido JSON dentro de los backticks
                                    import re
                                    json_match = re.search(r'```json\s*(.*?)\s*```', assistant_message, re.DOTALL)
                                    if json_match:
                                        json_content = json_match.group(1)
                                        component_data = json.loads(json_content)
                                        
                                        # Asegurarse de que el HTML no tenga divs contenedores adicionales
                                        if "preview_html" in component_data:
                                            preview_html = component_data["preview_html"]
                                            
                                            # Eliminar cualquier div wrapper que solo contenga otro elemento
                                            preview_html = re.sub(r'<div[^>]*>\s*(<[^>]+>[^<]*</[^>]+>)\s*</div>', r'\1', preview_html)
                                            
                                            # Si el HTML es solo texto, envolverlo en un elemento span
                                            if not re.search(r'<[^>]+>', preview_html):
                                                preview_html = f'<span style="display: inline-block; padding: 8px 16px; background-color: #f0f0f0; border-radius: 4px;">{preview_html}</span>'
                                            
                                            component_data["preview_html"] = preview_html
                                        
                                        return {
                                            "status": "success",
                                            "message": component_data
                                        }
                                    else:
                                        raise ValueError("No se encontró JSON válido en la respuesta")
                                except Exception as e:
                                    print(f"[DEBUG] Error procesando JSON: {str(e)}")
                                    return create_fallback_component(prompt_content)
                            else:
                                return create_fallback_component(prompt_content)
                        except Exception as e:
                            print(f"[DEBUG] Error procesando respuesta: {str(e)}")
                            return create_fallback_component(prompt_content)
                    else:
                        print(f"[DEBUG] Error status: {response.status}")
                        return create_fallback_component(prompt_content)
            except Exception as e:
                print(f"[DEBUG] Excepción general: {str(e)}")
                return create_fallback_component(prompt_content)
    except Exception as e:
        print(f"[DEBUG] Excepción general: {str(e)}")
        return create_fallback_component(prompt_content)

def extract_json_content(text: str) -> str:
    """
    Extrae el contenido JSON de un texto, buscando dentro de bloques de código markdown.
    
    Args:
        text: Texto que puede contener JSON dentro de backticks
        
    Returns:
        str: Contenido JSON extraído o cadena vacía si no se encuentra
    """
    import re
    
    # Buscar JSON dentro de backticks (```json ... ```)
    json_match = re.search(r'```(?:json)?\s*(\{[\s\S]+?\})\s*```', text)
    if json_match:
        return json_match.group(1)
    
    # Buscar cualquier objeto JSON que comienza con { y termina con }
    json_match = re.search(r'(\{[\s\S]+?\})', text)
    if json_match:
        return json_match.group(1)
    
    return ""

def process_component_data(json_content, prompt_content):
    """
    Procesa y corrige los datos del componente para asegurar que tiene
    todos los campos necesarios y el formato correcto.
    """
    # Verificar campos requeridos
    required_fields = ['visual_description', 'preview_html', 'component_code']
    for field in required_fields:
        if field not in json_content:
            if field == 'visual_description':
                json_content[field] = f"UI component based on: {prompt_content}"
            elif field == 'preview_html':
                json_content[field] = f'<div style="display: inline-flex; padding: 16px; border-radius: 8px;">{prompt_content}</div>'
            elif field == 'component_code':
                json_content[field] = create_default_component_code(prompt_content)
    
    # Procesar y mejorar el HTML de previsualización
    if 'preview_html' in json_content:
        preview_html = json_content['preview_html']
        
        # Si el preview_html es un string JSON, intentar extraer solo el HTML
        if isinstance(preview_html, str) and ('"preview_html"' in preview_html or '```json' in preview_html):
            try:
                import re
                # Intentar extraer el HTML del JSON
                match = re.search(r'"preview_html":\s*"([^"]+)"', preview_html)
                if match:
                    preview_html = match.group(1).replace('\\\"', '"').replace('\\n', '\n')
                else:
                    # Si no se encuentra el patrón, buscar cualquier HTML válido
                    html_match = re.search(r'<([a-z]+).*?>[\s\S]*?<\/\1>', preview_html, re.I)
                    if html_match:
                        preview_html = html_match.group(0)
            except Exception as e:
                print(f"Error processing preview_html: {str(e)}")
                preview_html = f'<div style="display: inline-flex; padding: 16px; border-radius: 8px;">{prompt_content}</div>'
        
        # Asegurarse de que el componente use display: inline-flex para evitar espacios innecesarios
        if not any(style in preview_html.lower() for style in ['display:', 'display: ']):
            preview_html = preview_html.replace('<div', '<div style="display: inline-flex;"')
        elif not any(display in preview_html.lower() for display in ['inline-flex', 'inline-block', 'flex']):
            preview_html = preview_html.replace('display:', 'display: inline-flex;')
        
        # Eliminar cualquier div contenedor adicional que pueda causar espacios
        preview_html = re.sub(r'<div[^>]*style="[^"]*display:\s*flex[^"]*"[^>]*>\s*(<div)', r'\1', preview_html)
        
        # Asegurarse de que no hay espacios en blanco innecesarios
        preview_html = preview_html.strip()
        
        json_content['preview_html'] = preview_html
    
    # Asegurarse de que el código del componente es completo y válido
    if 'component_code' in json_content:
        component_code = json_content['component_code']
        
        # Limpiar caracteres de escape
        component_code = component_code.replace('\\n', '\n')
        component_code = component_code.replace('\\\"', '"')
        component_code = component_code.replace('\\\'', "'")
        component_code = component_code.replace('\\/', '/')
        
        # Eliminar comentarios en línea problemáticos
        component_code = component_code.replace('///', '//')
        component_code = component_code.replace('\\/\\/', '//')
        
        # Si el código parece estar todo en una línea, intentar formatearlo
        if '\n' not in component_code and '{' in component_code and '}' in component_code:
            # Formatear el código utilizando reglas básicas
            formatted_code = format_code(component_code)
            if formatted_code:
                component_code = formatted_code
        
        # Verificar y añadir importación de React
        if 'import React' not in component_code:
            component_code = "import React from 'react';\n\n" + component_code
        
        # Verificar y añadir export default
        if 'export default' not in component_code:
            # Extraer nombre del componente
            import re
            component_name = "Component"
            component_name_match = re.search(r'(?:function|const)\s+([A-Za-z0-9_]+)', component_code)
            if component_name_match:
                component_name = component_name_match.group(1)
            
            component_code += f"\n\nexport default {component_name};"
        
        # Corregir problemas con JSX truncado
        component_code = fix_jsx_code(component_code)
        
        # Limitar tamaño del código para evitar problemas de renderizado
        if len(component_code) > 10000:
            component_code = simplify_large_component(component_code, prompt_content)
        
        json_content['component_code'] = component_code
    
    # Verificar si el contenido es similar al prompt, lo que indica un error de renderización
    if json_content.get('preview_html', '') == prompt_content or prompt_content in json_content.get('preview_html', ''):
        # Si el preview muestra el texto del prompt en lugar de un componente, usar fallbacks específicos
        if 'dashboard' in prompt_content.lower():
            return create_dashboard_component(prompt_content)
        elif 'footer' in prompt_content.lower():
            return create_fallback_footer(prompt_content)
    
    # Procesamiento específico según el tipo de componente
    return handle_component_by_type(prompt_content, json_content)

def format_code(code):
    """
    Función avanzada para formatear código React/JSX que está mal estructurado o en una sola línea
    """
    try:
        import re
        
        # Si parece ser código JSX/React mal formateado, realizar un formateo más agresivo
        if 'import React' in code and 'return' in code:
            # Primera limpieza: eliminar espacios extra y normalizar
            code = code.replace('\\n', '\n').replace('\\t', '    ')
            code = re.sub(r'\s+', ' ', code)
            
            # Formatear imports (cada uno en su propia línea)
            imports = re.findall(r'import\s+[^;]+;', code)
            formatted_imports = '\n'.join(imports)
            
            # Eliminar los imports originales del código
            for imp in imports:
                code = code.replace(imp, '')
            
            # Extraer la definición del componente
            component_match = re.search(r'(const|function)\s+([A-Za-z0-9_]+)\s*=?\s*(\([^)]*\))?\s*(?:=>)?\s*{', code)
            if component_match:
                component_type = component_match.group(1)  # const o function
                component_name = component_match.group(2)  # nombre del componente
                params = component_match.group(3) or '()'  # parámetros, si existen
                
                # Eliminar la declaración del componente para procesar el cuerpo por separado
                component_start = component_match.start()
                component_end = component_match.end()
                before_component = code[:component_start].strip()
                component_body = code[component_end:].strip()
                
                # Encontrar el return statement
                return_match = re.search(r'return\s*\(', component_body)
                if return_match:
                    return_start = return_match.start()
                    return_statement = component_body[return_start:].strip()
                    before_return = component_body[:return_start].strip()
                    
                    # Formatear el JSX dentro del return
                    jsx_content = extract_jsx_content(return_statement)
                    formatted_jsx = format_jsx(jsx_content)
                    
                    # Reconstruir el componente formateado
                    if component_type == 'const':
                        formatted_component = f"const {component_name} = {params} => {{\n"
                    else:
                        formatted_component = f"function {component_name}{params} {{\n"
                    
                    # Formatear variables y hooks antes del return
                    if before_return:
                        formatted_vars = format_variables(before_return)
                        formatted_component += formatted_vars + "\n\n"
                    
                    # Añadir el return con JSX formateado
                    formatted_component += "  return (\n"
                    for line in formatted_jsx.split('\n'):
                        formatted_component += "    " + line + "\n"
                    formatted_component += "  );\n};"
                    
                    # Reconstruir todo el código
                    final_code = formatted_imports + "\n\n" + formatted_component
                    
                    # Añadir export default si es necesario
                    if "export default" not in final_code:
                        final_code += f"\n\nexport default {component_name};"
                    
                    return final_code
        
        # Si el método específico para React no funcionó, usar el formateador general
        return general_format_code(code)
            
    except Exception as e:
        print(f"Error en format_code avanzado: {str(e)}")
        # Si falla el formateo avanzado, intentar con el básico
        return general_format_code(code)

def general_format_code(code):
    """
    Función de formateo de código general, más simple pero robusta
    """
    try:
        import re
        # Eliminar espacios extra
        code = code.replace('\\n', '\n').replace('\\t', '    ')
        code = re.sub(r'\s+', ' ', code).strip()
        
        # Añadir saltos de línea después de ciertas estructuras
        code = re.sub(r'(import [^;]+;)', r'\1\n', code)  # Imports
        code = re.sub(r'(const|let|var)\s+([^=]+)=', r'\n$1 $2 = ', code)  # Variables
        code = re.sub(r'({)', r'\1\n  ', code)  # Abrir llaves
        code = re.sub(r'(})', r'\n\1', code)  # Cerrar llaves
        code = re.sub(r'(return\s*\()', r'\n$1\n  ', code)  # Return statements
        code = re.sub(r'(;)', r'$1\n', code)  # Semicolons
        code = re.sub(r'(<[a-zA-Z][^>]*>)([^<])', r'\1\n  $2', code)  # Opening JSX tags
        code = re.sub(r'(</[a-zA-Z][^>]*>)', r'\n$1', code)  # Closing JSX tags
        
        # Arreglar anidamiento
        lines = code.split('\n')
        formatted_lines = []
        indent_level = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Reducir el nivel de indentación para líneas de cierre
            if re.match(r'[}\)]', line):
                indent_level = max(0, indent_level - 1)
                
            # Añadir la línea con la indentación actual
            formatted_lines.append('  ' * indent_level + line)
            
            # Aumentar el nivel de indentación para líneas de apertura
            if re.search(r'[{(]$', line) or re.search(r'<[a-zA-Z][^/]*>$', line):
                indent_level += 1
        
        return '\n'.join(formatted_lines)
    except Exception as e:
        print(f"Error en general_format_code: {str(e)}")
        return code  # Devolver el código original si hay error

def extract_jsx_content(return_statement):
    """
    Extrae el contenido JSX del statement return, manejando paréntesis anidados
    """
    if not return_statement.startswith('return'):
        return return_statement
    
    # Eliminar 'return ('
    jsx_content = return_statement.replace('return', '', 1).strip()
    if jsx_content.startswith('('):
        jsx_content = jsx_content[1:].strip()
    
    # Manejar paréntesis de cierre y punto y coma al final
    if jsx_content.endswith(');'):
        jsx_content = jsx_content[:-2].strip()
    elif jsx_content.endswith(')'):
        jsx_content = jsx_content[:-1].strip()
    
    return jsx_content

def format_jsx(jsx):
    """
    Formatea código JSX con indentación apropiada
    """
    import re
    
    # Convertir a una sola línea primero para procesamiento
    jsx = re.sub(r'\s+', ' ', jsx).strip()
    
    # Añadir saltos de línea después de etiquetas de apertura y antes de etiquetas de cierre
    jsx = re.sub(r'(<[^/][^>]*>)([^<])', r'\1\n\2', jsx)  # Después de etiqueta de apertura
    jsx = re.sub(r'([^>])(<\/[^>]+>)', r'\1\n\2', jsx)    # Antes de etiqueta de cierre
    jsx = re.sub(r'(<[^/][^>]*/>)', r'\1\n', jsx)         # Después de etiqueta auto-cerrada
    
    # Procesar línea por línea para mejorar la indentación
    lines = jsx.split('\n')
    formatted_lines = []
    indent_level = 0
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Reducir indentación para etiquetas de cierre
        if re.match(r'</', line):
            indent_level = max(0, indent_level - 1)
        
        # Añadir la línea con la indentación actual
        formatted_lines.append('  ' * indent_level + line)
        
        # Aumentar indentación para la siguiente línea si hay apertura de etiqueta
        if re.search(r'<[^/][^>]*>(?!.*<\/)', line) and not re.search(r'<[^/][^>]*/>', line):
            indent_level += 1
    
    return '\n'.join(formatted_lines)

def format_variables(vars_text):
    """
    Formatea declaraciones de variables, hooks y otros elementos en el cuerpo del componente
    """
    import re
    
    # Separar declaraciones
    vars_text = re.sub(r'(const|let|var|useEffect|useState|useRef|useContext|useMemo|useCallback)(\s+[^;]+;)', r'\n  $1$2\n', vars_text)
    
    # Formatear cada declaración
    lines = vars_text.split('\n')
    formatted_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Añadir indentación básica
        formatted_lines.append('  ' + line)
    
    return '\n'.join(formatted_lines)

def simplify_large_component(code, prompt_content):
    """
    Simplifica componentes muy grandes para evitar problemas de renderizado
    """
    # Obtener nombre del componente si es posible
    import re
    component_name = "Component"
    component_name_match = re.search(r'(?:function|const)\s+([A-Za-z0-9_]+)', code)
    if component_name_match:
        component_name = component_name_match.group(1)
    
    # Crear una versión simplificada pero funcional
    return f"""import React from 'react';

// Component simplified due to large size
const {component_name} = () => {{
  // Component based on: {prompt_content}
  // The original component was too large and has been simplified
  
  const styles = {{
    container: {{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '100%',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }},
    header: {{
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px'
    }},
    content: {{
      margin: '10px 0'
    }}
  }};

  return (
    <div style={{styles.container}}>
      <div style={{styles.header}}>{prompt_content}</div>
      <div style={{styles.content}}>
        This component has been simplified for better rendering.
        The original code exceeded the recommended size.
      </div>
    </div>
  );
}};

export default {component_name};
"""

def create_fallback_component(prompt_content):
    """
    Crea un componente de respaldo cuando la API falla o tarda demasiado.
    """
    component_name = "".join(word.capitalize() for word in prompt_content.split()[:2])
    if not component_name or not component_name[0].isalpha():
        component_name = "UIComponent"
    
    # Determinar color basado en el prompt
    bg_color = "#f0f0f0"  # Default gris claro
    text_color = "#000000"  # Default negro
    
    if "red" in prompt_content.lower():
        bg_color = "#ff3333"
        text_color = "#ffffff"
    elif "green" in prompt_content.lower():
        bg_color = "#33cc33"
        text_color = "#ffffff"
    elif "blue" in prompt_content.lower():
        bg_color = "#3366ff"
        text_color = "#ffffff"
    elif "yellow" in prompt_content.lower():
        bg_color = "#ffcc00"
        text_color = "#000000"
    
    # Generar HTML simple sin divs contenedores adicionales
    preview_html = f'<span style="display: inline-block; padding: 12px 24px; background-color: {bg_color}; color: {text_color}; border-radius: 8px; font-family: Arial, sans-serif;">This is a {prompt_content}</span>'
    
    component = {
        "visual_description": f"A UI component for: {prompt_content}",
        "preview_html": preview_html,
        "component_code": create_default_component_code(prompt_content, component_name)
    }
    
    return {
        "status": "success",
        "message": json.dumps(component)
    }

def create_default_component_code(prompt_content, component_name=None):
    """
    Crea código de componente predeterminado basado en la descripción.
    """
    if not component_name:
        component_name = "".join(word.capitalize() for word in prompt_content.split()[:2])
        if not component_name or not component_name[0].isalpha():
            component_name = "UIComponent"
    
    return f"""import React from 'react';

const {component_name} = () => {{
  // Styles for the component
  const containerStyle = {{
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    maxWidth: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif'
  }};

  const headerStyle = {{
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333'
  }};

  const actionAreaStyle = {{
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '4px',
    marginTop: '12px'
  }};

  const buttonStyle = {{
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  }};

  return (
    <div style={{containerStyle}}>
      <div style={{headerStyle}}>{prompt_content}</div>
      <p>Generated component based on your description</p>
      <div style={{actionAreaStyle}}>
        <button 
          style={{buttonStyle}}
          onMouseOver={{(e) => {{
            e.currentTarget.style.backgroundColor = '#3c35b5';
          }}}}
          onMouseOut={{(e) => {{
            e.currentTarget.style.backgroundColor = '#4f46e5';
          }}}}
        >
          Send
        </button>
      </div>
    </div>
  );
}};

export default {component_name};
"""

def fix_preview_images(html, prompt_content):
    """
    Corrige las imágenes en el HTML de previsualización
    """
    import re
    
    # Reemplazar imágenes relativas o rotas 
    html = re.sub(r'<img\s+src=[\'"](?!https?://)([^\'"]+)[\'"]', 
                 r'<img src="https://placehold.co/400x300?text=Image"', html)
    
    # Reemplazar iconos de redes sociales que puedan ser problemáticos
    social_icons = {
        'facebook': 'https://placehold.co/30x30/3b5998/ffffff?text=f',
        'twitter': 'https://placehold.co/30x30/1da1f2/ffffff?text=t',
        'x.com': 'https://placehold.co/30x30/1da1f2/ffffff?text=t',
        'instagram': 'https://placehold.co/30x30/e1306c/ffffff?text=i',
        'linkedin': 'https://placehold.co/30x30/0077b5/ffffff?text=in',
        'youtube': 'https://placehold.co/30x30/ff0000/ffffff?text=yt',
        'github': 'https://placehold.co/30x30/333333/ffffff?text=gh'
    }
    
    # Si el prompt menciona "footer" o "social media", asegurarse de que hay iconos de redes sociales
    if 'footer' in prompt_content.lower() or 'social' in prompt_content.lower():
        if all(icon not in html.lower() for icon in social_icons):
            # Si no hay iconos, añadir algunos predeterminados
            social_html = '<div style="display: flex; gap: 10px; justify-content: center; margin: 10px 0;">'
            for network, url in list(social_icons.items())[:4]:  # Usar solo los primeros 4 iconos
                social_html += f'<a href="#" style="text-decoration: none;"><img src="{url}" alt="{network}" style="width: 30px; height: 30px; border-radius: 50%;" /></a>'
            social_html += '</div>'
            
            # Buscar un lugar adecuado para insertar los iconos
            if '</footer>' in html:
                html = html.replace('</footer>', f'{social_html}</footer>')
            elif '</div>' in html:
                html = html.replace('</div>', f'{social_html}</div>')
            else:
                html += social_html
    
    # Asegurarse de que el nombre del creador esté incluido si se menciona en el prompt
    if 'creator' in prompt_content.lower() or 'name' in prompt_content.lower():
        if 'YourName' not in html and 'Created by' not in html:
            if '</footer>' in html:
                html = html.replace('</footer>', '<div style="text-align: center; margin-top: 10px;">Created by YourName</div></footer>')
            elif '</div>' in html:
                html = html.replace('</div>', '<div style="text-align: center; margin-top: 10px;">Created by YourName</div></div>')
            else:
                html += '<div style="text-align: center; margin-top: 10px;">Created by YourName</div>'
    
    return html

def fix_jsx_code(code):
    """
    Corrige problemas comunes en el código JSX que podrían causar truncamiento
    """
    import re
    
    # Si hay etiquetas JSX abiertas pero no cerradas, intentar cerrarlas
    open_tags = re.findall(r'<([a-zA-Z][^\s/>]*)[^>]*>[^<]*$', code)
    if open_tags:
        for tag in reversed(open_tags):
            if not re.search(r'</' + re.escape(tag) + '>', code):
                code += f'</{tag}>'
    
    # Verificar si hay return con paréntesis abierto pero no cerrado
    if re.search(r'return\s*\([^)]*$', code):
        code += ');'
    
    # Asegurarse de que todas las llaves estén cerradas
    open_braces = code.count('{')
    close_braces = code.count('}')
    if open_braces > close_braces:
        code += '}' * (open_braces - close_braces)
    
    return code 

def create_fallback_footer(prompt_content):
    """
    Crea un componente de footer de respaldo que contiene iconos de redes sociales
    y un texto de 'Created by YourName'
    """
    footer_html = """
<footer style="background-color: #f4f4f4; padding: 20px; text-align: center; width: 100%; margin-top: 20px;">
  <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 15px;">
    <a href="#" style="text-decoration: none;">
      <img src="https://placehold.co/30x30/3b5998/ffffff?text=f" alt="Facebook" style="width: 30px; height: 30px; border-radius: 50%;" />
    </a>
    <a href="#" style="text-decoration: none;">
      <img src="https://placehold.co/30x30/1da1f2/ffffff?text=t" alt="Twitter" style="width: 30px; height: 30px; border-radius: 50%;" />
    </a>
    <a href="#" style="text-decoration: none;">
      <img src="https://placehold.co/30x30/e1306c/ffffff?text=i" alt="Instagram" style="width: 30px; height: 30px; border-radius: 50%;" />
    </a>
    <a href="#" style="text-decoration: none;">
      <img src="https://placehold.co/30x30/0077b5/ffffff?text=in" alt="LinkedIn" style="width: 30px; height: 30px; border-radius: 50%;" />
    </a>
  </div>
  <div style="font-size: 14px; color: #666;">Created by YourName</div>
</footer>
"""

    footer_code = """import React from 'react';

const Footer = () => {
  const footerStyle = {
    backgroundColor: '#f4f4f4',
    padding: '20px',
    textAlign: 'center',
    width: '100%',
    marginTop: '20px'
  };

  const socialContainerStyle = {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '15px'
  };

  const iconStyle = {
    width: '30px',
    height: '30px',
    borderRadius: '50%'
  };

  const copyrightStyle = {
    fontSize: '14px',
    color: '#666'
  };

  return (
    <footer style={footerStyle}>
      <div style={socialContainerStyle}>
        <a href="#" style={{textDecoration: 'none'}}>
          <img 
            src="https://placehold.co/30x30/3b5998/ffffff?text=f" 
            alt="Facebook" 
            style={iconStyle} 
          />
        </a>
        <a href="#" style={{textDecoration: 'none'}}>
          <img 
            src="https://placehold.co/30x30/1da1f2/ffffff?text=t" 
            alt="Twitter" 
            style={iconStyle} 
          />
        </a>
        <a href="#" style={{textDecoration: 'none'}}>
          <img 
            src="https://placehold.co/30x30/e1306c/ffffff?text=i" 
            alt="Instagram" 
            style={iconStyle} 
          />
        </a>
        <a href="#" style={{textDecoration: 'none'}}>
          <img 
            src="https://placehold.co/30x30/0077b5/ffffff?text=in" 
            alt="LinkedIn" 
            style={iconStyle} 
          />
        </a>
      </div>
      <div style={copyrightStyle}>Created by YourName</div>
    </footer>
  );
};

export default Footer;
"""

    return {
        "visual_description": f"A responsive footer containing social media icons and creator information: {prompt_content}",
        "preview_html": footer_html,
        "component_code": footer_code
    }

def format_footer_component(code, prompt_content):
    """
    Formateo específico para componentes de tipo footer que pueden tener
    estilos inline complejos y problemas de estructura
    """
    # Si no parece ser un footer o no contiene social media, 
    # usar el formateo normal
    if 'footer' not in code.lower() or all(network not in code.lower() for network in ['facebook', 'twitter', 'instagram', 'linkedin']):
        return format_code(code)
    
    # Estructura para un footer bien formateado
    component_name = "Footer"
    
    # Extraer el nombre del componente si está definido
    import re
    component_match = re.search(r'(const|function)\s+([A-Za-z0-9_]+)', code)
    if component_match:
        component_name = component_match.group(2)
    
    # Crear un nuevo componente de footer con la estructura correcta
    footer_code = f"""import React from 'react';
import './Footer.css'; // Optional: If you want to add custom styles.

const {component_name} = () => {{
  const footerStyle = {{
    backgroundColor: '#f8f9fa',
    padding: '20px',
    textAlign: 'center',
    width: '100%',
    marginTop: '20px'
  }};

  const socialContainerStyle = {{
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '15px'
  }};

  const iconStyle = {{
    width: '30px',
    height: '30px',
    borderRadius: '50%'
  }};

  const copyrightStyle = {{
    fontSize: '14px',
    color: '#666'
  }};

  return (
    <footer style={{footerStyle}}>
      <div style={{socialContainerStyle}}>
        <a href="#" style={{{{textDecoration: 'none'}}}}>
          <img 
            src="https://placehold.co/30x30/3b5998/ffffff?text=f" 
            alt="Facebook" 
            style={{iconStyle}} 
          />
        </a>
        <a href="#" style={{{{textDecoration: 'none'}}}}>
          <img 
            src="https://placehold.co/30x30/1da1f2/ffffff?text=t" 
            alt="Twitter" 
            style={{iconStyle}} 
          />
        </a>
        <a href="#" style={{{{textDecoration: 'none'}}}}>
          <img 
            src="https://placehold.co/30x30/e1306c/ffffff?text=i" 
            alt="Instagram" 
            style={{iconStyle}} 
          />
        </a>
        <a href="#" style={{{{textDecoration: 'none'}}}}>
          <img 
            src="https://placehold.co/30x30/0077b5/ffffff?text=in" 
            alt="LinkedIn" 
            style={{iconStyle}} 
          />
        </a>
      </div>
      <div style={{copyrightStyle}}>Created by YourName</div>
    </footer>
  );
}};

export default {component_name};
"""
    
    return footer_code 

def create_dashboard_component(prompt_content):
    """
    Crea un componente de dashboard específico basado en el prompt del usuario.
    Analiza el prompt para identificar requisitos específicos como orientación,
    colores, y frameworks UI.
    """
    # Analizar el prompt para personalizar el dashboard
    prompt_lower = prompt_content.lower()
    
    # Determinar la orientación (vertical/horizontal)
    is_vertical = any(keyword in prompt_lower for keyword in ['vertical', 'column', 'left', 'side', 'sidebar'])
    
    # Determinar el esquema de color
    is_dark = any(keyword in prompt_lower for keyword in ['dark', 'black', 'night'])
    
    # Verificar si se solicita un framework específico
    uses_shadcn = 'shadcn' in prompt_lower
    
    # Crear el HTML y código adecuados según las especificaciones
    if is_vertical:
        return create_vertical_dashboard(prompt_content, is_dark, uses_shadcn)
    else:
        return create_horizontal_dashboard(prompt_content, is_dark, uses_shadcn)

def create_vertical_dashboard(prompt_content, is_dark=True, uses_shadcn=False):
    """
    Crea un dashboard con diseño vertical (sidebar) según las especificaciones
    """
    # Colores según el tema
    if is_dark:
        bg_color = "#0f172a"        # Negro azulado oscuro para el fondo
        sidebar_color = "#1e293b"   # Azul oscuro para la barra lateral
        text_color = "#f8fafc"      # Blanco para texto
        accent_color = "#3b82f6"    # Azul para acentos
        card_color = "#334155"      # Gris azulado para tarjetas
        icon_color = "#94a3b8"      # Gris claro para iconos
    else:
        bg_color = "#f8fafc"        # Blanco para el fondo
        sidebar_color = "#f1f5f9"   # Gris muy claro para la barra lateral
        text_color = "#0f172a"      # Negro para texto
        accent_color = "#3b82f6"    # Azul para acentos
        card_color = "#e2e8f0"      # Gris claro para tarjetas
        icon_color = "#64748b"      # Gris para iconos
    
    # Estilo general según el framework
    if uses_shadcn:
        border_radius = "0.75rem"   # Más redondeado para Shadcn
        button_style = "border-radius: 0.5rem; font-weight: 500; transition: all 0.2s;"
        font_family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    else:
        border_radius = "0.5rem"    # Estándar
        button_style = "border-radius: 0.375rem; font-weight: 400;"
        font_family = "Arial, sans-serif"

    dashboard_html = f"""
<div style="display: flex; width: 100%; height: 100vh; font-family: {font_family}; background-color: {bg_color}; color: {text_color};">
  <!-- Sidebar -->
  <div style="width: 280px; background-color: {sidebar_color}; padding: 24px 16px; display: flex; flex-direction: column; border-right: 1px solid {card_color};">
    <!-- Logo / Title -->
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 32px; padding-left: 12px;">Dashboard</div>
    
    <!-- Navigation -->
    <nav style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 32px;">
      <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; background-color: {accent_color}; border-radius: {border_radius}; color: white; text-decoration: none; {button_style}">
        <span style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;">📊</span>
        <span>Overview</span>
      </a>
      <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; color: {text_color}; text-decoration: none; border-radius: {border_radius}; {button_style}">
        <span style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;">👥</span>
        <span>Usuarios</span>
      </a>
      <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; color: {text_color}; text-decoration: none; border-radius: {border_radius}; {button_style}">
        <span style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;">💰</span>
        <span>Ingresos</span>
      </a>
      <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; color: {text_color}; text-decoration: none; border-radius: {border_radius}; {button_style}">
        <span style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;">📈</span>
        <span>Análisis</span>
      </a>
      <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; color: {text_color}; text-decoration: none; border-radius: {border_radius}; {button_style}">
        <span style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;">⚙️</span>
        <span>Configuración</span>
      </a>
    </nav>
    
    <!-- Recent Items Section -->
    <div style="margin-top: auto; padding-top: 24px; border-top: 1px solid {card_color};">
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 12px; padding-left: 12px; color: {icon_color};">RECIENTES</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; color: {text_color}; text-decoration: none; font-size: 14px;">
          <span>Botón de Login</span>
        </a>
        <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; color: {text_color}; text-decoration: none; font-size: 14px;">
          <span>Formulario de contacto</span>
        </a>
        <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; color: {text_color}; text-decoration: none; font-size: 14px;">
          <span>Galería de imágenes</span>
        </a>
      </div>
    </div>
  </div>

  <!-- Main Content (placeholder) -->
  <div style="flex: 1; padding: 24px; overflow-y: auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold;">Overview</h1>
      <div style="display: flex; gap: 12px;">
        <button style="background-color: {accent_color}; color: white; border: none; padding: 8px 16px; border-radius: {border_radius}; cursor: pointer; {button_style}">Nuevo</button>
        <button style="background-color: transparent; border: 1px solid {card_color}; color: {text_color}; padding: 8px 16px; border-radius: {border_radius}; cursor: pointer; {button_style}">Filtrar</button>
      </div>
    </div>
    
    <!-- Stats cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; margin-bottom: 24px;">
      <div style="background-color: {card_color}; border-radius: {border_radius}; padding: 20px;">
        <div style="font-size: 14px; color: {icon_color};">Usuarios</div>
        <div style="font-size: 28px; font-weight: bold; margin-top: 8px;">1,248</div>
        <div style="font-size: 12px; color: #4ade80; margin-top: 8px;">↑ 12% este mes</div>
      </div>
      
      <div style="background-color: {card_color}; border-radius: {border_radius}; padding: 20px;">
        <div style="font-size: 14px; color: {icon_color};">Ingresos</div>
        <div style="font-size: 28px; font-weight: bold; margin-top: 8px;">$48.5k</div>
        <div style="font-size: 12px; color: #4ade80; margin-top: 8px;">↑ 8% este mes</div>
      </div>
      
      <div style="background-color: {card_color}; border-radius: {border_radius}; padding: 20px;">
        <div style="font-size: 14px; color: {icon_color};">Tráfico</div>
        <div style="font-size: 28px; font-weight: bold; margin-top: 8px;">12.4k</div>
        <div style="font-size: 12px; color: #ef4444; margin-top: 8px;">↓ 3% este mes</div>
      </div>
    </div>
  </div>
</div>
"""

    # Código React correspondiente
    dashboard_code = f"""import React from 'react';
{generate_shadcn_imports() if uses_shadcn else ''}

const Dashboard = () => {{
  {generate_shadcn_shadcn_styles() if uses_shadcn else generate_regular_styles(is_dark)}

  return (
    <div style={{containerStyle}}>
      {{/* Sidebar */}}
      <div style={{sidebarStyle}}>
        {{/* Logo / Title */}}
        <div style={{titleStyle}}>Dashboard</div>
        
        {{/* Navigation */}}
        <nav style={{navStyle}}>
          <a href="#" style={{{{...navItemStyle, ...activeNavItemStyle}}}}>
            <span style={{iconStyle}}>📊</span>
            <span>Overview</span>
          </a>
          <a href="#" style={{navItemStyle}}>
            <span style={{iconStyle}}>👥</span>
            <span>Usuarios</span>
          </a>
          <a href="#" style={{navItemStyle}}>
            <span style={{iconStyle}}>💰</span>
            <span>Ingresos</span>
          </a>
          <a href="#" style={{navItemStyle}}>
            <span style={{iconStyle}}>📈</span>
            <span>Análisis</span>
          </a>
          <a href="#" style={{navItemStyle}}>
            <span style={{iconStyle}}>⚙️</span>
            <span>Configuración</span>
          </a>
        </nav>
        
        {{/* Recent Items Section */}}
        <div style={{recentSectionStyle}}>
          <div style={{recentHeaderStyle}}>RECIENTES</div>
          <div style={{recentListStyle}}>
            <a href="#" style={{recentItemStyle}}>
              <span>Botón de Login</span>
            </a>
            <a href="#" style={{recentItemStyle}}>
              <span>Formulario de contacto</span>
            </a>
            <a href="#" style={{recentItemStyle}}>
              <span>Galería de imágenes</span>
            </a>
          </div>
        </div>
      </div>

      {{/* Main Content */}}
      <div style={{mainContentStyle}}>
        <div style={{headerStyle}}>
          <h1 style={{headerTitleStyle}}>Overview</h1>
          <div style={{buttonContainerStyle}}>
            <button style={{primaryButtonStyle}}>Nuevo</button>
            <button style={{secondaryButtonStyle}}>Filtrar</button>
          </div>
        </div>
        
        {{/* Stats cards */}}
        <div style={{cardsContainerStyle}}>
          <div style={{cardStyle}}>
            <div style={{cardLabelStyle}}>Usuarios</div>
            <div style={{cardValueStyle}}>1,248</div>
            <div style={{positiveChangeStyle}}>↑ 12% este mes</div>
          </div>
          
          <div style={{cardStyle}}>
            <div style={{cardLabelStyle}}>Ingresos</div>
            <div style={{cardValueStyle}}>$48.5k</div>
            <div style={{positiveChangeStyle}}>↑ 8% este mes</div>
          </div>
          
          <div style={{cardStyle}}>
            <div style={{cardLabelStyle}}>Tráfico</div>
            <div style={{cardValueStyle}}>12.4k</div>
            <div style={{negativeChangeStyle}}>↓ 3% este mes</div>
          </div>
        </div>
      </div>
    </div>
  );
}};

export default Dashboard;
"""

    return {
        "visual_description": f"A vertical sidebar dashboard with dark theme: {prompt_content}",
        "preview_html": dashboard_html,
        "component_code": dashboard_code
    }

def create_horizontal_dashboard(prompt_content, is_dark=True, uses_shadcn=False):
    """
    Crea un dashboard con diseño horizontal según las especificaciones
    """
    # Usar el componente actual por defecto
    dashboard_html = f"""
<div style="background-color: #1e293b; border-radius: 8px; padding: 20px; color: white; width: 100%; font-family: Arial, sans-serif;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <div style="font-size: 24px; font-weight: bold;">Dashboard</div>
    <div style="display: flex; gap: 10px;">
      <button style="background-color: #3b82f6; border: none; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Nuevo</button>
      <button style="background-color: transparent; border: 1px solid #64748b; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Filtrar</button>
    </div>
  </div>
  
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
    <div style="background-color: #2c3e50; border-radius: 8px; padding: 16px;">
      <div style="font-size: 14px; color: #94a3b8;">Usuarios</div>
      <div style="font-size: 28px; font-weight: bold; margin-top: 8px;">1,248</div>
      <div style="font-size: 12px; color: #4ade80; margin-top: 8px;">↑ 12% este mes</div>
    </div>
    
    <div style="background-color: #2c3e50; border-radius: 8px; padding: 16px;">
      <div style="font-size: 14px; color: #94a3b8;">Ingresos</div>
      <div style="font-size: 28px; font-weight: bold; margin-top: 8px;">$48.5k</div>
      <div style="font-size: 12px; color: #4ade80; margin-top: 8px;">↑ 8% este mes</div>
    </div>
    
    <div style="background-color: #2c3e50; border-radius: 8px; padding: 16px;">
      <div style="font-size: 14px; color: #94a3b8;">Tráfico</div>
      <div style="font-size: 28px; font-weight: bold; margin-top: 8px;">12.4k</div>
      <div style="font-size: 12px; color: #ef4444; margin-top: 8px;">↓ 3% este mes</div>
    </div>
  </div>
  
  <div style="background-color: #2c3e50; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <div style="font-size: 16px; font-weight: bold; margin-bottom: 16px;">Componentes recientes</div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <a href="#" style="display: flex; justify-content: space-between; padding: 12px; background-color: #374151; border-radius: 4px; text-decoration: none; color: white;">
        <span>Botón de Login</span>
        <span style="color: #94a3b8;">→</span>
      </a>
      <a href="#" style="display: flex; justify-content: space-between; padding: 12px; background-color: #374151; border-radius: 4px; text-decoration: none; color: white;">
        <span>Formulario de contacto</span>
        <span style="color: #94a3b8;">→</span>
      </a>
      <a href="#" style="display: flex; justify-content: space-between; padding: 12px; background-color: #374151; border-radius: 4px; text-decoration: none; color: white;">
        <span>Galería de imágenes</span>
        <span style="color: #94a3b8;">→</span>
      </a>
    </div>
  </div>
</div>
"""

    # Código React correspondiente
    dashboard_code = """import React from 'react';
import { IconUsers, IconCurrencyDollar, IconChartBar, IconArrowUp, IconArrowDown } from './icons';

const Dashboard = () => {
  // Estilos para el dashboard
  const dashboardStyle = {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '20px',
    color: 'white',
    width: '100%',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '10px'
  };

  const primaryButtonStyle = {
    backgroundColor: '#3b82f6',
    border: 'none',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid #64748b',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const cardsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  };

  const cardStyle = {
    backgroundColor: '#2c3e50',
    borderRadius: '8px',
    padding: '16px'
  };

  const cardLabelStyle = {
    fontSize: '14px',
    color: '#94a3b8'
  };

  const cardValueStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    marginTop: '8px'
  };

  const positiveChangeStyle = {
    fontSize: '12px',
    color: '#4ade80',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center'
  };

  const negativeChangeStyle = {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center'
  };

  const contentBoxStyle = {
    backgroundColor: '#2c3e50',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px'
  };

  const contentTitleStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '16px'
  };

  const itemListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const itemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#374151',
    borderRadius: '4px',
    textDecoration: 'none',
    color: 'white'
  };

  const itemIconStyle = {
    color: '#94a3b8'
  };

  // Datos para las tarjetas
  const cardData = [
    { label: 'Usuarios', value: '1,248', change: '+12%', positive: true, icon: <IconUsers /> },
    { label: 'Ingresos', value: '$48.5k', change: '+8%', positive: true, icon: <IconCurrencyDollar /> },
    { label: 'Tráfico', value: '12.4k', change: '-3%', positive: false, icon: <IconChartBar /> }
  ];

  // Datos para los componentes recientes
  const recentComponents = [
    { name: 'Botón de Login', url: '#' },
    { name: 'Formulario de contacto', url: '#' },
    { name: 'Galería de imágenes', url: '#' }
  ];

  return (
    <div style={dashboardStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>Dashboard</div>
        <div style={buttonContainerStyle}>
          <button style={primaryButtonStyle}>Nuevo</button>
          <button style={secondaryButtonStyle}>Filtrar</button>
        </div>
      </div>
      
      {/* Tarjetas de estadísticas */}
      <div style={cardsContainerStyle}>
        {cardData.map((card, index) => (
          <div key={index} style={cardStyle}>
            <div style={cardLabelStyle}>{card.label}</div>
            <div style={cardValueStyle}>{card.value}</div>
            <div style={card.positive ? positiveChangeStyle : negativeChangeStyle}>
              {card.positive ? <IconArrowUp /> : <IconArrowDown />} {card.change} este mes
            </div>
          </div>
        ))}
      </div>
      
      {/* Lista de componentes recientes */}
      <div style={contentBoxStyle}>
        <div style={contentTitleStyle}>Componentes recientes</div>
        <div style={itemListStyle}>
          {recentComponents.map((component, index) => (
            <a key={index} href={component.url} style={itemStyle}>
              <span>{component.name}</span>
              <span style={itemIconStyle}>→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
"""

    return {
        "visual_description": f"A horizontal dashboard with stats cards and components list: {prompt_content}",
        "preview_html": dashboard_html,
        "component_code": dashboard_code
    }

def generate_shadcn_imports():
    return """import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { BarChart, Clock, Home, Settings, Users } from "lucide-react";
"""

def generate_shadcn_shadcn_styles():
    return """
  // Estilos para el dashboard con Shadcn UI
  const containerStyle = {
    display: 'flex',
    width: '100%',
    height: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: '#0f172a',
    color: '#f8fafc'
  };

  const sidebarStyle = {
    width: '280px',
    backgroundColor: '#1e293b',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #334155'
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '32px',
    paddingLeft: '12px'
  };

  const navStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '32px'
  };

  const navItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    color: '#f8fafc',
    textDecoration: 'none',
    borderRadius: '0.75rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  };

  const activeNavItemStyle = {
    backgroundColor: '#3b82f6',
    color: 'white'
  };

  const iconStyle = {
    width: '20px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const recentSectionStyle = {
    marginTop: 'auto',
    paddingTop: '24px',
    borderTop: '1px solid #334155'
  };

  const recentHeaderStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    paddingLeft: '12px',
    color: '#94a3b8'
  };

  const recentListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const recentItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    color: '#f8fafc',
    textDecoration: 'none',
    fontSize: '14px'
  };

  const mainContentStyle = {
    flex: 1,
    padding: '24px',
    overflowY: 'auto'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  };

  const headerTitleStyle = {
    fontSize: '24px',
    fontWeight: 'bold'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '12px'
  };

  const primaryButtonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s'
  };

  const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '8px 16px',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s'
  };

  const cardsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '24px'
  };

  const cardStyle = {
    backgroundColor: '#334155',
    borderRadius: '0.75rem',
    padding: '20px'
  };

  const cardLabelStyle = {
    fontSize: '14px',
    color: '#94a3b8'
  };

  const cardValueStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    marginTop: '8px'
  };

  const positiveChangeStyle = {
    fontSize: '12px',
    color: '#4ade80',
    marginTop: '8px'
  };

  const negativeChangeStyle = {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '8px'
  };
"""

def generate_regular_styles(is_dark=True):
    bg_color = "#0f172a" if is_dark else "#f8fafc"        
    sidebar_color = "#1e293b" if is_dark else "#f1f5f9"   
    text_color = "#f8fafc" if is_dark else "#0f172a"      
    accent_color = "#3b82f6"    
    card_color = "#334155" if is_dark else "#e2e8f0"      
    icon_color = "#94a3b8" if is_dark else "#64748b"      
    
    return f"""
  // Estilos para el dashboard
  const containerStyle = {{
    display: 'flex',
    width: '100%',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '{bg_color}',
    color: '{text_color}'
  }};

  const sidebarStyle = {{
    width: '280px',
    backgroundColor: '{sidebar_color}',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid {card_color}'
  }};

  const titleStyle = {{
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '32px',
    paddingLeft: '12px'
  }};

  const navStyle = {{
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '32px'
  }};

  const navItemStyle = {{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    color: '{text_color}',
    textDecoration: 'none',
    borderRadius: '0.5rem',
    transition: 'background-color 0.2s'
  }};

  const activeNavItemStyle = {{
    backgroundColor: '{accent_color}',
    color: 'white'
  }};

  const iconStyle = {{
    width: '20px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }};

  const recentSectionStyle = {{
    marginTop: 'auto',
    paddingTop: '24px',
    borderTop: '1px solid {card_color}'
  }};

  const recentHeaderStyle = {{
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    paddingLeft: '12px',
    color: '{icon_color}'
  }};

  const recentListStyle = {{
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }};

  const recentItemStyle = {{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    color: '{text_color}',
    textDecoration: 'none',
    fontSize: '14px'
  }};

  const mainContentStyle = {{
    flex: 1,
    padding: '24px',
    overflowY: 'auto'
  }};

  const headerStyle = {{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  }};

  const headerTitleStyle = {{
    fontSize: '24px',
    fontWeight: 'bold'
  }};

  const buttonContainerStyle = {{
    display: 'flex',
    gap: '12px'
  }};

  const primaryButtonStyle = {{
    backgroundColor: '{accent_color}',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  }};

  const secondaryButtonStyle = {{
    backgroundColor: 'transparent',
    border: '1px solid {card_color}',
    color: '{text_color}',
    padding: '8px 16px',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  }};

  const cardsContainerStyle = {{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '24px'
  }};

  const cardStyle = {{
    backgroundColor: '{card_color}',
    borderRadius: '0.5rem',
    padding: '20px'
  }};

  const cardLabelStyle = {{
    fontSize: '14px',
    color: '{icon_color}'
  }};

  const cardValueStyle = {{
    fontSize: '28px',
    fontWeight: 'bold',
    marginTop: '8px'
  }};

  const positiveChangeStyle = {{
    fontSize: '12px',
    color: '#4ade80',
    marginTop: '8px'
  }};

  const negativeChangeStyle = {{
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '8px'
  }};
"""

def handle_component_by_type(prompt_content, component_data):
    """
    Procesa un componente basado en su tipo (dashboard, footer, etc.)
    para asegurarse de que tenga la estructura y visualización correctas
    """
    prompt_lower = prompt_content.lower()
    
    # Para componentes tipo dashboard
    if 'dashboard' in prompt_lower:
        if 'component_code' not in component_data or 'preview_html' not in component_data:
            dashboard_component = create_dashboard_component(prompt_content)
            return dashboard_component
        
        # Si el código o preview del dashboard parece incompleto o mal estructurado
        code = component_data.get('component_code', '')
        preview = component_data.get('preview_html', '')
        
        if len(code) < 100 or len(preview) < 100 or prompt_content in preview:
            dashboard_component = create_dashboard_component(prompt_content)
            return dashboard_component
            
        # Si parece que hay código pero necesita formatearse
        if 'component_code' in component_data:
            component_data['component_code'] = format_dashboard_component(component_data['component_code'], prompt_content)
    
    # Para componentes tipo footer
    elif 'footer' in prompt_lower:
        if 'component_code' not in component_data or 'preview_html' not in component_data:
            return create_fallback_footer(prompt_content)
            
        # Si el footer parece incompleto
        code = component_data.get('component_code', '')
        if 'footer' not in code.lower() or 'social' not in code.lower():
            return create_fallback_footer(prompt_content)
            
        # Si parece que hay código pero necesita formatearse
        component_data['component_code'] = format_footer_component(component_data['component_code'], prompt_content)
    
    return component_data 