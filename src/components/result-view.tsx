import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles } from 'lucide-react';
import { ComponentData, modifyComponent } from '@/lib/api-service';

interface ResultViewProps {
  onBack: () => void;
  component: ComponentData | string;
  onModify?: (modifyPrompt: string) => void;
  onModifySuccess?: (newComponentData: ComponentData) => void;
  onModifyError?: (error: string) => void;
  showTabs?: boolean;
  showDescription?: boolean;
  showBackButton?: boolean;
}

export function ResultView({ 
  onBack, 
  component, 
  onModify, 
  onModifySuccess, 
  onModifyError,
  showTabs = true,
  showDescription = true,
  showBackButton = true
}: ResultViewProps) {
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [modificationStartTime, setModificationStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [componentData, setComponentData] = useState<ComponentData>(() => {
    // Si component es un string, intenta parsearlo, sino úsalo directamente
    if (typeof component === 'string') {
      try {
        return JSON.parse(component);
      } catch {
        // Ignoramos error de parsing
        return { component_code: component };
      }
    }
    return component as ComponentData;
  });
  const [processedDescription, setProcessedDescription] = useState<string>('');
  const [processedPreviewHtml, setProcessedPreviewHtml] = useState<string>('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview'); // Se añade para controlar las pestañas

  // Efecto para actualizar los datos del componente cuando cambia desde las props
  useEffect(() => {
    if (typeof component === 'string') {
      try {
        setComponentData(JSON.parse(component));
      } catch {
        setComponentData({ component_code: component });
      }
    } else {
      setComponentData(component as ComponentData);
    }
  }, [component]);

  // Función para limpiar texto de caracteres de escape
  const cleanString = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\t/g, '\t');
  };

  // Efecto para procesar los datos del componente
  useEffect(() => {
    console.log("Component Data:", componentData);
    
    // Extraer y procesar la descripción visual
    if (componentData.visual_description) {
      setProcessedDescription(cleanString(componentData.visual_description));
    }
    
    // Extraer y procesar el HTML de la vista previa
    if (componentData.preview_html) {
      let cleanHtml = cleanString(componentData.preview_html);
      
      // Si el HTML está dentro de comillas, quitarlas
      if (cleanHtml.startsWith('"') && cleanHtml.endsWith('"')) {
        cleanHtml = cleanHtml.substring(1, cleanHtml.length - 1);
      }
      
      // Extraer solo el HTML del componente si está dentro de un bloque JSON
      if (cleanHtml.includes('"preview_html"')) {
        try {
          const match = cleanHtml.match(/"preview_html":\s*"([^"]+)"/);
          if (match && match[1]) {
            cleanHtml = match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
          }
        } catch (e) {
          console.error("Error al extraer preview_html:", e);
        }
      }
      
      // Enhanced processing for header components
      if (processedDescription.toLowerCase().includes('header') && !cleanHtml.includes('background-color:black')) {
        // Add default styling for header if missing
        if (cleanHtml.includes('<header')) {
          cleanHtml = cleanHtml.replace('<header', '<header style="background-color:black;color:white;padding:10px;display:flex;justify-content:space-between;align-items:center;width:100%;"');
        } else if (!cleanHtml.includes('<div')) {
          // If no container at all, wrap in styled div
          cleanHtml = `<div style="background-color:black;color:white;padding:10px;display:flex;justify-content:space-between;align-items:center;width:100%;">${cleanHtml}</div>`;
        }
      }
      
      // If icons are mentioned but not visible in preview
      if ((processedDescription.toLowerCase().includes('icon') || 
           processedDescription.toLowerCase().includes('hamburger')) && 
          !cleanHtml.includes('svg') && !cleanHtml.includes('lucide')) {
        // Extract code to check if it imports icons
        const code = componentData.component_code || '';
        if (code.includes('lucide-react')) {
          // Add placeholder icons based on description
          const leftIcon = processedDescription.toLowerCase().includes('theme') ? 
            '<span style="color:white;font-size:24px;">🌙</span>' : 
            '<span style="color:white;font-size:24px;">🏠</span>';
          
          const rightIcon = processedDescription.toLowerCase().includes('hamburger') ? 
            '<span style="color:white;font-size:24px;">☰</span>' : 
            '<span style="color:white;font-size:24px;">⚙️</span>';
          
          cleanHtml = `<div style="background-color:black;padding:10px;display:flex;justify-content:space-between;align-items:center;width:100%;">
            ${leftIcon}<span style="color:white;font-size:20px;">Header</span>${rightIcon}
          </div>`;
        }
      }
      
      setProcessedPreviewHtml(cleanHtml);
    }
  }, [componentData, processedDescription]);

  const handleModify = async () => {
    if (!modifyPrompt.trim()) {
      setError('Please enter a modification description');
      return;
    }

    setError('');
    setIsModifying(true);
    setModificationStartTime(Date.now());
    
    // Start a timer to update elapsed time
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - modificationStartTime) / 1000));
    }, 1000);
    
    // Notificar el inicio de la modificación
    if (onModify) {
      onModify(modifyPrompt);
    }

    try {
      // Establecer un tiempo de espera
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 90 seconds')), 90000);
      });
      
      // Crear la promesa de modificación
      const modifyPromise = modifyComponent(
        modifyPrompt, 
        componentData.component_code || ""
      );
      
      // Utilizar Promise.race para manejar timeouts
      const newComponentData = await Promise.race([modifyPromise, timeoutPromise]) as ComponentData;
      
      // Verificar que se obtuvo un componente válido
      if (!newComponentData || !newComponentData.component_code) {
        throw new Error('Received invalid component data from API');
      }
      
      // Actualizar el estado local con los nuevos datos
      setComponentData(newComponentData);
      
      // Notificar el éxito de la modificación y pasar los nuevos datos
      if (onModifySuccess) {
        onModifySuccess(newComponentData);
      }
    } catch (error: unknown) {
      console.error('Error modifying component:', error);
      const errorMessage = error instanceof Error 
        ? `Error: ${error.message}` 
        : 'Error connecting to the service. Please try again.';
      setError(errorMessage);
      
      // Notificar el error de la modificación
      if (onModifyError) {
        onModifyError(errorMessage);
      }
    } finally {
      clearInterval(timer);
      setIsModifying(false);
      setModifyPrompt('');
      setElapsedTime(0);
    }
  };

  // Extraer código de componente
  const componentCode = componentData.component_code || '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {showBackButton && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>← Back</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => copyToClipboard(componentCode)}>
              Copy Code
            </Button>
            <Button>Save Component</Button>
          </div>
        </div>
      )}

      {/* Component Description Section - Condicional */}
      {showDescription && (
        <div className="bg-muted rounded-xl p-4 mb-4">
          <h3 className="font-medium mb-2">Component Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {processedDescription || "Component based on your description"}
          </p>
        </div>
      )}

      {/* Modification Prompt - Siempre se muestra */}
      <div className="bg-muted rounded-xl p-4">
        <Textarea 
          value={modifyPrompt}
          onChange={(e) => setModifyPrompt(e.target.value)}
          placeholder="Describe how you want to modify the component..."
          className="bg-transparent border-none mb-2 min-h-[80px] focus-visible:ring-0"
        />
        <p className="text-xs text-muted-foreground mb-2">
          Tip: For adding icons, try "Add a [icon name] icon from lucide-react to the left/right of the text"
        </p>
        <div className="flex justify-end">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleModify}
            disabled={!modifyPrompt || isModifying}
          >
            <span className={isModifying ? "animate-spin mr-1" : ""}>
              <Sparkles className="h-4 w-4" />
            </span>
            {isModifying ? `Modifying... (${elapsedTime}s)` : 'Modify'}
          </Button>
        </div>
        {error && (
          <div className="mt-2 p-3 bg-red-50 text-red-600 rounded-md border border-red-200">
            <p className="font-medium text-sm mb-1">Error</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2 text-red-500">Try a different prompt or try again later</p>
          </div>
        )}
      </div>

      {/* Preview and Code Tabs - Condicional */}
      {showTabs && (
        <Tabs 
          defaultValue="preview" 
          className="w-full" 
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full justify-start">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          
          {activeTab === "preview" && (
            <div 
              className="border rounded-lg mt-2 flex justify-center items-center p-4 bg-white"
              style={{ minHeight: "120px", position: "relative" }}
            >
              {/* Fallback for empty preview */}
              {!processedPreviewHtml && (
                <div className="text-center p-4">No preview available</div>
              )}
              
              {/* Add warning if preview seems incomplete */}
              {processedPreviewHtml && !processedPreviewHtml.includes("div") && !processedPreviewHtml.includes("header") && (
                <div style={{
                  position: "absolute",
                  bottom: "4px",
                  right: "4px",
                  fontSize: "10px",
                  backgroundColor: "rgba(255,255,255,0.8)",
                  padding: "2px 4px",
                  borderRadius: "2px"
                }}>
                  Preview may be incomplete
                </div>
              )}
              
              {/* Actual preview HTML */}
              <div 
                style={{ width: "100%" }}
                dangerouslySetInnerHTML={{ __html: processedPreviewHtml || '' }}
              />
            </div>
          )}
          
          {activeTab === "code" && (
            <div className="p-4 bg-muted rounded-lg font-mono text-sm mt-2">
              <pre>{componentCode || `// No code generated yet`}</pre>
            </div>
          )}
        </Tabs>
      )}
    </div>
  );
}