# Automation AI Advisor

Sistema completo de automação com IA para gerenciamento de projetos e análise de ROI.

## 🚀 Instalação e Execução

### Pré-requisitos
- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### 1. Clone ou baixe o projeto
```bash
# Se usando Git
git clone <url-do-repositorio>
cd automation-ai-advisor

# Ou simplesmente baixe e extraia os arquivos
```

### 2. Instale as dependências
```bash
pip install -r requirements.txt
```

### 3. Configure as variáveis de ambiente (opcional)
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas configurações
# Principalmente a GEMINI_API_KEY para usar a IA
```

### 4. Execute a aplicação
```bash
python app_final.py
```

### 5. Acesse o sistema
- **URL:** http://localhost:5000
- **Login:** demo / demo123
- **Health Check:** http://localhost:5000/health

## 📁 Estrutura do Projeto

```
automation-ai-advisor/
├── app_final.py              # Aplicação principal
├── database.py               # Sistema de banco de dados
├── config.py                 # Configurações
├── requirements.txt          # Dependências Python
├── env.example              # Exemplo de variáveis de ambiente
├── automation_advisor.db     # Banco de dados SQLite
├── static/                  # Arquivos estáticos
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js           # JavaScript consolidado
│   ├── icons/               # Ícones PWA
│   ├── manifest.json
│   └── sw.js
└── templates/               # Templates HTML
    ├── auth/
    │   └── login.html
    └── dashboard.html
```

## 🎯 Funcionalidades

### 🤖 Sistema de IA
- ✅ Integração com Google Gemini 2.5 Flash
- ✅ Sistema de fallback inteligente
- ✅ Recomendações estruturadas com ferramentas específicas
- ✅ Timeout e tratamento de erros robusto

### 👤 Sistema de Usuários
- ✅ Autenticação com Flask-Login
- ✅ Banco de dados SQLite local
- ✅ Dados específicos por usuário

### 📊 Dashboard Completo
- ✅ Módulos: Dashboard, Projetos, ROI, Inteligência
- ✅ Gráficos interativos com Chart.js
- ✅ Sistema Kanban com drag & drop
- ✅ Análise de ROI e métricas

### 🎨 Interface Moderna
- ✅ Bootstrap 5 responsivo
- ✅ Modo escuro/claro
- ✅ PWA (Progressive Web App)
- ✅ Notificações toast
- ✅ Sistema de loading

## 🔧 Configurações

### Variáveis de Ambiente
```bash
# Configurações da aplicação
SECRET_KEY=sua-chave-secreta
DEBUG=True
HOST=0.0.0.0
PORT=5000

# Configurações do banco de dados
DATABASE_PATH=automation_advisor.db

# Configurações do Google Gemini AI
GEMINI_API_KEY=sua-chave-gemini
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=30
```

### Configurações do Gemini
- **Modelo:** gemini-2.5-flash
- **Timeout:** 30 segundos
- **Fallback:** Sistema inteligente de simulação

## 🛡️ Segurança

- ✅ Autenticação com hash de senha
- ✅ Sessões seguras
- ✅ Validação de entrada
- ✅ Proteção contra SQL injection
- ✅ CORS configurado

## 📱 PWA Features

- ✅ Manifest.json configurado
- ✅ Service Worker implementado
- ✅ Ícones para diferentes dispositivos
- ✅ Instalação como app nativo
- ✅ Funcionamento offline básico

## 🎨 Temas

- ✅ Modo claro (padrão)
- ✅ Modo escuro
- ✅ Persistência de preferência
- ✅ Atualização automática de gráficos

## 🌐 APIs Disponíveis

### Autenticação
- `POST /login` - Login de usuário
- `GET /logout` - Logout de usuário

### Dashboard
- `GET /api/user/analytics` - Dados analíticos
- `GET /api/user/projects` - Projetos do usuário
- `GET /api/user/iot-metrics` - Métricas IoT

### Recomendações
- `GET /api/user/recommendations` - Recomendações recentes
- `POST /api/generate-recommendations` - Gerar novas recomendações

### Projetos
- `POST /api/user/projects` - Criar projeto
- `PUT /api/user/projects/<id>` - Atualizar projeto
- `DELETE /api/user/projects/<id>` - Deletar projeto

### Sistema
- `GET /health` - Health check
- `GET /api/language` - Idioma atual
- `GET /api/notifications` - Notificações

## 🚀 Deploy

### Desenvolvimento
```bash
python app_final.py
```

### Produção
```bash
# Usar WSGI server como Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app_final:app
```

## 🐛 Solução de Problemas

### Erro de dependências
```bash
# Reinstalar dependências
pip install --upgrade -r requirements.txt
```

### Erro de banco de dados
```bash
# Deletar banco e recriar
rm automation_advisor.db
python app_final.py
```

### Erro de porta em uso
```bash
# Alterar porta no arquivo app_final.py
app.run(debug=True, host='0.0.0.0', port=5001)
```

## 📞 Suporte

Para suporte ou dúvidas:
- 📧 **Email:** support@automation-ai-advisor.com
- 📚 **Documentação:** [Wiki do Projeto]
- 🐛 **Bugs:** [Issues do GitHub]

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**🎉 Sistema 100% Funcional e Pronto para Uso!**

*Versão 2.0.0 - Totalmente otimizada e livre de código redundante*