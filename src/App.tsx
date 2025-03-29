import { useState } from 'react';
import { Menu, Sparkles, Smartphone, Monitor, Home, UserCircle, Search, Settings, ShoppingCart, MessageSquare, Newspaper, Mail, ClipboardList, Building2, Calendar, PieChart, Clock, Lightbulb, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ResultView } from '@/components/result-view';
import { generateComponent, ComponentData } from '@/lib/api-service';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

function App() {
  const [prompt, setPrompt] = useState('');
  const [selectedPlatform, setPlatform] = useState<'Mobile' | 'Web'>('Mobile');
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedComponent, setGeneratedComponent] = useState<ComponentData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview');

  const options = [
    { icon: <Home size={20} />, label: 'Home screen' },
    { icon: <UserCircle size={20} />, label: 'Sign up form' },
    { icon: <Search size={20} />, label: 'Search page' },
    { icon: <Settings size={20} />, label: 'Settings page' },
    { icon: <UserCircle size={20} />, label: 'User profile' },
    { icon: <ClipboardList size={20} />, label: 'Details screen' },
    { icon: <ShoppingCart size={20} />, label: 'Checkout form' },
    { icon: <Home size={20} />, label: 'Health & fitness' },
    { icon: <ShoppingCart size={20} />, label: 'E-commerce app' },
    { icon: <MessageSquare size={20} />, label: 'Food delivery app' },
    { icon: <MessageSquare size={20} />, label: 'Chat list' },
    { icon: <Newspaper size={20} />, label: 'Article page' },
    { icon: <Mail size={20} />, label: 'News feed' },
    { icon: <Mail size={20} />, label: 'Email app' },
    { icon: <ClipboardList size={20} />, label: 'Task management app' },
    { icon: <Building2 size={20} />, label: 'Real estate listing page' },
    { icon: <Calendar size={20} />, label: 'Event booking' },
    { icon: <PieChart size={20} />, label: 'Finance dashboard' },
    { icon: <Clock size={20} />, label: 'Job board UI' },
    { icon: <Lightbulb size={20} />, label: 'Smart home' }
  ];

  const initialOptions = options.slice(0, 4);
  const displayedOptions = showAllOptions ? options : initialOptions;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your component.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Utilizar el servicio API
      const componentData = await generateComponent(prompt, selectedPlatform);
      console.log("API Result:", JSON.stringify(componentData, null, 2));
      setGeneratedComponent(componentData);
      setShowResult(true);
    } catch (error: unknown) {
      console.error('Error generating component:', error);
      setError(error instanceof Error ? error.message : 'Error connecting to the service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option: string) => {
    setPrompt(option);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-xl">creAI</span>
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">ALPHA</span>
        </div>
        <div className="flex items-center space-x-4">
          {/* <span className="text-muted-foreground">20 gens left</span> */}
          <Button>Get Pro</Button>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!showResult ? (
          <>
            <h1 className="text-2xl font-bold mb-6 max-w-2xl mx-auto">What should we design?</h1>
            
            {/* Input Area */}
            <div className="bg-muted rounded-xl p-3 mb-6 max-w-2xl mx-auto">
              <Textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe design you need..."
                className="bg-transparent border-none mb-2 min-h-[40px] focus-visible:ring-0"
              />
              
              {/* Platform Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 bg-background rounded-lg p-1">
                  <Button 
                    variant={selectedPlatform === 'Mobile' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPlatform('Mobile')}
                    className="flex items-center space-x-1"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile</span>
                  </Button>
                  <Button 
                    variant={selectedPlatform === 'Web' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPlatform('Web')}
                    className="flex items-center space-x-1"
                  >
                    <Monitor className="h-4 w-4" />
                    <span>Web</span>
                  </Button>
                </div>
                <div>
                  {isLoading ? (
                    <Button disabled className="flex items-center gap-2">
                      <span className="animate-spin mr-1">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      Generating...
                    </Button>
                  ) : (
                    <Button onClick={handleGenerate} className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Template Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 max-w-2xl mx-auto">
              {displayedOptions.map((option, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => handleOptionClick(option.label)}
                >
                  <div className="flex items-center">
                    <span className="mr-3">{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                </Button>
              ))}
            </div>

            {/* Show All Button */}
            {!showAllOptions && (
              <div className="max-w-2xl mx-auto">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAllOptions(true)}
                  className="flex items-center gap-1 text-muted-foreground"
                >
                  <ChevronDown className="h-4 w-4" />
                  Show all
                </Button>
              </div>
            )}

            {/* Errors */}
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}
          </>
        ) : (
          // Resultado con layout de dos columnas
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel izquierdo - Descripción y Modificador */}
            <div className="lg:col-span-1">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowResult(false)}
                  >
                    ← Back
                  </Button>
                </div>
                
                <div className="bg-muted rounded-xl p-4 mb-4 flex-grow">
                  <h3 className="font-medium mb-2">Component Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {generatedComponent?.visual_description || "Component based on your description"}
                  </p>
                </div>
                
                <ResultView 
                  component={generatedComponent || {}} 
                  onBack={() => setShowResult(false)} 
                  onModify={(modifyPrompt) => {
                    console.log(`Modifying component: "${modifyPrompt}"`);
                  }}
                  onModifySuccess={() => {
                    console.log(`Component modified successfully`);
                  }}
                  onModifyError={(error) => {
                    console.log(`Modification error: ${error}`);
                  }}
                  showTabs={false}
                  showDescription={false}
                  showBackButton={false}
                />
              </div>
            </div>
            
            {/* Panel derecho - Preview y código */}
            <div className="lg:col-span-2">
              <div className="flex justify-end mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedComponent?.component_code || '')}>
                    Copy Code
                  </Button>
                  <Button>Save Component</Button>
                </div>
              </div>
              
              <Tabs defaultValue="preview" className="w-full" onValueChange={handleTabChange}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>
                
                <div className="mt-2">
                  {generatedComponent && (
                    <>
                      <div className="tab-content" data-state={activeTab === 'preview' ? 'active' : 'inactive'}>
                        <div 
                          className="border rounded-lg flex justify-center items-center p-4"
                          dangerouslySetInnerHTML={{ 
                            __html: generatedComponent.preview_html || '<div class="text-center p-4">No preview available</div>' 
                          }}
                        />
                      </div>
                      
                      <div className="tab-content" data-state={activeTab === 'code' ? 'active' : 'inactive'}>
                        <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                          <pre>{generatedComponent.component_code || `// No code generated yet`}</pre>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Tabs>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;