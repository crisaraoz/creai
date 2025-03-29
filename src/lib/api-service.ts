// URL del backend
const API_URL = "http://localhost:8000/api/v1";

// Interfaces
export interface ComponentData {
  visual_description?: string;
  preview_html?: string;
  component_code?: string;
}

interface ApiResponse {
  status: string;
  component: ComponentData | string;
  message?: string;
}

// Simple cache for component modifications
const modificationCache: Record<string, ComponentData> = {};

/**
 * Función para extraer HTML limpio de un string potencialmente con formato JSON
 */
function extractCleanHtml(htmlString: string): string {
  // Si es vacío o no es string, retornar vacío
  if (!htmlString || typeof htmlString !== 'string') return '';
  
  // Limpiar secuencias de escape
  let cleaned = htmlString
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\t/g, '\t');
  
  // Eliminar comillas al inicio y final
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  
  // Instead of just extracting div tags, check if we have proper HTML structure
  if (!cleaned.includes('<') && !cleaned.includes('>')) {
    // If no HTML tags at all, wrap in a basic div
    return `<div style="padding:10px;text-align:center;">${cleaned}</div>`;
  }
  
  // If we have an icon without proper container, wrap it
  if (cleaned.includes('</svg>') && !cleaned.includes('<div') && !cleaned.includes('<header')) {
    return `<div style="background-color:black;padding:10px;display:flex;justify-content:space-between;align-items:center;width:100%;">${cleaned}</div>`;
  }
  
  // For header components specifically, ensure we have background color
  if (cleaned.includes('<header') && !cleaned.includes('background-color') && !cleaned.includes('backgroundColor')) {
    cleaned = cleaned.replace('<header', '<header style="background-color:black;padding:10px;display:flex;justify-content:space-between;align-items:center;"');
  }
  
  return cleaned;
}

/**
 * Genera un componente basado en el prompt y la plataforma
 */
export async function generateComponent(prompt: string, platform: string): Promise<ComponentData> {
  try {
    const response = await fetch(`${API_URL}/generate-component`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        platform: platform.toLowerCase()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error generating component');
    }

    const data: ApiResponse = await response.json();
    
    // Log para debug
    console.log("===== RESPUESTA COMPLETA DE LA API =====");
    console.log(JSON.stringify(data, null, 2));
    
    if (data.status === 'success') {
      // Parse the component data if it's a string
      let componentData = data.component;
      
      // Ensure we have a proper object
      if (typeof componentData === 'string') {
        try {
          // Try to parse it as JSON first
          componentData = JSON.parse(componentData);
        } catch {
          // If it's not valid JSON, check if it contains JSON inside (common with API responses)
          const stringContent = componentData as string;
          const jsonMatch = stringContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              componentData = JSON.parse(jsonMatch[1]);
            } catch (e) {
              console.error('Error parsing JSON from markdown block:', e);
              
              // If still not parsed, try to extract the component parts manually
              const descriptionMatch = stringContent.match(/"visual_description"\s*:\s*"([^"]*)"/);
              const previewMatch = stringContent.match(/"preview_html"\s*:\s*"([^"]*)"/);
              const codeMatch = stringContent.match(/"component_code"\s*:\s*"([^"]*)"/);
              
              const extractedData: ComponentData = {};
              if (descriptionMatch && descriptionMatch[1]) {
                extractedData.visual_description = descriptionMatch[1];
              }
              if (previewMatch && previewMatch[1]) {
                extractedData.preview_html = previewMatch[1];
              }
              if (codeMatch && codeMatch[1]) {
                extractedData.component_code = codeMatch[1];
              }
              
              if (Object.keys(extractedData).length > 0) {
                componentData = extractedData;
              }
            }
          }
        }
      }
      
      // Si llegamos aquí, tenemos los datos del componente pero puede que el HTML aún tenga formato JSON
      // Limpiamos el preview_html si existe
      if (typeof componentData === 'object' && componentData.preview_html) {
        componentData.preview_html = extractCleanHtml(componentData.preview_html);
      }
      
      return componentData as ComponentData;
    } else {
      throw new Error(data.message || 'Error generating component');
    }
  } catch (error: unknown) {
    console.error('Error in generateComponent service:', error);
    throw error; // Re-lanzar el error para que el componente pueda manejarlo
  }
}

/**
 * Modifica un componente existente basado en el prompt de modificación
 */
export async function modifyComponent(modifyPrompt: string, currentCode: string): Promise<ComponentData> {
  // Generate a cache key based on the prompt and code
  const cacheKey = `${modifyPrompt}-${currentCode.substring(0, 100)}`;
  
  // Check if we have a cached response
  if (modificationCache[cacheKey]) {
    console.log("Using cached modification result");
    return modificationCache[cacheKey];
  }
  
  try {
    const response = await fetch(`${API_URL}/generate-component`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Modify this component: ${modifyPrompt}. 
                Current code: ${currentCode || ""}`,
        platform: "web" // Asumimos web por defecto para modificaciones
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error modifying component');
    }

    const data: ApiResponse = await response.json();
    
    if (data.status === 'success') {
      // Parse the component data if it's a string
      let componentData = data.component;
      if (typeof componentData === 'string') {
        try {
          componentData = JSON.parse(componentData);
        } catch {
          // Si no es un JSON válido, intentamos extraer las partes como en generateComponent
          const stringContent = componentData as string;
          const jsonMatch = stringContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              componentData = JSON.parse(jsonMatch[1]);
            } catch (e) {
              console.error('Error parsing JSON from markdown block:', e);
            }
          }
        }
      }
      
      // Limpiamos el preview_html si existe
      if (typeof componentData === 'object' && componentData.preview_html) {
        componentData.preview_html = extractCleanHtml(componentData.preview_html);
      }
      
      // Cache the result
      modificationCache[cacheKey] = componentData as ComponentData;
      
      return componentData as ComponentData;
    } else {
      throw new Error(data.message || 'Error modifying component');
    }
  } catch (error: unknown) {
    console.error('Error in modifyComponent service:', error);
    throw error;
  }
} 