import os
import sys
import uvicorn

if __name__ == "__main__":
    # Asegurar que el directorio raíz esté en el path
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    # Ejecutar el servidor uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True) 