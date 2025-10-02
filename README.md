# 🤖 AutoFluxo - Sistema de Automação com IA

Sistema completo de automação de processos empresariais com inteligência artificial, oferecendo recomendações personalizadas e análises avançadas.

## 🚀 Funcionalidades

### 🎯 Central de IA
- **Geração de Recomendações**: IA analisa processos e sugere automações
- **Visualização de Fluxos**: Diagramas interativos dos processos
- **Múltiplas IAs**: Suporte a Google Gemini, OpenAI, Groq e Hugging Face

### 📊 Dashboard Unificado
- **Visão Geral**: Métricas e KPIs em tempo real
- **Insights Inteligentes**: Análises preditivas e sugestões
- **Relatórios Avançados**: Dados detalhados de performance

### 🏢 Smart Office
- **Gestão de Projetos**: Controle completo de projetos de automação
- **Monitoramento IoT**: Sensores e dispositivos conectados
- **Analytics**: Análises de dados e tendências
- **Relatórios de IA**: Relatórios gerados automaticamente

## 🛠️ Instalação

### 1. Clone o Repositório
```bash
git clone https://github.com/Mayconxzdev/Automa-o_IA.git
cd Automa-o_IA
```

### 2. Instale as Dependências
```bash
pip install -r requirements.txt
```

### 3. Configure as Chaves de API
```bash
# Copie o arquivo de exemplo
copy config_example.env .env

# Edite o arquivo .env com suas chaves
# GEMINI_API_KEY=sua_chave_aqui
# OPENAI_API_KEY=sua_chave_aqui
# GROQ_API_KEY=sua_chave_aqui
# HUGGINGFACE_API_KEY=sua_chave_aqui
```

### 4. Execute o Sistema
```bash
python app_final.py
```

### 5. Acesse o Sistema
- **URL**: http://localhost:5000
- **Login Demo**: demo / demo123

## 🔑 Configuração das IAs

### Google Gemini (Já Configurado)
- ✅ 1.500 requests/dia gratuitos
- ✅ Já configurado no sistema

### OpenAI GPT-4o Mini (Recomendado)
- 🔗 [Obter Chave](https://platform.openai.com/api-keys)
- 📊 500 requests/dia gratuitos
- 💳 Requer cartão de crédito

### Groq Llama 3.1 (Mais Generoso)
- 🔗 [Obter Chave](https://console.groq.com/keys)
- 📊 14.400 requests/dia gratuitos
- 🆓 Conta gratuita

### Hugging Face DeepSeek-R1 (Muito Generoso)
- 🔗 [Obter Chave](https://huggingface.co/settings/tokens)
- 📊 1.000 requests/dia gratuitos
- 🆓 Conta gratuita

## 📁 Estrutura do Projeto

```
AutoFluxo/
├── app_final.py              # Aplicação principal Flask
├── ai_config.py              # Configuração das IAs
├── requirements.txt          # Dependências Python
├── config_example.env        # Exemplo de configuração
├── .gitignore               # Arquivos ignorados pelo Git
├── static/                  # Assets estáticos
│   ├── css/style.css
│   ├── js/app.js
│   └── icons/
└── templates/               # Templates HTML
    ├── auth/login.html
    ├── central_ia.html
    ├── unified_dashboard.html
    └── smart_office_*.html
```

## 🔐 Segurança

- ✅ Chaves de API protegidas em variáveis de ambiente
- ✅ Arquivo `.env` no `.gitignore`
- ✅ Zero chaves sensíveis no código
- ✅ Configuração segura com fallbacks

## 📊 Total de Cotas Gratuitas

**15.900 requests/dia** distribuídas entre as IAs!

## 🆘 Suporte

### Problemas Comuns

**Erro: "ModuleNotFoundError: No module named 'dotenv'"**
```bash
pip install python-dotenv
```

**Erro: "Chave de API não encontrada"**
- Verifique se o arquivo `.env` existe
- Verifique se as chaves estão corretas
- Reinicie o servidor após alterar o `.env`

**Sistema não funciona sem chaves**
- O sistema tem fallback para simulação inteligente
- Funciona mesmo sem todas as chaves configuradas

## 🚀 Tecnologias

- **Backend**: Flask, Python
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **IA**: Google Gemini, OpenAI, Groq, Hugging Face
- **Banco de Dados**: SQLite
- **Gráficos**: Chart.js
- **Autenticação**: Flask-Login

## 📈 Roadmap

- [ ] Integração com mais IAs
- [ ] Dashboard mobile responsivo
- [ ] API REST completa
- [ ] Integração com CRM/ERP
- [ ] Automação de workflows
- [ ] Relatórios em PDF/Excel

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👥 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature
3. Fazer commit das mudanças
4. Fazer push para a branch
5. Abrir um Pull Request

## 📞 Contato

- **Desenvolvedor**: Maycon
- **GitHub**: [@Mayconxzdev](https://github.com/Mayconxzdev)
- **Projeto**: [AutoFluxo](https://github.com/Mayconxzdev/Automa-o_IA)

---

**AutoFluxo** - Transformando processos empresariais com inteligência artificial! 🚀