import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles } from 'lucide-react';
import { ComponentData, modifyComponent } from '@/lib/api-service';

interface ResultViewProps {
  onBack: () => void;
  component: ComponentData | string;
}

export function ResultView({ onBack, component }: ResultViewProps) {
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);
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
      
      setProcessedPreviewHtml(cleanHtml);
    }
  }, [componentData]);

  const handleModify = async () => {
    if (!modifyPrompt.trim()) {
      setError('Please enter a modification description');
      return;
    }

    setError('');
    setIsModifying(true);

    try {
      // Utilizar el servicio API para modificar el componente
      const newComponentData = await modifyComponent(
        modifyPrompt, 
        componentData.component_code || ""
      );
      
      setComponentData(newComponentData);
    } catch (error: unknown) {
      console.error('Error modifying component:', error);
      setError(error instanceof Error ? error.message : 'Error connecting to the service');
    } finally {
      setIsModifying(false);
      setModifyPrompt('');
    }
  };

  // Extraer código de componente
  const componentCode = componentData.component_code || '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => copyToClipboard(componentCode)}>
            Copy Code
          </Button>
          <Button>Save Component</Button>
        </div>
      </div>

      {/* Component Description Section - Siempre mostramos este div pero con mensaje adecuado */}
      <div className="bg-muted rounded-xl p-4 mb-4">
        <h3 className="font-medium mb-2">Component Description</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {processedDescription || "Component based on your description"}
        </p>
      </div>

      {/* Modification Prompt */}
      <div className="bg-muted rounded-xl p-4">
        <Textarea 
          value={modifyPrompt}
          onChange={(e) => setModifyPrompt(e.target.value)}
          placeholder="Describe how you want to modify the component..."
          className="bg-transparent border-none mb-4 min-h-[80px] focus-visible:ring-0"
        />
        <div className="flex justify-end">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleModify}
            disabled={!modifyPrompt || isModifying}
          >
            <Sparkles className="h-4 w-4" />
            {isModifying ? 'Modifying...' : 'Modify'}
          </Button>
        </div>
        {error && (
          <div className="mt-2 text-red-500 text-sm">{error}</div>
        )}
      </div>

      {/* Preview and Code Tabs */}
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
            className="border rounded-lg mt-2 flex justify-center items-center p-4"
            dangerouslySetInnerHTML={{ __html: processedPreviewHtml || '<div class="text-center p-4">No preview available</div>' }}
          />
        )}
        
        {activeTab === "code" && (
          <div className="p-4 bg-muted rounded-lg font-mono text-sm mt-2">
            <pre>{componentCode || `// No code generated yet`}</pre>
          </div>
        )}
      </Tabs>
    </div>
  );
}