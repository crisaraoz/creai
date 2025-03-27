print("Probando importaciones...")

try:
    print("Importando app...")
    import app
    print("✅ app importado correctamente")
    
    print("Importando app.main...")
    from app import main
    print("✅ app.main importado correctamente")
    
    print("Importando app.api.chat.router...")
    from app.api.chat import router
    print("✅ app.api.chat.router importado correctamente")
    
    print("Importando app.api.chat.service...")
    from app.api.chat import service
    print("✅ app.api.chat.service importado correctamente")
    
    print("Todas las importaciones funcionaron correctamente")
except ImportError as e:
    print(f"❌ Error de importación: {e}")
except Exception as e:
    print(f"❌ Error inesperado: {e}") 