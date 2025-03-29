import { useState, useEffect } from 'react';
import { Menu, Sparkles, Smartphone, Monitor, Home, UserCircle, Search, Settings, ShoppingCart, MessageSquare, Newspaper, Mail, ClipboardList, Building2, Calendar, PieChart, Clock, Lightbulb, ChevronDown, Code, Download } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ResultView } from '@/components/result-view';
import { generateComponent, ComponentData } from '@/lib/api-service';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { languageOptions, convertComponentCode, generateFileName } from "@/lib/code-converter";

function App() {
  const [prompt, setPrompt] = useState('');
  const [selectedPlatform, setPlatform] = useState<'Mobile' | 'Web'>('Mobile');
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [generatedComponent, setGeneratedComponent] = useState<ComponentData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [showDropdown, setShowDropdown] = useState(false);

  const options = [
    { icon: <Home size={20} />, label: 'Home screen', prompt: 'Create a clean home screen with recent activity feed and quick action buttons' },
    { icon: <UserCircle size={20} />, label: 'Sign up form', prompt: 'Design a user-friendly sign up form with email, password fields and social login options' },
    { icon: <Search size={20} />, label: 'Search page', prompt: 'Create a search page with filters, sorting options and search results display' },
    { icon: <Settings size={20} />, label: 'Settings page', prompt: 'Make a settings page with account, notification, and privacy sections' },
    { icon: <UserCircle size={20} />, label: 'User profile', prompt: 'Design a user profile with bio, avatar, stats and recent activity' },
    { icon: <ClipboardList size={20} />, label: 'Details screen', prompt: 'Create a details screen for viewing item information with image and description' },
    { icon: <ShoppingCart size={20} />, label: 'Checkout form', prompt: 'Design a checkout form with payment options, order summary and shipping details' },
    { icon: <Home size={20} />, label: 'Health & fitness', prompt: 'Create a health tracking dashboard with activity stats, goals and progress charts' },
    { icon: <ShoppingCart size={20} />, label: 'E-commerce app', prompt: 'Design a product listing page for an e-commerce app with grid view and filters' },
    { icon: <MessageSquare size={20} />, label: 'Food delivery app', prompt: 'Create a restaurant menu screen for a food delivery app with categories and cart' },
    { icon: <MessageSquare size={20} />, label: 'Chat list', prompt: 'Design a chat list showing conversations with timestamps and online status' },
    { icon: <Newspaper size={20} />, label: 'Article page', prompt: 'Create an article reading page with typography, images and sharing options' },
    { icon: <Mail size={20} />, label: 'News feed', prompt: 'Design a news feed with articles, categories and personalized recommendations' },
    { icon: <Mail size={20} />, label: 'Email app', prompt: 'Create an email inbox interface with categorized messages and quick actions' },
    { icon: <ClipboardList size={20} />, label: 'Task management app', prompt: 'Design a task management interface with categories, due dates and priority levels' },
    { icon: <Building2 size={20} />, label: 'Real estate listing page', prompt: 'Create a property listing page with images, specs and inquiry form' },
    { icon: <Calendar size={20} />, label: 'Event booking', prompt: 'Design an event booking form with date picker, ticket selection and summary' },
    { icon: <PieChart size={20} />, label: 'Finance dashboard', prompt: 'Create a finance dashboard with account balances, transaction history and spending charts' },
    { icon: <Clock size={20} />, label: 'Job board UI', prompt: 'Design a job listing page with search, filters and featured positions' },
    { icon: <Lightbulb size={20} />, label: 'Smart home', prompt: 'Create a smart home control panel with device status and automation settings' }
  ];

  const initialOptions = options.slice(0, 4);
  const displayedOptions = showAllOptions ? options : initialOptions;

  const handleGenerate = async (customPrompt?: string) => {
    const promptToUse = customPrompt || prompt;
    
    if (!promptToUse.trim()) {
      setError('Please enter a description for your component.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Utilizar el servicio API
      const componentData = await generateComponent(promptToUse, selectedPlatform);
      console.log("API Result:", JSON.stringify(componentData, null, 2));
      setGeneratedComponent(componentData);
      setShowResult(true);
    } catch (error: unknown) {
      console.error('Error generating component:', error);
      setError(error instanceof Error ? error.message : 'Error connecting to the service');
    } finally {
      setIsLoading(false);
      setSelectedOption(null); // Reset selected option after generation completes
    }
  };

  const handleOptionClick = (option: { label: string, prompt: string }) => {
    // Set the UI state
    setPrompt(option.prompt);
    setSelectedOption(option.label);
    
    // Directly generate using the option's prompt, don't wait for state update
    handleGenerate(option.prompt);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Function to handle saving the component code in a specific language
  const handleSaveComponent = (languageId: string) => {
    console.log("Saving component in language:", languageId);
    
    if (!generatedComponent?.component_code) {
      console.error("No component code to save");
      return;
    }

    try {
      // Get the language option
      const langOption = languageOptions.find(lang => lang.id === languageId);
      if (!langOption) {
        console.error("Language option not found:", languageId);
        return;
      }

      // Extract component name from the code
      const componentNameMatch = generatedComponent.component_code.match(/(?:function|const)\s+([A-Za-z0-9_]+)/);
      const componentName = componentNameMatch ? componentNameMatch[1] : 'Component';
      console.log("Component name:", componentName);

      // Convert the code to the selected language
      const convertedCode = convertComponentCode(generatedComponent.component_code, languageId);
      
      // Generate file name
      const fileName = generateFileName(componentName, langOption);
      console.log("Saving as:", fileName);

      // Create a blob and download it
      const blob = new Blob([convertedCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error saving component:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showDropdown && !(event.target as Element).closest('#save-dropdown-container')) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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
                    variant={selectedPlatform === 'Mobile' ? 'soft-blue-active' : 'soft-blue'}
                    size="sm"
                    onClick={() => setPlatform('Mobile')}
                    className={`flex items-center space-x-1 ${selectedPlatform === 'Mobile' ? 'scale-105 z-10' : ''}`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile</span>
                  </Button>
                  <Button 
                    variant={selectedPlatform === 'Web' ? 'soft-blue-active' : 'soft-blue'}
                    size="sm"
                    onClick={() => setPlatform('Web')}
                    className={`flex items-center space-x-1 ${selectedPlatform === 'Web' ? 'scale-105 z-10' : ''}`}
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
                    <Button onClick={() => handleGenerate()} className="flex items-center gap-2">
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
                  variant="soft-blue" 
                  className={`justify-start h-auto py-3 px-4 opacity-90 hover:opacity-100 transition-all template-option ${
                    prompt === option.prompt ? 'bg-[hsl(var(--soft-blue-active))] text-[hsl(var(--soft-blue-active-foreground))] shadow-md border border-[hsl(var(--soft-blue-active-foreground))]' : ''
                  }`}
                  onClick={() => handleOptionClick(option)}
                  disabled={isLoading}
                  title={option.prompt}
                >
                  <div className="flex items-center w-full justify-between">
                    <div className="flex items-center">
                      <span className="mr-3">{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                    {isLoading && selectedOption === option.label && (
                      <span className="ml-2 animate-spin">
                        <Sparkles className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </Button>
              ))}
            </div>

            {/* Show All Button */}
            {!showAllOptions && (
              <div className="max-w-2xl mx-auto">
                <Button 
                  variant="soft-blue" 
                  onClick={() => setShowAllOptions(true)}
                  className="flex items-center gap-1 w-full justify-center"
                >
                  <ChevronDown className="h-4 w-4" />
                  Show all options
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
                  onModifySuccess={(newComponentData) => {
                    console.log(`Component modified successfully`);
                    // Actualizar el componente principal
                    setGeneratedComponent(newComponentData);
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
                  
                  <div id="save-dropdown-container" className="relative">
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      <Download className="h-4 w-4" />
                      Save Component
                    </Button>
                    
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999]">
                        <div className="py-1 border border-gray-200 rounded-md bg-popover text-popover-foreground">
                          <div className="px-4 py-2 text-sm font-medium border-b">Select Language</div>
                          {languageOptions.map((lang) => (
                            <button
                              key={lang.id}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-left w-full hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                handleSaveComponent(lang.id);
                                setShowDropdown(false);
                              }}
                            >
                              <Code className="h-4 w-4" />
                              <span>{lang.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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