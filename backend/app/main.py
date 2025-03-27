from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Import routers
from app.api.chat.router import router as chat_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="CreAI Component Generator API",
    description="""
    API for generating UI components with artificial intelligence using the QWEN API.
    
    ## Features
    
    * Generation of UI components based on textual descriptions
    * Support for web and mobile platforms
    * Generation of React and HTML code for preview
    
    ## How to use
    
    1. Send a prompt describing the UI component you need
    2. Specify the target platform (web or mobile)
    3. Receive a generated UI component with its code and preview
    """,
    version="0.1.0",
    openapi_url="/api/v1/openapi.json",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1}
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add API version prefix
prefix = "/api/v1"

# Include routers
app.include_router(chat_router, prefix=prefix)

# Define root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the CreAI Component Generator API"} 