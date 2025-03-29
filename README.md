# Component CreAI

A modern UI component generator that uses AI to create customizable UI components based on text descriptions. Design beautiful components for web and mobile applications without writing code from scratch.

![Component CreAI](https://via.placeholder.com/800x400?text=Component+CreAI)

## 🚀 Features

- **AI-Powered Component Generation**: Create UI components by simply describing what you want
- **Multi-platform Support**: Generate components for both Web and Mobile interfaces
- **Template Library**: Choose from pre-defined templates for common UI patterns like user profiles, settings pages, and checkout forms
- **Live Preview**: See your components as they're generated
- **Code Export**: Download generated code in multiple programming languages:
  - JavaScript
  - TypeScript
  - Python (Streamlit)
  - C++ (Qt)
  - Java (JavaFX)
  - C# (WPF)
  - Swift (SwiftUI)
  - Kotlin (Jetpack Compose)
- **Component Customization**: Modify existing components with simple text instructions
- **Copy Code**: Easily copy generated code to clipboard

## 🛠️ Technologies

### Frontend
- **React 18** + **TypeScript**: Core frontend framework
- **Vite**: Fast build tooling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible components (@radix-ui/react-dialog, @radix-ui/react-tabs, @radix-ui/react-dropdown-menu)
- **ShadCn UI**: Component library with a clean, modern aesthetic based on Radix
- **Lucide React**: Beautiful, consistent icon set

### Backend
- **FastAPI**: Modern, high-performance web framework for building APIs
- **Python 3**: Backend language
- **Pydantic**: Data validation using Python type annotations
- **OpenAI API**: Integration option for AI capabilities
- **QWEN API**: Integration with Alibaba Cloud's AI model for component generation
- **Uvicorn**: ASGI server implementation

## ⚙️ Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Python 3.8+

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/component-creai.git
cd component-creai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload
# Or use the provided run script
python run.py
```

## 🖥️ Usage

1. **Start Both Frontend and Backend Servers**
   - Frontend: `npm run dev`
   - Backend: `python run.py` or `uvicorn app.main:app --reload`

2. **Component Generation**
   - Select your target platform (Mobile or Web)
   - Enter a component description or select a template from the provided options
   - Click "Generate" to create your component

3. **Component Customization**
   - After generation, use the "Modify" option to refine your component
   - Enter text instructions like "add a heart icon to the left of the text"

4. **Export Options**
   - Click "Copy Code" to copy the component code to clipboard
   - Click "Save Component" to download in your preferred programming language

## 🔌 API Endpoints

The backend provides the following key endpoints:

- `POST /api/v1/generate-component`: Generates a component based on a text prompt
  ```json
  {
    "prompt": "A blue card with rounded corners", 
    "platform": "web"  // or "mobile"
  }
  ```

## 📁 Project Structure

```
component-creai/
├── src/                  # Frontend source code
│   ├── components/       # React components
│   │   └── ui/           # UI components (shadcn/ui based)
│   ├── lib/              # Utility functions and services
│   │   └── api-service.ts # API integration
│   │   └── code-converter.ts # Code language conversion
│   └── styles/           # CSS styles
├── backend/              # Backend source code
│   ├── app/              # FastAPI application
│   │   ├── api/          # API routes
│   │   ├── core/         # Core functionality
│   │   └── models/       # Data models
│   ├── .env              # Environment variables
│   └── requirements.txt  # Backend dependencies
├── .env.local            # Frontend environment variables
├── package.json          # Frontend dependencies
└── README.md             # This file
```

## 🔧 Configuration

### Frontend Environment Variables
Create or update the `.env.local` file in the root directory:

```
# API URL Configuration
NEXT_PUBLIC_QWEN_API_URL=http://localhost:8010
# For production:
# NEXT_PUBLIC_QWEN_API_URL=https://dashscope-intl.aliyuncs.com

# API Key
NEXT_PUBLIC_QWEN_API_KEY=your_qwen_api_key
```

### Backend Environment Variables
Update the `.env` file in the backend directory:

```
# API Keys for AI services
# For QWEN API
QWEN_API_KEY=your_qwen_api_key_here
QWEN_API_BASE_URL=https://dashscope-intl.aliyuncs.com/api/v1

# Optional for OpenAI integration
OPENAI_API_KEY=your_openai_api_key_here
```

### Backend Dependencies
The project uses the following Python packages:
```
fastapi==0.110.0
uvicorn==0.28.0
pydantic==2.6.4
pydantic-settings==2.1.0
python-dotenv==1.0.1
openai==1.12.0
requests==2.31.0
httpx==0.24.1
aiohttp==3.11.14
starlette==0.36.3
typing-extensions==4.11.0
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [OpenAI](https://openai.com/) and [QWEN AI](https://dashscope.aliyun.com/) for the powerful AI models
- [ShadCn UI](https://ui.shadcn.com/) for the beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for the accessible component primitives
- [Lucide](https://lucide.dev/) for the icon set
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vite](https://vitejs.dev/) for the fast build tool
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
