import { useState } from 'react';
import { Menu, Sparkles, Smartphone, Monitor, Home, UserCircle, Search, Settings, ShoppingCart, MessageSquare, Newspaper, Mail, ClipboardList, Building2, Calendar, PieChart, Clock, Lightbulb, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ResultView } from '@/components/result-view';
import { generateComponent, ComponentData } from '@/lib/api-service';

function App() {
  const [prompt, setPrompt] = useState('');
  const [selectedPlatform, setPlatform] = useState<'Mobile' | 'Web'>('Mobile');
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedComponent, setGeneratedComponent] = useState<ComponentData | null>(null);
  const [error, setError] = useState('');

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
      <main className="max-w-3xl mx-auto px-6 py-12">
        {showResult ? (
          <ResultView 
            component={generatedComponent || {}} 
            onBack={() => setShowResult(false)} 
          />
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">What should we design?</h1>
            
            {/* Input Area */}
            <div className="bg-muted rounded-xl p-4 mb-8">
              <Textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe design you need..."
                className="bg-transparent border-none mb-4 min-h-[100px] focus-visible:ring-0"
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
                
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex items-center space-x-1"
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim()}
                >
                  {isLoading ? (
                    <span>Generating...</span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate</span>
                    </>
                  )}
                </Button>
              </div>
              
              {error && (
                <div className="mt-2 text-red-500 text-sm">{error}</div>
              )}
            </div>

            {/* Options Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayedOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start space-x-2 bg-accent/50 hover:bg-accent"
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>
              
              {!showAllOptions && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAllOptions(true)}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show all
                </Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;