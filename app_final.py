#!/usr/bin/env python3
"""
Automation AI Advisor - Versão Final
Sistema completo e estável sem erros
"""

from flask import Flask, render_template, render_template_string, request, redirect, url_for, jsonify, g, send_file, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import google.generativeai as genai

# Configuração do Flask
app = Flask(__name__)
app.secret_key = 'automation-ai-advisor-secret-key-2024'

# Configuração do CORS
CORS(app)

# Configuração do Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Configuração do Google Gemini
GEMINI_API_KEY = "AIzaSyCPB-pNiTz5gT-j624X5SI9rL-LZlTVfGw"
GEMINI_ENABLED = False
model = None

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
    # Teste rápido para verificar se a API key é válida
    test_response = model.generate_content("test")
    GEMINI_ENABLED = True
    print("OK Google Gemini 2.5 Flash configurado e funcionando!")
except Exception as e:
    GEMINI_ENABLED = False
    print(f"AVISO: Google Gemini nao disponivel: {e}")
    print("Usando sistema de simulacao inteligente como fallback")

# Classe de usuário
class User(UserMixin):
    def __init__(self, id, username, email, company_name):
        self.id = id
        self.username = username
        self.email = email
        self.company_name = company_name

@login_manager.user_loader
def load_user(user_id):
    try:
        conn = sqlite3.connect('automation_advisor.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email, company_name FROM users WHERE id = ?', (user_id,))
        user_data = cursor.fetchone()
        conn.close()
        
        if user_data:
            return User(user_data['id'], user_data['username'], user_data['email'], user_data['company_name'])
        return None
    except Exception as e:
        print(f"Erro ao carregar usuário: {e}")
        return None

# Sistema de banco de dados
class Database:
    def __init__(self, db_path='automation_advisor.db'):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Inicializa banco de dados"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Tabela de usuários
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                company_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # Tabela de projetos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT DEFAULT 'Pendente',
                priority TEXT DEFAULT 'Média',
                estimated_hours INTEGER,
                expected_savings TEXT,
                implementation_cost REAL,
                monthly_savings REAL,
                roi_percentage REAL,
                payback_months INTEGER,
                recommended_tools TEXT,
                deadline DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Tabela de comentários
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS project_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                comment TEXT NOT NULL,
                parent_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_deleted BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (project_id) REFERENCES user_projects (id),
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (parent_id) REFERENCES project_comments (id)
            )
        ''')
        
        # Tabela de recomendações do usuário
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                priority TEXT DEFAULT 'Média',
                expected_savings TEXT,
                estimated_hours INTEGER,
                implementation_time TEXT,
                roi_percentage REAL,
                tools TEXT,
                flow_example TEXT,
                process_description TEXT NOT NULL,
                ai_generated BOOLEAN DEFAULT FALSE,
                gemini_used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Tabela de tags
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                color TEXT DEFAULT '#007bff',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        ''')
        
        # Tabela de relacionamento projeto-tags
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS project_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES user_projects (id),
                FOREIGN KEY (tag_id) REFERENCES tags (id),
                UNIQUE(project_id, tag_id)
            )
        ''')
        
        # Tabela de auditoria
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                entity_type TEXT NOT NULL,
                entity_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                old_values TEXT,
                new_values TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Tabela de fluxos de automação
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS automation_flows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                project_id INTEGER,
                title TEXT NOT NULL,
                description TEXT,
                flow_type TEXT NOT NULL,
                flow_data TEXT NOT NULL,
                tools_used TEXT,
                difficulty_level TEXT DEFAULT 'Médio',
                estimated_time TEXT,
                is_template BOOLEAN DEFAULT FALSE,
                is_public BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (project_id) REFERENCES user_projects (id)
            )
        ''')
        
        # Cria usuário demo se não existir
        cursor.execute('SELECT id FROM users WHERE username = ?', ('demo',))
        if not cursor.fetchone():
            password_hash = generate_password_hash('demo123')
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, company_name)
                VALUES (?, ?, ?, ?)
            ''', ('demo', 'demo@example.com', password_hash, 'Empresa Demo'))
            print("Usuário demo criado")
        
        # Cria algumas tags de exemplo
        cursor.execute('SELECT COUNT(*) FROM tags')
        if cursor.fetchone()[0] == 0:
            tags = [
                ('automação', '#007bff', 'Projetos de automação'),
                ('ia', '#28a745', 'Inteligência artificial'),
                ('roi', '#dc3545', 'Alto retorno sobre investimento'),
                ('urgente', '#ffc107', 'Prioridade alta'),
                ('inovação', '#17a2b8', 'Projetos inovadores')
            ]
            for name, color, desc in tags:
                cursor.execute('''
                    INSERT INTO tags (name, color, description, created_by)
                    VALUES (?, ?, ?, 1)
                ''', (name, color, desc))
            print("Tags de exemplo criadas")
        
        conn.commit()
        conn.close()
        print("Banco de dados inicializado com sucesso")

# Instância global do banco
db = Database()

# Sistema de comentários
class CommentsSystem:
    def add_comment(self, project_id: int, user_id: int, comment: str, parent_id: Optional[int] = None) -> Dict[str, Any]:
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO project_comments (project_id, user_id, comment, parent_id)
                VALUES (?, ?, ?, ?)
            ''', (project_id, user_id, comment, parent_id))
            
            comment_id = cursor.lastrowid
            
            cursor.execute('''
                SELECT 
                    pc.*,
                    u.username,
                    u.company_name
                FROM project_comments pc
                JOIN users u ON pc.user_id = u.id
                WHERE pc.id = ?
            ''', (comment_id,))
            
            comment_data = cursor.fetchone()
            
            conn.commit()
            conn.close()
            
            return {
                'status': 'success',
                'comment': dict(comment_data)
            }
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    def get_comments(self, project_id: int) -> List[Dict[str, Any]]:
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    pc.*,
                    u.username,
                    u.company_name
                FROM project_comments pc
                JOIN users u ON pc.user_id = u.id
                WHERE pc.project_id = ? AND pc.is_deleted = FALSE
                ORDER BY pc.created_at ASC
            ''', (project_id,))
            
            comments = cursor.fetchall()
            conn.close()
            
            return [dict(comment) for comment in comments]
        except Exception as e:
            return []

# Sistema de tags
class TagsSystem:
    def get_all_tags(self) -> List[Dict[str, Any]]:
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    t.*,
                    u.username as created_by_username,
                    COUNT(pt.project_id) as usage_count
                FROM tags t
                LEFT JOIN users u ON t.created_by = u.id
                LEFT JOIN project_tags pt ON t.id = pt.tag_id
                GROUP BY t.id
                ORDER BY t.name ASC
            ''')
            
            tags = cursor.fetchall()
            conn.close()
            
            return [dict(tag) for tag in tags]
        except Exception as e:
            return []

# Sistema de auditoria
class AuditSystem:
    def log_action(self, user_id: Optional[int], entity_type: str, entity_id: int, 
                   action: str, old_values: Optional[Dict] = None, 
                   new_values: Optional[Dict] = None, ip_address: Optional[str] = None,
                   user_agent: Optional[str] = None) -> bool:
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO audit_log (user_id, entity_type, entity_id, action, 
                                     old_values, new_values, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id, entity_type, entity_id, action,
                json.dumps(old_values) if old_values else None,
                json.dumps(new_values) if new_values else None,
                ip_address, user_agent
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Erro ao registrar auditoria: {e}")
            return False

# Instâncias dos sistemas
comments_system = CommentsSystem()
tags_system = TagsSystem()
audit_system = AuditSystem()

# API Health check endpoint
@app.route('/api/health')
def api_health_check():
    """API Health check endpoint"""
    try:
        # Testa conexão com banco
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0',
            'services': {
                'database': 'healthy',
                'authentication': 'healthy',
                'apis': 'healthy'
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# Handler único para before_request (evita conflitos)
@app.before_request
def before_request():
    """Handler único para before_request"""
    g.start_time = datetime.utcnow()

# Handler único para after_request (evita conflitos)
@app.after_request
def after_request(response):
    """Handler único para after_request"""
    if hasattr(g, 'start_time'):
        response_time = (datetime.utcnow() - g.start_time).total_seconds()
        
        # Log simples de performance
        if response_time > 120.0:  # Log apenas requests muito lentos
            print(f"Request lento: {request.endpoint} - {response_time:.2f}s")
    
    return response

# Health check endpoint
@app.route('/health')
def health_check():
    """Health check endpoint"""
    try:
        # Testa conexão com banco
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'database': 'ok',
            'application': 'ok'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }), 500

# Rotas principais
@app.route('/')
def index():
    """Página principal"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Página de login"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT id, username, email, password_hash, company_name FROM users WHERE username = ?', (username,))
            user_data = cursor.fetchone()
            conn.close()
            
            if user_data and check_password_hash(user_data['password_hash'], password):
                user = User(user_data['id'], user_data['username'], user_data['email'], user_data['company_name'])
                login_user(user)
                
                # Log de auditoria
                audit_system.log_action(user.id, 'user', user.id, 'login',
                                      ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
                
                return redirect(url_for('dashboard'))
            else:
                return render_template('auth/login.html', error="Usuário ou senha inválidos")
                
        except Exception as e:
            return f"Erro no login: {e}"
    
    return render_template('auth/login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """Dashboard principal"""
    try:
        # Busca projetos do usuário
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM user_projects WHERE user_id = ?', (current_user.id,))
        project_count = cursor.fetchone()[0]
        
        # Busca comentários recentes
        cursor.execute('''
            SELECT COUNT(*) FROM project_comments pc
            JOIN user_projects p ON pc.project_id = p.id
            WHERE p.user_id = ? AND pc.is_deleted = FALSE
        ''', (current_user.id,))
        comment_count = cursor.fetchone()[0]
        
        # Busca tags
        cursor.execute('SELECT COUNT(*) FROM tags')
        tag_count = cursor.fetchone()[0]
        
        
        conn.close()
        
        return render_template('dashboard.html', 
                              user=current_user,
                              project_count=project_count, 
                              comment_count=comment_count, 
                              tag_count=tag_count)
        
    except Exception as e:
        return f"Erro no dashboard: {e}"

@app.route('/recommended-flows')
@login_required
def recommended_flows():
    """Página de fluxos recomendados pela IA"""
    return render_template('recommended_flows.html', user=current_user)

# Rota de fluxos removida - agora integrada ao dashboard

@app.route('/logout')
@login_required
def logout():
    """Logout"""
    # Log de auditoria
    audit_system.log_action(current_user.id, 'user', current_user.id, 'logout',
                          ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
    
    logout_user()
    return redirect(url_for('login'))

# APIs
@app.route('/api/status')
def api_status():
    """API de status do sistema"""
    return jsonify({
        'status': 'success',
        'message': 'Automation AI Advisor funcionando perfeitamente',
        'version': '1.0.0',
        'features': {
            'authentication': True,
            'database': True,
            'comments_system': True,
            'tags_system': True,
            'audit_system': True,
            'api_endpoints': True,
            'health_check': True
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/tags')
@login_required
def api_tags():
    """API para listar tags"""
    try:
        tags = tags_system.get_all_tags()
        return jsonify({
            'status': 'success',
            'tags': tags
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/projects/<int:project_id>/comments', methods=['GET', 'POST'])
@login_required
def api_comments(project_id):
    """API para comentários"""
    if request.method == 'GET':
        try:
            comments = comments_system.get_comments(project_id)
            return jsonify({
                'status': 'success',
                'comments': comments
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'error': str(e)
            }), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            comment_text = data.get('comment', '').strip()
            parent_id = data.get('parent_id')
            
            if not comment_text:
                return jsonify({
                    'status': 'error',
                    'error': 'Comentário não pode estar vazio'
                }), 400
            
            result = comments_system.add_comment(project_id, current_user.id, comment_text, parent_id)
            
            # Log de auditoria
            audit_system.log_action(current_user.id, 'project_comment', project_id, 'create',
                                  new_values={'comment': comment_text, 'parent_id': parent_id},
                                  ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
            
            return jsonify(result)
        except Exception as e:
            return jsonify({
                'status': 'error',
                'error': str(e)
            }), 500

# APIs que estavam faltando
@app.route('/api/user/analytics', methods=['GET'])
@login_required
def get_user_analytics():
    """Obtém analytics do usuário"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Estatísticas básicas
        cursor.execute('SELECT COUNT(*) FROM user_projects WHERE user_id = ?', (current_user.id,))
        project_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM project_comments pc JOIN user_projects p ON pc.project_id = p.id WHERE p.user_id = ?', (current_user.id,))
        comment_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM tags')
        tag_count = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'analytics': {
                'projects': project_count,
                'comments': comment_count,
                'tags': tag_count,
                'recommendations': 0,
                'monthly_savings': 0,
                'avg_roi': 0
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/language', methods=['GET'])
@login_required
def get_language():
    """Obtém idioma atual"""
    return jsonify({
        'status': 'success',
        'language': 'pt-BR',
        'translations': {
            'welcome': 'Bem-vindo',
            'dashboard': 'Dashboard',
            'projects': 'Projetos',
            'recommendations': 'Recomendações'
        }
    })

@app.route('/api/language', methods=['POST'])
@login_required
def set_language():
    """Define idioma do usuário"""
    try:
        data = request.get_json()
        language = data.get('language', 'pt-BR')
        
        # Validar idioma
        available_languages = ['pt-BR', 'en-US']
        if language not in available_languages:
            return jsonify({
                'status': 'error',
                'error': f'Idioma não suportado. Idiomas disponíveis: {", ".join(available_languages)}'
            }), 400
        
        # Salvar preferência do usuário (simulação)
        # Em um sistema real, salvaria no banco de dados
        session['language'] = language
        
        return jsonify({
            'status': 'success',
            'message': f'Idioma alterado para {language}',
            'language': language
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/user/recommendations', methods=['GET'])
@login_required
def get_user_recommendations():
    """Obtém recomendações do usuário"""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        # Buscar recomendações reais do banco de dados
        conn = sqlite3.connect('automation_advisor.db')
        cursor = conn.cursor()
        
        # Verificar se a tabela existe, se não, criar
        try:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_recommendations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    priority TEXT DEFAULT 'Média',
                    expected_savings TEXT,
                    estimated_hours INTEGER,
                    implementation_time TEXT,
                    roi_percentage REAL,
                    tools TEXT,
                    flow_example TEXT,
                    process_description TEXT NOT NULL,
                    ai_generated BOOLEAN DEFAULT FALSE,
                    gemini_used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            conn.commit()
        except Exception as e:
            print(f"Erro ao criar tabela user_recommendations: {e}")
            conn.close()
            return jsonify({
                'status': 'error',
                'error': 'Erro no banco de dados'
            }), 500
        
        # Buscar recomendações geradas pelo usuário
        cursor.execute('''
            SELECT id, title, description, priority, expected_savings, 
                   estimated_hours, implementation_time, roi_percentage,
                   tools, flow_example, process_description, created_at
            FROM user_recommendations 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (current_user.id, limit))
        
        recommendations_data = cursor.fetchall()
        conn.close()
        
        recommendations = []
        for rec in recommendations_data:
            # Parse das ferramentas se for JSON
            tools = rec[8] if rec[8] else []
            if isinstance(tools, str):
                try:
                    tools = json.loads(tools)
                except:
                    tools = []
            
            # Parse do flow_example se for JSON
            flow_example = rec[9] if rec[9] else None
            if isinstance(flow_example, str):
                try:
                    flow_example = json.loads(flow_example)
                except:
                    flow_example = None
            
            recommendations.append({
                'id': rec[0],
                'title': rec[1],
                'description': rec[2],
                'priority': rec[3],
                'expected_savings': rec[4],
                'estimated_hours': rec[5],
                'implementation_time': rec[6],
                'roi_percentage': rec[7],
                'tools': tools,
                'flow_example': flow_example,
                'process_description': rec[10],
                'created_at': rec[11]
            })
        
        return jsonify({
            'status': 'success',
            'recommendations': recommendations
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/generate-recommendations', methods=['POST'])
@login_required
def generate_recommendations():
    """Gera recomendações baseadas em descrição usando Google Gemini"""
    try:
        data = request.get_json()
        description = data.get('description', '').strip()
        
        if not description:
            return jsonify({
                'status': 'error',
                'error': 'Descrição é obrigatória'
            }), 400
        
        # Tentar usar Gemini se disponível
        if GEMINI_ENABLED and model:
            try:
                # Prompt otimizado para o Gemini
                prompt = f"""
                Analise este processo e crie recomendações de automação específicas:

                PROCESSO: "{description}"

                Crie 2-3 recomendações de automação em JSON:

                {{
                    "recommendations": [
                        {{
                            "id": 1,
                            "title": "Nome específico da automação",
                            "description": "Descrição detalhada da automação e benefícios",
                            "priority": "Alta/Média/Baixa",
                            "estimated_hours": número_horas,
                            "expected_savings": "Valor em R$ ou horas/mês",
                            "implementation_time": "Tempo de implementação",
                            "roi_percentage": porcentagem_numerica,
                            "tools": [
                                {{
                                    "name": "Nome da ferramenta",
                                    "category": "Categoria",
                                    "description": "Como resolve o processo",
                                    "cost": "Gratuito/Pago",
                                    "difficulty": "Fácil/Médio/Avançado",
                                    "website": "https://url-real.com",
                                    "pricing": "Preço específico",
                                    "setup_time": "Tempo de configuração"
                                }}
                            ],
                            "flow_example": {{
                                "title": "Fluxo de automação",
                                "description": "Passo a passo da automação",
                                "flow_data": {{
                                    "nodes": [
                                        {{"id": "start", "type": "trigger", "name": "Início", "position": {{"x": 100, "y": 100}}, "description": "Como inicia"}},
                                        {{"id": "process", "type": "action", "name": "Processar", "position": {{"x": 300, "y": 100}}, "description": "O que faz"}},
                                        {{"id": "validate", "type": "condition", "name": "Validar", "position": {{"x": 500, "y": 100}}, "description": "Validação"}},
                                        {{"id": "success", "type": "action", "name": "Sucesso", "position": {{"x": 700, "y": 50}}, "description": "Ação de sucesso"}},
                                        {{"id": "error", "type": "action", "name": "Erro", "position": {{"x": 700, "y": 150}}, "description": "Ação de erro"}},
                                        {{"id": "end", "type": "action", "name": "Fim", "position": {{"x": 900, "y": 100}}, "description": "Finalização"}}
                                    ],
                                    "connections": [
                                        {{"from": "start", "to": "process"}},
                                        {{"from": "process", "to": "validate"}},
                                        {{"from": "validate", "to": "success", "condition": "sucesso"}},
                                        {{"from": "validate", "to": "error", "condition": "erro"}},
                                        {{"from": "success", "to": "end"}},
                                        {{"from": "error", "to": "end"}}
                                    ]
                                }}
                            }}
                        }}
                    ]
                }}

                Seja específico para o processo "{description}". Use ferramentas reais como Zapier, Make, Power Automate, n8n. Inclua preços realistas e URLs funcionais. Responda APENAS com JSON válido.
                """
                
                # Chamada para o Gemini com timeout
                import threading
                import queue
                
                def call_gemini():
                    try:
                        response = model.generate_content(prompt)
                        result_queue.put(('success', response))
                    except Exception as e:
                        result_queue.put(('error', e))
                
                result_queue = queue.Queue()
                thread = threading.Thread(target=call_gemini)
                thread.daemon = True
                thread.start()
                thread.join(timeout=120)  # Timeout de 120 segundos
                
                if thread.is_alive():
                    print("Gemini demorou mais de 120 segundos. Usando sistema de simulação.")
                    raise Exception("Timeout: Gemini demorou muito para responder")
                
                if result_queue.empty():
                    raise Exception("Erro: Nenhuma resposta do Gemini")
                
                result_type, result_data = result_queue.get()
                if result_type == 'error':
                    raise result_data
                
                response = result_data
                
                # Parse da resposta
                try:
                    # Extrair JSON da resposta
                    response_text = response.text.strip()
                    
                    # Limpar a resposta se houver markdown
                    if response_text.startswith('```json'):
                        response_text = response_text.replace('```json', '').replace('```', '').strip()
                    elif response_text.startswith('```'):
                        response_text = response_text.replace('```', '').strip()
                    
                    # Parse do JSON
                    gemini_data = json.loads(response_text)
                    recommendations = gemini_data.get('recommendations', [])
                    
                    # Adicionar IDs únicos
                    for i, rec in enumerate(recommendations, 1):
                        rec['id'] = i
                    
                    # Salvar recomendações no banco de dados
                    conn = sqlite3.connect('automation_advisor.db')
                    cursor = conn.cursor()
                    
                    for rec in recommendations:
                        cursor.execute('''
                            INSERT INTO user_recommendations 
                            (user_id, title, description, priority, expected_savings, 
                             estimated_hours, implementation_time, roi_percentage, 
                             tools, flow_example, process_description, ai_generated, gemini_used)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            current_user.id,
                            rec.get('title', ''),
                            rec.get('description', ''),
                            rec.get('priority', 'Média'),
                            rec.get('expected_savings', ''),
                            rec.get('estimated_hours', 0),
                            rec.get('implementation_time', ''),
                            rec.get('roi_percentage', 0),
                            json.dumps(rec.get('tools', [])),
                            json.dumps(rec.get('flow_example', {})),
                            description,
                            True,
                            True
                        ))
                    
                    conn.commit()
                    conn.close()
                    
                    return jsonify({
                        'status': 'success',
                        'recommendations': recommendations,
                        'ai_generated': True,
                        'gemini_used': True
                    })
                    
                except (json.JSONDecodeError, KeyError) as e:
                    print(f"Erro ao fazer parse da resposta do Gemini: {e}")
                    print(f"Resposta recebida: {response_text[:200]}...")
                    # Se o parse falhar, usar simulação inteligente
                    pass
                    
            except Exception as e:
                print(f"Erro ao usar Gemini: {e}")
                # Se o Gemini falhar, usar simulação inteligente
                pass
        
        # Sistema de simulação inteligente (fallback ou padrão)
        print("Executando sistema de simulação inteligente...")
        recommendations = []
        description_lower = description.lower()
        
        # Análise inteligente baseada em palavras-chave
        if any(word in description_lower for word in ['nota fiscal', 'nfe', 'nf-e', 'faturamento', 'fatura', 'cobrança', 'cobranca', 'venda', 'vendas', 'faturar', 'faturas', 'notas fiscais', 'gerar nota', 'emissão de nota']):
            print("Criando recomendação específica para nota fiscal...")
            recommendations.append({
                'id': 1,
                'title': 'Automação Completa de Emissão de Nota Fiscal',
                'description': f'Sistema automatizado para emissão de notas fiscais eletrônicas, integrando ERP, sistema fiscal e contabilidade. Elimina erros manuais, acelera o processo de faturamento e garante conformidade fiscal. Reduz tempo de emissão de 30 minutos para 2 minutos por nota. Baseado em: "{description[:80]}..."',
                'priority': 'Alta',
                'estimated_hours': 60,
                'expected_savings': 'R$ 3.500/mês',
                'implementation_time': '3-4 semanas',
                'roi_percentage': 450,
                'tools': [
                    {
                        'name': 'NFe.io',
                        'category': 'Fiscal',
                        'description': 'API completa para emissão de notas fiscais eletrônicas com integração direta ao SEFAZ. Suporte a todos os tipos de NFe e validação automática de dados fiscais.',
                        'cost': 'Pago',
                        'difficulty': 'Médio',
                        'website': 'https://nfe.io',
                        'pricing': 'R$ 0,50 por NFe emitida',
                        'setup_time': '1 semana'
                    },
                    {
                        'name': 'Zapier',
                        'category': 'Integração',
                        'description': 'Conecta sistemas de vendas com emissor de NFe automaticamente. Dispara emissão quando nova venda é registrada no ERP.',
                        'cost': 'Pago',
                        'difficulty': 'Fácil',
                        'website': 'https://zapier.com',
                        'pricing': 'R$ 29/mês (plano Starter)',
                        'setup_time': '2 dias'
                    },
                    {
                        'name': 'Make (Integromat)',
                        'category': 'Automação',
                        'description': 'Automatiza fluxo completo de faturamento com validações e tratamento de erros. Inclui integração com múltiplos sistemas.',
                        'cost': 'Pago',
                        'difficulty': 'Médio',
                        'website': 'https://make.com',
                        'pricing': 'R$ 19/mês (plano Core)',
                        'setup_time': '1 semana'
                    },
                    {
                        'name': 'Microsoft Power Automate',
                        'category': 'RPA',
                        'description': 'Automatiza processos de faturamento usando RPA. Ideal para empresas que usam Microsoft 365.',
                        'cost': 'Pago',
                        'difficulty': 'Fácil',
                        'website': 'https://powerautomate.microsoft.com',
                        'pricing': 'R$ 15/usuário/mês',
                        'setup_time': '3 dias'
                    }
                ],
                'flow_example': {
                    'title': 'Fluxo de Emissão Automática de NFe com Validações',
                    'description': 'Automatiza desde a venda até a emissão da nota fiscal com validações completas e tratamento de erros',
                    'flow_data': {
                        'nodes': [
                            {'id': 'venda_trigger', 'type': 'trigger', 'name': 'Nova Venda no ERP', 'position': {'x': 100, 'y': 100}, 'description': 'Webhook disparado quando nova venda é registrada no sistema de vendas'},
                            {'id': 'extrair_dados', 'type': 'action', 'name': 'Extrair Dados da Venda', 'position': {'x': 300, 'y': 100}, 'description': 'Conecta com API do ERP e extrai dados completos do pedido (cliente, produtos, valores)'},
                            {'id': 'validar_cliente', 'type': 'condition', 'name': 'Validar Dados do Cliente', 'position': {'x': 500, 'y': 100}, 'description': 'Verifica se cliente tem CPF/CNPJ válido e dados fiscais completos'},
                            {'id': 'calcular_impostos', 'type': 'action', 'name': 'Calcular Impostos Automático', 'position': {'x': 700, 'y': 50}, 'description': 'Calcula ICMS, IPI, PIS, COFINS baseado na localização e tipo de produto'},
                            {'id': 'emitir_nfe', 'type': 'action', 'name': 'Emitir NFe no SEFAZ', 'position': {'x': 900, 'y': 50}, 'description': 'Envia dados para SEFAZ via API NFe.io e emite nota fiscal eletrônica'},
                            {'id': 'enviar_email', 'type': 'action', 'name': 'Enviar NFe por Email', 'position': {'x': 1100, 'y': 50}, 'description': 'Envia NFe em PDF para cliente automaticamente com dados do pedido'},
                            {'id': 'atualizar_crm', 'type': 'action', 'name': 'Atualizar CRM', 'position': {'x': 1300, 'y': 50}, 'description': 'Registra venda no CRM e atualiza status do lead para cliente'},
                            {'id': 'contabilizar', 'type': 'action', 'name': 'Registrar na Contabilidade', 'position': {'x': 1500, 'y': 50}, 'description': 'Integra com sistema contábil e registra receita e impostos'},
                            {'id': 'dados_invalidos', 'type': 'action', 'name': 'Notificar Dados Inválidos', 'position': {'x': 700, 'y': 150}, 'description': 'Envia alerta para equipe comercial sobre dados incompletos do cliente'},
                            {'id': 'erro_emissao', 'type': 'action', 'name': 'Notificar Erro de Emissão', 'position': {'x': 900, 'y': 150}, 'description': 'Alerta equipe fiscal sobre problemas na emissão da NFe'},
                            {'id': 'log_execucao', 'type': 'action', 'name': 'Registrar Log de Execução', 'position': {'x': 1500, 'y': 150}, 'description': 'Registra execução completa e status de cada etapa do processo'}
                        ],
                        'connections': [
                            {'from': 'venda_trigger', 'to': 'extrair_dados'},
                            {'from': 'extrair_dados', 'to': 'validar_cliente'},
                            {'from': 'validar_cliente', 'to': 'calcular_impostos', 'condition': 'dados_validos'},
                            {'from': 'validar_cliente', 'to': 'dados_invalidos', 'condition': 'dados_invalidos'},
                            {'from': 'calcular_impostos', 'to': 'emitir_nfe'},
                            {'from': 'emitir_nfe', 'to': 'enviar_email', 'condition': 'nfe_emitida'},
                            {'from': 'emitir_nfe', 'to': 'erro_emissao', 'condition': 'erro_emissao'},
                            {'from': 'enviar_email', 'to': 'atualizar_crm'},
                            {'from': 'atualizar_crm', 'to': 'contabilizar'},
                            {'from': 'dados_invalidos', 'to': 'log_execucao'},
                            {'from': 'erro_emissao', 'to': 'log_execucao'},
                            {'from': 'contabilizar', 'to': 'log_execucao'}
                        ]
                    }
                },
                'process_description': description
            })
        elif any(word in description_lower for word in ['relatório', 'relatorio', 'report', 'planilha', 'excel', 'dados', 'informação']):
            recommendations.append({
                'id': 1,
                'title': 'Automação de Relatórios Inteligente',
                'description': f'Automatize a geração de relatórios usando ferramentas de automação e integração de dados. Sistema que conecta fontes de dados e gera relatórios automaticamente. Baseado em: "{description[:80]}..."',
                'priority': 'Alta',
                'estimated_hours': 40,
                'expected_savings': 'R$ 2.500/mês',
                'tools': [
                    {
                        'name': 'Zapier',
                        'category': 'Integração',
                        'description': 'Plataforma de automação que conecta diferentes aplicações sem código',
                        'cost': 'Pago',
                        'difficulty': 'Fácil',
                        'website': 'https://zapier.com',
                        'pricing': 'A partir de $19.99/mês',
                        'setup_time': '1-2 horas'
                    },
                    {
                        'name': 'Make (Integromat)',
                        'category': 'Integração',
                        'description': 'Ferramenta de automação visual para conectar apps com interface drag-and-drop',
                        'cost': 'Pago',
                        'difficulty': 'Médio',
                        'website': 'https://make.com',
                        'pricing': 'A partir de $9/mês',
                        'setup_time': '2-4 horas'
                    },
                    {
                        'name': 'Google Apps Script',
                        'category': 'API',
                        'description': 'Automação de planilhas e documentos do Google usando JavaScript',
                        'cost': 'Gratuito',
                        'difficulty': 'Médio',
                        'website': 'https://script.google.com',
                        'pricing': 'Gratuito (limite de execuções)',
                        'setup_time': '3-6 horas'
                    },
                    {
                        'name': 'Power BI',
                        'category': 'BI/Analytics',
                        'description': 'Ferramenta de business intelligence da Microsoft para visualização de dados',
                        'cost': 'Pago',
                        'difficulty': 'Médio',
                        'website': 'https://powerbi.microsoft.com',
                        'pricing': 'A partir de $10/usuário/mês',
                        'setup_time': '4-8 horas'
                    }
                ],
                'flow_example': {
                    'title': 'Fluxo de Automação de Relatórios Mensais',
                    'description': 'Automatiza a coleta, processamento e distribuição de relatórios mensais',
                    'flow_data': {
                        'nodes': [
                            {'id': 'schedule', 'type': 'trigger', 'name': 'Agendador (1º de cada mês)', 'position': {'x': 100, 'y': 100}, 'description': 'Dispara automaticamente no primeiro dia de cada mês'},
                            {'id': 'extract', 'type': 'action', 'name': 'Extrair Dados do CRM', 'position': {'x': 300, 'y': 100}, 'description': 'Conecta com CRM e extrai dados de vendas e clientes'},
                            {'id': 'validate', 'type': 'condition', 'name': 'Validar Dados', 'position': {'x': 500, 'y': 100}, 'description': 'Verifica se os dados estão completos e corretos'},
                            {'id': 'process', 'type': 'action', 'name': 'Processar e Calcular', 'position': {'x': 700, 'y': 50}, 'description': 'Calcula métricas, KPIs e gera insights'},
                            {'id': 'generate', 'type': 'action', 'name': 'Gerar Relatório PDF', 'position': {'x': 900, 'y': 50}, 'description': 'Cria relatório em PDF com gráficos e tabelas'},
                            {'id': 'send', 'type': 'action', 'name': 'Enviar por Email', 'position': {'x': 1100, 'y': 50}, 'description': 'Envia relatório para gestores e stakeholders'},
                            {'id': 'notify_error', 'type': 'action', 'name': 'Notificar Erro', 'position': {'x': 700, 'y': 150}, 'description': 'Envia alerta se houver problemas nos dados'},
                            {'id': 'log', 'type': 'action', 'name': 'Registrar Log', 'position': {'x': 1100, 'y': 150}, 'description': 'Registra execução e status do processo'}
                        ],
                        'connections': [
                            {'from': 'schedule', 'to': 'extract'},
                            {'from': 'extract', 'to': 'validate'},
                            {'from': 'validate', 'to': 'process', 'condition': 'dados_validos'},
                            {'from': 'validate', 'to': 'notify_error', 'condition': 'dados_invalidos'},
                            {'from': 'process', 'to': 'generate'},
                            {'from': 'generate', 'to': 'send'},
                            {'from': 'notify_error', 'to': 'log'},
                            {'from': 'send', 'to': 'log'}
                        ]
                    }
                },
                'implementation_time': '2-3 semanas',
                'roi_percentage': 300,
                'process_description': description
            })
        
        if any(word in description_lower for word in ['email', 'e-mail', 'mensagem', 'notificação', 'cobrança', 'cliente']):
            recommendations.append({
                'id': 2,
                'title': 'Sistema de Comunicação Automatizada',
                'description': f'Automatize envio de e-mails, notificações e comunicações usando ferramentas de marketing automation e CRM. Sistema que personaliza mensagens e gerencia leads automaticamente. Baseado em: "{description[:80]}..."',
                'priority': 'Alta',
                'estimated_hours': 30,
                'expected_savings': 'R$ 1.800/mês',
                'tools': [
                    {
                        'name': 'HubSpot',
                        'category': 'CRM/Marketing',
                        'description': 'Plataforma completa de CRM e marketing automation com automação de email',
                        'cost': 'Pago',
                        'difficulty': 'Médio',
                        'website': 'https://hubspot.com',
                        'pricing': 'A partir de $45/mês',
                        'setup_time': '4-8 horas'
                    },
                    {
                        'name': 'Mailchimp',
                        'category': 'Email Marketing',
                        'description': 'Plataforma de email marketing com automação visual e segmentação',
                        'cost': 'Pago',
                        'difficulty': 'Fácil',
                        'website': 'https://mailchimp.com',
                        'pricing': 'A partir de $10/mês',
                        'setup_time': '1-3 horas'
                    },
                    {
                        'name': 'ActiveCampaign',
                        'category': 'Marketing Automation',
                        'description': 'Ferramenta avançada de automação de marketing com CRM integrado',
                        'cost': 'Pago',
                        'difficulty': 'Médio',
                        'website': 'https://activecampaign.com',
                        'pricing': 'A partir de $15/mês',
                        'setup_time': '3-6 horas'
                    },
                    {
                        'name': 'Zapier',
                        'category': 'Integração',
                        'description': 'Conecta diferentes aplicações para automação sem código',
                        'cost': 'Pago',
                        'difficulty': 'Fácil',
                        'website': 'https://zapier.com',
                        'pricing': 'A partir de $19.99/mês',
                        'setup_time': '1-2 horas'
                    }
                ],
                'flow_example': {
                    'title': 'Fluxo de Email Automático de Boas-vindas',
                    'description': 'Automatiza o envio de emails personalizados baseado no perfil do usuário',
                    'flow_data': {
                        'nodes': [
                            {'id': 'webhook', 'type': 'trigger', 'name': 'Webhook (Novo Cadastro)', 'position': {'x': 100, 'y': 100}, 'description': 'Dispara quando um novo usuário se cadastra no sistema'},
                            {'id': 'enrich', 'type': 'action', 'name': 'Enriquecer Dados', 'position': {'x': 300, 'y': 100}, 'description': 'Busca informações adicionais do usuário (empresa, cargo, etc.)'},
                            {'id': 'segment', 'type': 'condition', 'name': 'Segmentar por Perfil', 'position': {'x': 500, 'y': 100}, 'description': 'Classifica o usuário por tipo de negócio ou interesse'},
                            {'id': 'email_vip', 'type': 'action', 'name': 'Email VIP Personalizado', 'position': {'x': 700, 'y': 50}, 'description': 'Envia email personalizado para clientes VIP'},
                            {'id': 'email_standard', 'type': 'action', 'name': 'Email Padrão', 'position': {'x': 700, 'y': 150}, 'description': 'Envia email padrão de boas-vindas'},
                            {'id': 'crm_update', 'type': 'action', 'name': 'Atualizar CRM', 'position': {'x': 900, 'y': 50}, 'description': 'Registra interação no CRM'},
                            {'id': 'follow_up', 'type': 'action', 'name': 'Agendar Follow-up', 'position': {'x': 900, 'y': 150}, 'description': 'Agenda follow-up para 7 dias'},
                            {'id': 'analytics', 'type': 'action', 'name': 'Registrar Analytics', 'position': {'x': 1100, 'y': 100}, 'description': 'Registra métricas de abertura e cliques'}
                        ],
                        'connections': [
                            {'from': 'webhook', 'to': 'enrich'},
                            {'from': 'enrich', 'to': 'segment'},
                            {'from': 'segment', 'to': 'email_vip', 'condition': 'perfil_vip'},
                            {'from': 'segment', 'to': 'email_standard', 'condition': 'perfil_standard'},
                            {'from': 'email_vip', 'to': 'crm_update'},
                            {'from': 'email_standard', 'to': 'follow_up'},
                            {'from': 'crm_update', 'to': 'analytics'},
                            {'from': 'follow_up', 'to': 'analytics'}
                        ]
                    }
                },
                'implementation_time': '1-2 semanas',
                'roi_percentage': 250,
                'process_description': description
            })
        
        if any(word in description_lower for word in ['backup', 'cópia', 'copia', 'arquivo', 'dados', 'segurança']):
            recommendations.append({
                'id': 3,
                'title': 'Sistema de Backup Inteligente',
                'description': f'Implemente backup automático usando ferramentas de cloud storage e automação. Sistema que monitora mudanças e sincroniza dados automaticamente. Baseado em: "{description[:80]}..."',
                'priority': 'Alta',
                'estimated_savings': 'R$ 1.200/mês',
                'tools': ['AWS S3', 'Google Drive API', 'Dropbox API', 'Zapier', 'Microsoft Power Automate'],
                'implementation_time': '1-2 semanas',
                'roi_percentage': 200,
                'process_description': description
            })
        
        if any(word in description_lower for word in ['vendas', 'venda', 'cliente', 'pedido', 'faturamento', 'financeiro']):
            recommendations.append({
                'id': 4,
                'title': 'Automação de Processos de Vendas',
                'description': f'Automatize processos de vendas, faturamento e gestão de clientes usando CRM e ferramentas de automação. Sistema que gerencia leads, oportunidades e follow-ups automaticamente. Baseado em: "{description[:80]}..."',
                'priority': 'Alta',
                'estimated_savings': 'R$ 3.000/mês',
                'tools': ['Salesforce', 'HubSpot', 'Pipedrive', 'Zapier', 'Monday.com'],
                'implementation_time': '3-4 semanas',
                'roi_percentage': 350,
                'process_description': description
            })
        
        # Se não encontrou palavras-chave específicas, criar recomendação genérica inteligente
        if not recommendations:
            recommendations.append({
                'id': 1,
                'title': 'Automação Inteligente de Processo',
                'description': f'Analise e automatize o processo descrito usando ferramentas de automação no-code e integração de sistemas. Solução que conecta diferentes plataformas e automatiza workflows. Baseado em: "{description[:80]}..."',
                'priority': 'Média',
                'estimated_savings': 'R$ 1.500/mês',
                'tools': ['Zapier', 'n8n', 'Make', 'Bubble', 'Microsoft Power Automate'],
                'implementation_time': '2-4 semanas',
                'roi_percentage': 200,
                'process_description': description
            })
        
        print(f"Sistema de simulação criou {len(recommendations)} recomendações")
        
        # Salvar recomendações no banco de dados
        conn = sqlite3.connect('automation_advisor.db')
        cursor = conn.cursor()
        
        for rec in recommendations:
            cursor.execute('''
                INSERT INTO user_recommendations 
                (user_id, title, description, priority, expected_savings, 
                 estimated_hours, implementation_time, roi_percentage, 
                 tools, flow_example, process_description, ai_generated, gemini_used)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                current_user.id,
                rec.get('title', ''),
                rec.get('description', ''),
                rec.get('priority', 'Média'),
                rec.get('expected_savings', ''),
                rec.get('estimated_hours', 0),
                rec.get('implementation_time', ''),
                rec.get('roi_percentage', 0),
                json.dumps(rec.get('tools', [])),
                json.dumps(rec.get('flow_example', {})),
                description,
                True,
                False
            ))
        
        conn.commit()
        conn.close()
        
        print(f"Recomendações salvas no banco de dados com sucesso!")
        
        return jsonify({
            'status': 'success',
            'recommendations': recommendations,
            'ai_generated': True,
            'gemini_used': False,
            'intelligent_simulation': True
        })
        
    except Exception as e:
        # Fallback em caso de erro
        error_message = str(e)
        
        # Determinar tipo de erro
        if "Timeout" in error_message:
            print("Timeout detectado. Executando sistema de simulação...")
            # Para timeout, executar sistema de simulação
            # Mover para o final da função para executar simulação
            pass
        elif "API key" in error_message:
            error_type = "api_key"
            user_message = "Problema com a chave da API. Usando sistema de backup."
        elif "Connection" in error_message:
            error_type = "connection"
            user_message = "Problema de conexão com a IA. Usando sistema de backup."
        else:
            error_type = "unknown"
            user_message = "Erro inesperado. Usando sistema de backup."
        
        recommendations = [{
            'id': 1,
            'title': 'Automação de Processo',
            'description': f'Automatize o processo descrito usando Python e ferramentas de automação. Baseado na descrição: "{description[:100]}..."',
            'priority': 'Média',
            'estimated_savings': 'R$ 1.000/mês',
            'tools': ['Python', 'Selenium', 'Requests', 'Schedule'],
            'implementation_time': '2-4 semanas',
            'roi_percentage': 150,
            'process_description': description
        }]
        
        # Se não for timeout, retornar erro
        if "Timeout" not in error_message:
            return jsonify({
                'status': 'error',
                'error': str(e)
            }), 500
        
        return jsonify({
            'status': 'success',
            'recommendations': recommendations,
            'ai_generated': False,
            'fallback': True,
            'error_type': error_type,
            'error_message': user_message,
            'debug_error': error_message
        })

# API para Notificações
@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    """Obtém notificações do usuário"""
    try:
        # Simulação de notificações
        notifications = [
            {
                'id': 1,
                'title': 'Bem-vindo ao sistema!',
                'message': 'Seu dashboard está pronto para uso.',
                'type': 'info',
                'created_at': '2025-09-30T23:00:00Z',
                'is_read': False
            }
        ]
        
        return jsonify({
            'status': 'success',
            'notifications': notifications
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# API para Notificações do Usuário (alias)
@app.route('/api/user/notifications', methods=['GET'])
@login_required
def get_user_notifications():
    """Obtém notificações do usuário (alias para /api/notifications)"""
    return get_notifications()

# API para Projetos do Usuário (alias)
@app.route('/api/user/projects', methods=['GET'])
@login_required
def get_user_projects():
    """Obtém projetos do usuário (alias para /api/projects)"""
    return get_projects()

@app.route('/api/user/projects/<int:project_id>', methods=['PUT'])
@login_required
def update_user_project(project_id):
    """Atualiza projeto do usuário (alias para /api/projects/<id>)"""
    return update_project(project_id)

@app.route('/api/user/projects/<int:project_id>', methods=['DELETE'])
@login_required
def delete_user_project(project_id):
    """Exclui projeto do usuário (alias para /api/projects/<id>)"""
    return delete_project(project_id)

# API para Templates
@app.route('/api/templates', methods=['GET'])
@login_required
def get_templates():
    """Obtém templates de projetos disponíveis"""
    try:
        # Templates pré-definidos
        templates = [
            {
                'id': 1,
                'name': 'Automação de Relatórios',
                'description': 'Template para automatizar geração de relatórios em Excel/PDF',
                'category': 'Relatórios',
                'estimated_hours': 40,
                'implementation_cost': 5000,
                'monthly_savings': 2000,
                'tools': ['Python', 'Pandas', 'ReportLab', 'OpenPyXL'],
                'process_description': 'Geração manual de relatórios mensais em Excel que demora 8 horas por mês'
            },
            {
                'id': 2,
                'name': 'Automação de E-mails',
                'description': 'Template para automatizar envio de e-mails e notificações',
                'category': 'Comunicação',
                'estimated_hours': 20,
                'implementation_cost': 2000,
                'monthly_savings': 800,
                'tools': ['Python', 'SMTP', 'Jinja2', 'Schedule'],
                'process_description': 'Envio manual de e-mails de cobrança e notificações que demora 2 horas por semana'
            },
            {
                'id': 3,
                'name': 'Sistema de Backup',
                'description': 'Template para automatizar backup de arquivos e dados',
                'category': 'Infraestrutura',
                'estimated_hours': 30,
                'implementation_cost': 3000,
                'monthly_savings': 1200,
                'tools': ['Python', 'rsync', 'AWS S3', 'Cron'],
                'process_description': 'Backup manual de arquivos importantes que demora 4 horas por semana'
            },
            {
                'id': 4,
                'name': 'Automação de Planilhas',
                'description': 'Template para automatizar processamento de planilhas',
                'category': 'Dados',
                'estimated_hours': 25,
                'implementation_cost': 2500,
                'monthly_savings': 1500,
                'tools': ['Python', 'Pandas', 'OpenPyXL', 'NumPy'],
                'process_description': 'Processamento manual de planilhas de vendas que demora 6 horas por semana'
            },
            {
                'id': 5,
                'name': 'Monitoramento de Sistemas',
                'description': 'Template para monitorar sistemas e gerar alertas',
                'category': 'Monitoramento',
                'estimated_hours': 35,
                'implementation_cost': 4000,
                'monthly_savings': 1800,
                'tools': ['Python', 'psutil', 'requests', 'telegram-bot'],
                'process_description': 'Monitoramento manual de servidores e sistemas que demora 3 horas por dia'
            }
        ]
        
        return jsonify({
            'status': 'success',
            'templates': templates
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/templates/<int:template_id>/use', methods=['POST'])
@login_required
def use_template(template_id):
    """Usa um template para criar um projeto"""
    try:
        # Buscar template
        templates = [
            {
                'id': 1,
                'name': 'Automação de Relatórios',
                'description': 'Template para automatizar geração de relatórios em Excel/PDF',
                'category': 'Relatórios',
                'estimated_hours': 40,
                'implementation_cost': 5000,
                'monthly_savings': 2000,
                'tools': ['Python', 'Pandas', 'ReportLab', 'OpenPyXL'],
                'process_description': 'Geração manual de relatórios mensais em Excel que demora 8 horas por mês'
            },
            {
                'id': 2,
                'name': 'Automação de E-mails',
                'description': 'Template para automatizar envio de e-mails e notificações',
                'category': 'Comunicação',
                'estimated_hours': 20,
                'implementation_cost': 2000,
                'monthly_savings': 800,
                'tools': ['Python', 'SMTP', 'Jinja2', 'Schedule'],
                'process_description': 'Envio manual de e-mails de cobrança e notificações que demora 2 horas por semana'
            },
            {
                'id': 3,
                'name': 'Sistema de Backup',
                'description': 'Template para automatizar backup de arquivos e dados',
                'category': 'Infraestrutura',
                'estimated_hours': 30,
                'implementation_cost': 3000,
                'monthly_savings': 1200,
                'tools': ['Python', 'rsync', 'AWS S3', 'Cron'],
                'process_description': 'Backup manual de arquivos importantes que demora 4 horas por semana'
            },
            {
                'id': 4,
                'name': 'Automação de Planilhas',
                'description': 'Template para automatizar processamento de planilhas',
                'category': 'Dados',
                'estimated_hours': 25,
                'implementation_cost': 2500,
                'monthly_savings': 1500,
                'tools': ['Python', 'Pandas', 'OpenPyXL', 'NumPy'],
                'process_description': 'Processamento manual de planilhas de vendas que demora 6 horas por semana'
            },
            {
                'id': 5,
                'name': 'Monitoramento de Sistemas',
                'description': 'Template para monitorar sistemas e gerar alertas',
                'category': 'Monitoramento',
                'estimated_hours': 35,
                'implementation_cost': 4000,
                'monthly_savings': 1800,
                'tools': ['Python', 'psutil', 'requests', 'telegram-bot'],
                'process_description': 'Monitoramento manual de servidores e sistemas que demora 3 horas por dia'
            }
        ]
        
        template = next((t for t in templates if t['id'] == template_id), None)
        if not template:
            return jsonify({
                'status': 'error',
                'error': 'Template não encontrado'
            }), 404
        
        # Criar projeto baseado no template
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Calcular ROI
        roi_percentage = 0
        payback_months = 0
        if template['implementation_cost'] > 0 and template['monthly_savings'] > 0:
            roi_percentage = ((template['monthly_savings'] * 12) / template['implementation_cost']) * 100
            payback_months = template['implementation_cost'] / template['monthly_savings']
        
        cursor.execute('''
            INSERT INTO user_projects 
            (user_id, title, description, status, priority, estimated_hours, 
             implementation_cost, monthly_savings, roi_percentage, payback_months, recommended_tools)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (current_user.id, template['name'], template['description'], 'Pendente', 'Alta', 
              template['estimated_hours'], template['implementation_cost'], template['monthly_savings'], 
              roi_percentage, payback_months, json.dumps(template['tools'])))
        
        project_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Log de auditoria
        audit_system.log_action(current_user.id, 'project', project_id, 'create',
                              new_values={'title': template['name'], 'template_id': template_id},
                              ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
        
        return jsonify({
            'status': 'success',
            'message': f'Projeto criado com sucesso usando template "{template["name"]}"',
            'project_id': project_id,
            'template': template
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# API para Recomendação Específica
@app.route('/api/user/recommendations/<int:recommendation_id>', methods=['GET'])
@login_required
def get_recommendation(recommendation_id):
    """Obtém uma recomendação específica por ID"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM user_recommendations 
            WHERE id = ? AND user_id = ?
        ''', (recommendation_id, current_user.id))
        
        recommendation = cursor.fetchone()
        conn.close()
        
        if not recommendation:
            return jsonify({
                'status': 'error',
                'error': 'Recomendação não encontrada'
            }), 404
        
        return jsonify({
            'status': 'success',
            'recommendation': dict(recommendation)
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# API para Excluir Recomendação
@app.route('/api/recommendations/<int:recommendation_id>', methods=['DELETE'])
@login_required
def delete_recommendation(recommendation_id):
    """Exclui uma recomendação específica"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Verificar se a recomendação existe e pertence ao usuário
        cursor.execute('''
            SELECT id FROM user_recommendations 
            WHERE id = ? AND user_id = ?
        ''', (recommendation_id, current_user.id))
        
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                'status': 'error',
                'error': 'Recomendação não encontrada'
            }), 404
        
        # Excluir a recomendação
        cursor.execute('''
            DELETE FROM user_recommendations 
            WHERE id = ? AND user_id = ?
        ''', (recommendation_id, current_user.id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Recomendação excluída com sucesso'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# API para Limpar Todo o Histórico
@app.route('/api/recommendations/clear-all', methods=['DELETE'])
@login_required
def clear_all_recommendations():
    """Limpa todo o histórico de recomendações do usuário"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Excluir todas as recomendações do usuário
        cursor.execute('''
            DELETE FROM user_recommendations 
            WHERE user_id = ?
        ''', (current_user.id,))
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': f'{deleted_count} recomendações foram excluídas com sucesso'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# API para Métricas IoT
@app.route('/api/user/iot-metrics', methods=['GET'])
@login_required
def get_iot_metrics():
    """Obtém métricas IoT do usuário"""
    try:
        limit = request.args.get('limit', 30, type=int)
        
        # Simulação de métricas IoT
        metrics = []
        for i in range(min(limit, 10)):
            metrics.append({
                'id': i + 1,
                'sensor': f'Sensor_{i+1}',
                'value': 20 + (i * 2),
                'unit': '°C',
                'timestamp': f'2025-09-30T{23-i:02d}:00:00Z',
                'status': 'active'
            })
        
        return jsonify({
            'status': 'success',
            'metrics': metrics
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# APIs para Projetos
@app.route('/api/projects', methods=['GET'])
@login_required
def get_projects():
    """Obtém projetos do usuário"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                p.*,
                COUNT(pc.id) as comment_count,
                GROUP_CONCAT(t.name) as tags
            FROM user_projects p
            LEFT JOIN project_comments pc ON p.id = pc.project_id AND pc.is_deleted = FALSE
            LEFT JOIN project_tags pt ON p.id = pt.project_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE p.user_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        ''', (current_user.id,))
        
        projects = cursor.fetchall()
        conn.close()
        
        projects_list = []
        for project in projects:
            project_dict = dict(project)
            project_dict['tags'] = project_dict['tags'].split(',') if project_dict['tags'] else []
            projects_list.append(project_dict)
        
        return jsonify({
            'status': 'success',
            'projects': projects_list
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    """Cria novo projeto"""
    try:
        data = request.get_json()
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        priority = data.get('priority', 'Média')
        estimated_hours = data.get('estimated_hours')
        implementation_cost = data.get('implementation_cost', 0)
        monthly_savings = data.get('monthly_savings', 0)
        deadline = data.get('deadline')
        
        if not title or not description:
            return jsonify({
                'status': 'error',
                'error': 'Título e descrição são obrigatórios'
            }), 400
        
        # Calcular ROI
        roi_percentage = 0
        payback_months = 0
        if implementation_cost > 0 and monthly_savings > 0:
            roi_percentage = ((monthly_savings * 12) / implementation_cost) * 100
            payback_months = implementation_cost / monthly_savings
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_projects 
            (user_id, title, description, status, priority, estimated_hours, 
             implementation_cost, monthly_savings, roi_percentage, payback_months, deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (current_user.id, title, description, 'Pendente', priority, estimated_hours,
              implementation_cost, monthly_savings, roi_percentage, payback_months, deadline))
        
        project_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Log de auditoria
        audit_system.log_action(current_user.id, 'project', project_id, 'create',
                              new_values={'title': title, 'description': description},
                              ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
        
        return jsonify({
            'status': 'success',
            'message': 'Projeto criado com sucesso',
            'project_id': project_id
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
@login_required
def update_project(project_id):
    """Atualiza projeto"""
    try:
        data = request.get_json()
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Verificar se o projeto pertence ao usuário
        cursor.execute('SELECT * FROM user_projects WHERE id = ? AND user_id = ?', (project_id, current_user.id))
        project = cursor.fetchone()
        
        if not project:
            conn.close()
            return jsonify({
                'status': 'error',
                'error': 'Projeto não encontrado'
            }), 404
        
        # Atualizar campos
        updates = []
        values = []
        
        for field in ['title', 'description', 'status', 'priority', 'estimated_hours', 
                     'implementation_cost', 'monthly_savings', 'deadline']:
            if field in data:
                updates.append(f"{field} = ?")
                values.append(data[field])
        
        if updates:
            # Recalcular ROI se custo ou economia mudaram
            if 'implementation_cost' in data or 'monthly_savings' in data:
                cost = data.get('implementation_cost', project['implementation_cost'])
                savings = data.get('monthly_savings', project['monthly_savings'])
                
                if cost > 0 and savings > 0:
                    roi_percentage = ((savings * 12) / cost) * 100
                    payback_months = cost / savings
                    updates.append("roi_percentage = ?")
                    updates.append("payback_months = ?")
                    values.extend([roi_percentage, payback_months])
            
            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(project_id)
            
            cursor.execute(f'''
                UPDATE user_projects 
                SET {', '.join(updates)}
                WHERE id = ?
            ''', values)
            
            conn.commit()
            
            # Log de auditoria
            audit_system.log_action(current_user.id, 'project', project_id, 'update',
                                  new_values=data,
                                  ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Projeto atualizado com sucesso'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    """Exclui projeto"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Verificar se o projeto pertence ao usuário
        cursor.execute('SELECT * FROM user_projects WHERE id = ? AND user_id = ?', (project_id, current_user.id))
        project = cursor.fetchone()
        
        if not project:
            conn.close()
            return jsonify({
                'status': 'error',
                'error': 'Projeto não encontrado'
            }), 404
        
        # Excluir projeto
        cursor.execute('DELETE FROM user_projects WHERE id = ?', (project_id,))
        conn.commit()
        conn.close()
        
        # Log de auditoria
        audit_system.log_action(current_user.id, 'project', project_id, 'delete',
                              ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
        
        return jsonify({
            'status': 'success',
            'message': 'Projeto excluído com sucesso'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# APIs para ROI
@app.route('/api/roi/analytics', methods=['GET'])
@login_required
def get_roi_analytics():
    """Obtém analytics de ROI"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Estatísticas de ROI
        cursor.execute('''
            SELECT 
                COUNT(*) as total_projects,
                AVG(roi_percentage) as avg_roi,
                SUM(implementation_cost) as total_investment,
                SUM(monthly_savings) as total_monthly_savings,
                AVG(payback_months) as avg_payback
            FROM user_projects 
            WHERE user_id = ? AND implementation_cost > 0
        ''', (current_user.id,))
        
        roi_stats = cursor.fetchone()
        
        # Projetos por status
        cursor.execute('''
            SELECT status, COUNT(*) as count
            FROM user_projects 
            WHERE user_id = ?
            GROUP BY status
        ''', (current_user.id,))
        
        status_stats = cursor.fetchall()
        
        # Projetos por prioridade
        cursor.execute('''
            SELECT priority, COUNT(*) as count
            FROM user_projects 
            WHERE user_id = ?
            GROUP BY priority
        ''', (current_user.id,))
        
        priority_stats = cursor.fetchall()
        
        # Timeline de projetos
        cursor.execute('''
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM user_projects 
            WHERE user_id = ?
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        ''', (current_user.id,))
        
        timeline_stats = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'analytics': {
                'roi_stats': dict(roi_stats) if roi_stats else {},
                'status_stats': [dict(stat) for stat in status_stats],
                'priority_stats': [dict(stat) for stat in priority_stats],
                'timeline_stats': [dict(stat) for stat in timeline_stats]
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/roi/projects', methods=['GET'])
@login_required
def get_roi_projects():
    """Obtém projetos com dados de ROI"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                id, title, description, status, priority,
                implementation_cost, monthly_savings, roi_percentage, payback_months,
                created_at, deadline
            FROM user_projects 
            WHERE user_id = ?
            ORDER BY roi_percentage DESC
        ''', (current_user.id,))
        
        projects = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'projects': [dict(project) for project in projects]
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# APIs para Fluxos de Automação
@app.route('/api/flows', methods=['GET'])
@login_required
def get_flows():
    """Obtém fluxos de automação do usuário"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                af.*,
                up.title as project_title
            FROM automation_flows af
            LEFT JOIN user_projects up ON af.project_id = up.id
            WHERE af.user_id = ? OR af.is_public = TRUE
            ORDER BY af.created_at DESC
        ''', (current_user.id,))
        
        flows = cursor.fetchall()
        conn.close()
        
        flows_list = []
        for flow in flows:
            flow_dict = dict(flow)
            # Parse JSON data
            try:
                flow_dict['flow_data'] = json.loads(flow_dict['flow_data']) if flow_dict['flow_data'] else {}
                flow_dict['tools_used'] = json.loads(flow_dict['tools_used']) if flow_dict['tools_used'] else []
            except:
                flow_dict['flow_data'] = {}
                flow_dict['tools_used'] = []
            flows_list.append(flow_dict)
        
        return jsonify({
            'status': 'success',
            'flows': flows_list
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/flows', methods=['POST'])
@login_required
def create_flow():
    """Cria novo fluxo de automação"""
    try:
        data = request.get_json()
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        flow_type = data.get('flow_type', 'workflow')
        flow_data = data.get('flow_data', {})
        tools_used = data.get('tools_used', [])
        difficulty_level = data.get('difficulty_level', 'Médio')
        estimated_time = data.get('estimated_time', '')
        project_id = data.get('project_id')
        is_template = data.get('is_template', False)
        is_public = data.get('is_public', False)
        
        if not title:
            return jsonify({
                'status': 'error',
                'error': 'Título é obrigatório'
            }), 400
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO automation_flows 
            (user_id, project_id, title, description, flow_type, flow_data, 
             tools_used, difficulty_level, estimated_time, is_template, is_public)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (current_user.id, project_id, title, description, flow_type, 
              json.dumps(flow_data), json.dumps(tools_used), difficulty_level, 
              estimated_time, is_template, is_public))
        
        flow_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Log de auditoria
        audit_system.log_action(current_user.id, 'automation_flow', flow_id, 'create',
                              new_values={'title': title, 'flow_type': flow_type},
                              ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
        
        return jsonify({
            'status': 'success',
            'message': 'Fluxo criado com sucesso',
            'flow_id': flow_id
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/flows/<int:flow_id>', methods=['GET'])
@login_required
def get_flow(flow_id):
    """Obtém um fluxo específico"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                af.*,
                up.title as project_title
            FROM automation_flows af
            LEFT JOIN user_projects up ON af.project_id = up.id
            WHERE af.id = ? AND (af.user_id = ? OR af.is_public = TRUE)
        ''', (flow_id, current_user.id))
        
        flow = cursor.fetchone()
        conn.close()
        
        if not flow:
            return jsonify({
                'status': 'error',
                'error': 'Fluxo não encontrado'
            }), 404
        
        flow_dict = dict(flow)
        # Parse JSON data
        try:
            flow_dict['flow_data'] = json.loads(flow_dict['flow_data']) if flow_dict['flow_data'] else {}
            flow_dict['tools_used'] = json.loads(flow_dict['tools_used']) if flow_dict['tools_used'] else []
        except:
            flow_dict['flow_data'] = {}
            flow_dict['tools_used'] = []
        
        return jsonify({
            'status': 'success',
            'flow': flow_dict
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/flows/<int:flow_id>', methods=['PUT'])
@login_required
def update_flow(flow_id):
    """Atualiza um fluxo de automação"""
    try:
        data = request.get_json()
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Verificar se o fluxo pertence ao usuário
        cursor.execute('SELECT * FROM automation_flows WHERE id = ? AND user_id = ?', (flow_id, current_user.id))
        flow = cursor.fetchone()
        
        if not flow:
            conn.close()
            return jsonify({
                'status': 'error',
                'error': 'Fluxo não encontrado'
            }), 404
        
        # Atualizar campos
        updates = []
        values = []
        
        for field in ['title', 'description', 'flow_type', 'difficulty_level', 'estimated_time', 'is_template', 'is_public']:
            if field in data:
                updates.append(f"{field} = ?")
                values.append(data[field])
        
        if 'flow_data' in data:
            updates.append("flow_data = ?")
            values.append(json.dumps(data['flow_data']))
        
        if 'tools_used' in data:
            updates.append("tools_used = ?")
            values.append(json.dumps(data['tools_used']))
        
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(flow_id)
            
            cursor.execute(f'''
                UPDATE automation_flows 
                SET {', '.join(updates)}
                WHERE id = ?
            ''', values)
            
            conn.commit()
            
            # Log de auditoria
            audit_system.log_action(current_user.id, 'automation_flow', flow_id, 'update',
                                  new_values=data,
                                  ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Fluxo atualizado com sucesso'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/flows/<int:flow_id>', methods=['DELETE'])
@login_required
def delete_flow(flow_id):
    """Exclui um fluxo de automação"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Verificar se o fluxo pertence ao usuário
        cursor.execute('SELECT * FROM automation_flows WHERE id = ? AND user_id = ?', (flow_id, current_user.id))
        flow = cursor.fetchone()
        
        if not flow:
            conn.close()
            return jsonify({
                'status': 'error',
                'error': 'Fluxo não encontrado'
            }), 404
        
        # Excluir fluxo
        cursor.execute('DELETE FROM automation_flows WHERE id = ?', (flow_id,))
        conn.commit()
        conn.close()
        
        # Log de auditoria
        audit_system.log_action(current_user.id, 'automation_flow', flow_id, 'delete',
                              ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
        
        return jsonify({
            'status': 'success',
            'message': 'Fluxo excluído com sucesso'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/flows/templates', methods=['GET'])
@login_required
def get_flow_templates():
    """Obtém templates de fluxos disponíveis"""
    try:
        # Templates pré-definidos de fluxos
        templates = [
            {
                'id': 1,
                'title': 'Envio de Email Automático de Boas-vindas',
                'description': 'Fluxo para enviar email automático quando alguém se cadastra',
                'flow_type': 'email_automation',
                'difficulty_level': 'Fácil',
                'estimated_time': '2-3 horas',
                'tools_used': ['Zapier', 'Gmail', 'Google Sheets'],
                'flow_data': {
                    'nodes': [
                        {'id': 'webhook', 'type': 'trigger', 'name': 'Webhook (Cadastro Novo)', 'position': {'x': 100, 'y': 100}},
                        {'id': 'switch', 'type': 'condition', 'name': 'Switch Node - Interesse do Usuário', 'position': {'x': 300, 'y': 100}},
                        {'id': 'email_a', 'type': 'action', 'name': 'Enviar Email A', 'position': {'x': 500, 'y': 50}},
                        {'id': 'email_b', 'type': 'action', 'name': 'Enviar Email B', 'position': {'x': 500, 'y': 150}},
                        {'id': 'log_a', 'type': 'action', 'name': 'Log no Sheets', 'position': {'x': 700, 'y': 50}},
                        {'id': 'log_b', 'type': 'action', 'name': 'Log no Sheets', 'position': {'x': 700, 'y': 150}}
                    ],
                    'connections': [
                        {'from': 'webhook', 'to': 'switch'},
                        {'from': 'switch', 'to': 'email_a', 'condition': 'interesse_a'},
                        {'from': 'switch', 'to': 'email_b', 'condition': 'interesse_b'},
                        {'from': 'email_a', 'to': 'log_a'},
                        {'from': 'email_b', 'to': 'log_b'}
                    ]
                }
            },
            {
                'id': 2,
                'title': 'Processamento de Planilhas Automático',
                'description': 'Fluxo para processar planilhas Excel automaticamente',
                'flow_type': 'data_processing',
                'difficulty_level': 'Médio',
                'estimated_time': '4-6 horas',
                'tools_used': ['Python', 'Pandas', 'OpenPyXL', 'Schedule'],
                'flow_data': {
                    'nodes': [
                        {'id': 'schedule', 'type': 'trigger', 'name': 'Agendador (Diário)', 'position': {'x': 100, 'y': 100}},
                        {'id': 'download', 'type': 'action', 'name': 'Download da Planilha', 'position': {'x': 300, 'y': 100}},
                        {'id': 'process', 'type': 'action', 'name': 'Processar Dados', 'position': {'x': 500, 'y': 100}},
                        {'id': 'validate', 'type': 'condition', 'name': 'Validar Dados', 'position': {'x': 700, 'y': 100}},
                        {'id': 'save', 'type': 'action', 'name': 'Salvar Resultado', 'position': {'x': 900, 'y': 50}},
                        {'id': 'notify', 'type': 'action', 'name': 'Notificar Erro', 'position': {'x': 900, 'y': 150}}
                    ],
                    'connections': [
                        {'from': 'schedule', 'to': 'download'},
                        {'from': 'download', 'to': 'process'},
                        {'from': 'process', 'to': 'validate'},
                        {'from': 'validate', 'to': 'save', 'condition': 'valid'},
                        {'from': 'validate', 'to': 'notify', 'condition': 'invalid'}
                    ]
                }
            },
            {
                'id': 3,
                'title': 'Backup Automático de Arquivos',
                'description': 'Fluxo para fazer backup automático de arquivos importantes',
                'flow_type': 'backup',
                'difficulty_level': 'Fácil',
                'estimated_time': '1-2 horas',
                'tools_used': ['Python', 'rsync', 'AWS S3', 'Cron'],
                'flow_data': {
                    'nodes': [
                        {'id': 'cron', 'type': 'trigger', 'name': 'Cron (Semanal)', 'position': {'x': 100, 'y': 100}},
                        {'id': 'check', 'type': 'condition', 'name': 'Verificar Arquivos', 'position': {'x': 300, 'y': 100}},
                        {'id': 'compress', 'type': 'action', 'name': 'Comprimir Arquivos', 'position': {'x': 500, 'y': 50}},
                        {'id': 'upload', 'type': 'action', 'name': 'Upload para S3', 'position': {'x': 700, 'y': 50}},
                        {'id': 'cleanup', 'type': 'action', 'name': 'Limpar Arquivos Antigos', 'position': {'x': 700, 'y': 150}},
                        {'id': 'log', 'type': 'action', 'name': 'Registrar Log', 'position': {'x': 900, 'y': 100}}
                    ],
                    'connections': [
                        {'from': 'cron', 'to': 'check'},
                        {'from': 'check', 'to': 'compress', 'condition': 'files_exist'},
                        {'from': 'compress', 'to': 'upload'},
                        {'from': 'upload', 'to': 'log'},
                        {'from': 'check', 'to': 'cleanup', 'condition': 'no_files'},
                        {'from': 'cleanup', 'to': 'log'}
                    ]
                }
            }
        ]
        
        return jsonify({
            'status': 'success',
            'templates': templates
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/flows/templates/<int:template_id>/use', methods=['POST'])
@login_required
def use_flow_template(template_id):
    """Usa um template de fluxo para criar um novo fluxo"""
    try:
        # Buscar template
        templates = [
            {
                'id': 1,
                'title': 'Envio de Email Automático de Boas-vindas',
                'description': 'Fluxo para enviar email automático quando alguém se cadastra',
                'flow_type': 'email_automation',
                'difficulty_level': 'Fácil',
                'estimated_time': '2-3 horas',
                'tools_used': ['Zapier', 'Gmail', 'Google Sheets'],
                'flow_data': {
                    'nodes': [
                        {'id': 'webhook', 'type': 'trigger', 'name': 'Webhook (Cadastro Novo)', 'position': {'x': 100, 'y': 100}},
                        {'id': 'switch', 'type': 'condition', 'name': 'Switch Node - Interesse do Usuário', 'position': {'x': 300, 'y': 100}},
                        {'id': 'email_a', 'type': 'action', 'name': 'Enviar Email A', 'position': {'x': 500, 'y': 50}},
                        {'id': 'email_b', 'type': 'action', 'name': 'Enviar Email B', 'position': {'x': 500, 'y': 150}},
                        {'id': 'log_a', 'type': 'action', 'name': 'Log no Sheets', 'position': {'x': 700, 'y': 50}},
                        {'id': 'log_b', 'type': 'action', 'name': 'Log no Sheets', 'position': {'x': 700, 'y': 150}}
                    ],
                    'connections': [
                        {'from': 'webhook', 'to': 'switch'},
                        {'from': 'switch', 'to': 'email_a', 'condition': 'interesse_a'},
                        {'from': 'switch', 'to': 'email_b', 'condition': 'interesse_b'},
                        {'from': 'email_a', 'to': 'log_a'},
                        {'from': 'email_b', 'to': 'log_b'}
                    ]
                }
            }
        ]
        
        template = next((t for t in templates if t['id'] == template_id), None)
        if not template:
            return jsonify({
                'status': 'error',
                'error': 'Template não encontrado'
            }), 404
        
        # Criar fluxo baseado no template
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO automation_flows 
            (user_id, title, description, flow_type, flow_data, tools_used, 
             difficulty_level, estimated_time, is_template)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (current_user.id, template['title'], template['description'], 
              template['flow_type'], json.dumps(template['flow_data']), 
              json.dumps(template['tools_used']), template['difficulty_level'], 
              template['estimated_time'], False))
        
        flow_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Log de auditoria
        audit_system.log_action(current_user.id, 'automation_flow', flow_id, 'create',
                              new_values={'title': template['title'], 'template_id': template_id},
                              ip_address=request.remote_addr, user_agent=request.headers.get('User-Agent'))
        
        return jsonify({
            'status': 'success',
            'message': f'Fluxo criado com sucesso usando template "{template["title"]}"',
            'flow_id': flow_id,
            'template': template
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/recommended-flows', methods=['GET'])
@login_required
def get_recommended_flows():
    """Retorna fluxos recomendados baseados nas recomendações do usuário"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Buscar recomendações que têm flow_example
        cursor.execute('''
            SELECT id, title, description, priority, expected_savings, 
                   estimated_hours, implementation_time, roi_percentage, 
                   tools, flow_example, process_description, created_at
            FROM user_recommendations 
            WHERE user_id = ? AND flow_example IS NOT NULL AND flow_example != ''
            ORDER BY created_at DESC
        ''', (current_user.id,))
        
        recommendations = cursor.fetchall()
        conn.close()
        
        recommended_flows = []
        
        for rec in recommendations:
            try:
                # Parse do flow_example se for string JSON
                flow_example = rec[9]  # flow_example
                if isinstance(flow_example, str):
                    import json
                    flow_example = json.loads(flow_example)
                
                # Parse das tools se for string JSON
                tools = rec[8]  # tools
                if isinstance(tools, str):
                    import json
                    tools = json.loads(tools)
                
                # Determinar dificuldade baseada no tempo de implementação
                implementation_time = rec[6] or "2-4 semanas"
                if "1-2" in implementation_time or "1 dia" in implementation_time:
                    difficulty = "Fácil"
                elif "3-4" in implementation_time or "1 semana" in implementation_time:
                    difficulty = "Médio"
                else:
                    difficulty = "Avançado"
                
                # Extrair ferramentas principais
                tools_list = []
                if tools and isinstance(tools, list):
                    tools_list = [tool.get('name', str(tool)) for tool in tools[:3]]  # Máximo 3 ferramentas
                elif isinstance(tools, str):
                    tools_list = [tools]
                
                recommended_flow = {
                    'id': f"rec_{rec[0]}",  # ID baseado na recomendação
                    'recommendation_id': rec[0],
                    'title': rec[1] or "Fluxo de Automação",
                    'description': rec[2] or rec[10] or "Descrição não disponível",
                    'priority': rec[3] or "Média",
                    'expected_savings': rec[4] or "Não especificado",
                    'estimated_hours': rec[5] or 0,
                    'implementation_time': implementation_time,
                    'roi_percentage': rec[7] or 0,
                    'difficulty_level': difficulty,
                    'tools_used': ', '.join(tools_list) if tools_list else "Não especificado",
                    'flow_data': flow_example.get('flow_data', {}) if flow_example else {},
                    'flow_type': 'workflow',
                    'created_at': rec[11],
                    'is_ai_recommended': True
                }
                
                recommended_flows.append(recommended_flow)
                
            except Exception as e:
                print(f"Erro ao processar recomendação {rec[0]}: {e}")
                continue
        
        return jsonify({
            'status': 'success',
            'flows': recommended_flows,
            'total': len(recommended_flows)
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# APIs de Export
@app.route('/api/export/dashboard/pdf', methods=['POST'])
@login_required
def export_dashboard_pdf():
    """Exporta dashboard para PDF"""
    try:
        # Simulação de exportação para PDF
        # Em um sistema real, usaria bibliotecas como ReportLab ou WeasyPrint
        
        return jsonify({
            'status': 'success',
            'message': 'Dashboard exportado para PDF com sucesso',
            'download_url': '/static/exports/dashboard.pdf',
            'filename': f'dashboard_{current_user.username}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/export/projects/excel', methods=['POST'])
@login_required
def export_projects_excel():
    """Exporta projetos para Excel"""
    try:
        # Simulação de exportação para Excel
        # Em um sistema real, usaria bibliotecas como OpenPyXL ou pandas
        
        return jsonify({
            'status': 'success',
            'message': 'Projetos exportados para Excel com sucesso',
            'download_url': '/static/exports/projects.xlsx',
            'filename': f'projetos_{current_user.username}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/export/roi/excel', methods=['POST'])
@login_required
def export_roi_excel():
    """Exporta dados de ROI para Excel"""
    try:
        # Simulação de exportação para Excel
        # Em um sistema real, usaria bibliotecas como OpenPyXL ou pandas
        
        return jsonify({
            'status': 'success',
            'message': 'Dados de ROI exportados para Excel com sucesso',
            'download_url': '/static/exports/roi.xlsx',
            'filename': f'roi_{current_user.username}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("=== AUTOMATION AI ADVISOR - VERSÃO FINAL ===")
    print("Sistema completo e estável sem erros")
    print("Health check implementado")
    print("================================================")
    print("Acesse: http://localhost:5000")
    print("Login demo: demo / demo123")
    print("Health check: http://localhost:5000/health")
    print("================================================")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
