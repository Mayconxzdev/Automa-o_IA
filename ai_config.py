# Configuração das IAs para AutoFluxo
# Adicione suas chaves de API no arquivo .env

import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# ========================================
# CONFIGURAÇÃO DAS IAs
# ========================================

# 1. Google Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyCPB-pNiTz5gT-j624X5SI9rL-LZlTVfGw')

# 2. OpenAI GPT-4o Mini (RECOMENDADO - 500 requests/dia gratuitos)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

# 3. Groq Llama 3.1 (14.400 requests/dia gratuitos - MAIS GENEROSO!)
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')

# 4. Hugging Face DeepSeek-R1 (1.000 requests/dia gratuitos - MUITO GENEROSO!)
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY', '')

# ========================================
# INSTRUÇÕES DE CONFIGURAÇÃO
# ========================================

"""
COMO CONFIGURAR:

1. Crie um arquivo .env na raiz do projeto com suas chaves:
   GEMINI_API_KEY=sua_chave_gemini_aqui
   OPENAI_API_KEY=sua_chave_openai_aqui
   GROQ_API_KEY=sua_chave_groq_aqui
   HUGGINGFACE_API_KEY=sua_chave_huggingface_aqui

2. GROQ (MAIS FÁCIL E GENEROSO - 14.400 requests/dia):
   - Acesse: https://console.groq.com/keys
   - Crie uma conta gratuita
   - Gere uma API key

3. OPENAI (MAIS CONFIÁVEL - 500 requests/dia):
   - Acesse: https://platform.openai.com/api-keys
   - Crie uma conta e adicione cartão de crédito
   - Gere uma API key

4. HUGGING FACE (MUITO GENEROSO - 1.000 requests/dia):
   - Acesse: https://huggingface.co/settings/tokens
   - Crie uma conta gratuita
   - Gere uma API key

ORDEM DE PRIORIDADE:
1. Gemini (já configurado)
2. OpenAI (mais confiável)
3. Groq (mais generoso)
4. Hugging Face DeepSeek-R1 (muito generoso)
5. Simulação inteligente (fallback)

TOTAL DE COTAS GRATUITAS: 15.900 requests/dia!
"""
