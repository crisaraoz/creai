import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
  const [error, setError] = useState('');
  // Estado para almacenar el HTML puro del componente
  const [purifiedHtml, setPurifiedHtml] = useState<string>('');

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

  // Extraer código de componente, vista previa y descripción
  const componentCode = componentData.component_code || '';
  const previewHtml = componentData.preview_html || '';
  const description = componentData.visual_description || '';

  // Función para sanitizar strings con escape characters
  const sanitizeString = (str: string) => {
    try {
      // Reemplazar secuencias de escape comunes que puedan causar problemas
      return str
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } catch (e) {
      console.error('Error sanitizing string:', e);
      return str;
    }
  };

  // Extraer sólo el código del componente sin formato JSON
  const extractComponentCode = (code: string) => {
    // Remover marcadores de código markdown y formato JSON
    const cleanCode = sanitizeString(code);
    
    // Intentar extraer sólo el código React/código de componente
    const importMatch = cleanCode.match(/import\s+React.*?;/s);
    if (importMatch) {
      return cleanCode;
    }
    
    // Si no encontramos el import, buscar const Component o const ComponentName
    const componentMatch = cleanCode.match(/const\s+\w+\s*=\s*\(\s*\)\s*=>\s*{/);
    if (componentMatch) {
      const startIndex = cleanCode.indexOf(componentMatch[0]);
      return cleanCode.substring(startIndex);
    }
    
    return cleanCode;
  };

  // Procesar el preview_html para extraer solo el HTML real
  useEffect(() => {
    if (previewHtml) {
      // Sanitizar primero el string para eliminar escape characters
      const sanitized = sanitizeString(previewHtml);
      
      // Extraer solo el HTML si está dentro de etiquetas
      const htmlTagMatch = sanitized.match(/<[^>]+>[\s\S]*<\/[^>]+>/);
      if (htmlTagMatch) {
        setPurifiedHtml(htmlTagMatch[0]);
      } else {
        // Si no hay etiquetas, probablemente es HTML inválido o texto plano
        setPurifiedHtml(sanitized);
      }
    } else {
      setPurifiedHtml('');
    }
  }, [previewHtml]);

  const cleanComponentCode = extractComponentCode(componentCode);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => copyToClipboard(cleanComponentCode)}>
            Copy Code
          </Button>
          <Button>Save Component</Button>
        </div>
      </div>

      {description && (
        <div className="bg-muted rounded-xl p-4 mb-4">
          <h3 className="font-medium mb-2">Component Description</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}

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
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="py-4 flex justify-center items-center">
          {purifiedHtml ? (
            <div dangerouslySetInnerHTML={{ __html: purifiedHtml }} />
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No preview available
            </div>
          )}
        </TabsContent>
        <TabsContent value="code" className="p-4 bg-muted rounded-lg font-mono text-sm">
          <pre>{cleanComponentCode || `// No code generated yet`}</pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}