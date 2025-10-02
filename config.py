"""
Configurações otimizadas para Automation AI Advisor
"""

import os
from datetime import datetime

class Config:
    """Configurações da aplicação"""
    
    # Configurações básicas
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'automation-ai-advisor-secret-key-2024'
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # Configurações do banco de dados
    DATABASE_PATH = os.environ.get('DATABASE_PATH') or 'automation_advisor.db'
    
    # Configurações do Google Gemini
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or "AIzaSyCPB-pNiTz5gT-j624X5SI9rL-LZlTVfGw"
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL') or 'gemini-2.5-flash'
    GEMINI_TIMEOUT = int(os.environ.get('GEMINI_TIMEOUT', '30'))
    
    # Configurações do servidor
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', '5000'))
    
    # Configurações de segurança
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Configurações de upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # Configurações de cache
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutos
    
    # Configurações de logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    @staticmethod
    def get_app_info():
        """Retorna informações da aplicação"""
        return {
            'name': 'Automation AI Advisor',
            'version': '2.0.0',
            'description': 'Sistema completo e otimizado para recomendações de automação',
            'author': 'Automation AI Team',
            'created_at': datetime.now().isoformat()
        }
