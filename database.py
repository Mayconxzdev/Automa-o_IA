"""
Módulo de banco de dados otimizado para Automation AI Advisor
Removido código morto e funcionalidades não utilizadas
"""

import sqlite3
import json
from datetime import datetime

class Database:
    """Classe otimizada para gerenciar o banco de dados SQLite"""
    
    def __init__(self, db_path='automation_advisor.db'):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Retorna conexão com o banco de dados"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Inicializa o banco de dados com as tabelas essenciais"""
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
        
        # Tabela de recomendações por usuário
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                process_description TEXT NOT NULL,
                recommendations TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Tabela de projetos por usuário
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
        
        # Tabela de métricas IoT por usuário
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_iot_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                metric_unit TEXT,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Criar índices essenciais
        self.create_essential_indexes(cursor)
        
        conn.commit()
        conn.close()
    
    def create_essential_indexes(self, cursor):
        """Cria apenas os índices essenciais para performance"""
        indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(status)',
            'CREATE INDEX IF NOT EXISTS idx_user_iot_metrics_user_id ON user_iot_metrics(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_iot_metrics_recorded_at ON user_iot_metrics(recorded_at)'
        ]
        
        for index in indexes:
            cursor.execute(index)
    
    # Métodos essenciais para usuários autenticados
    
    def save_user_recommendation(self, user_id, process_description, recommendations):
        """Salva uma recomendação para um usuário específico"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_recommendations (user_id, process_description, recommendations)
            VALUES (?, ?, ?)
        ''', (user_id, process_description, json.dumps(recommendations)))
        
        conn.commit()
        conn.close()
        return cursor.lastrowid
    
    def get_user_recommendations(self, user_id, limit=50):
        """Recupera recomendações de um usuário específico"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM user_recommendations 
            WHERE user_id = ?
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (user_id, limit))
        
        recommendations = []
        for row in cursor.fetchall():
            recommendations.append({
                'id': row['id'],
                'process_description': row['process_description'],
                'recommendations': json.loads(row['recommendations']),
                'created_at': row['created_at']
            })
        
        conn.close()
        return recommendations
    
    def save_user_project(self, user_id, title, description, status='Pendente', priority='Média', 
                         estimated_hours=None, expected_savings=None, implementation_cost=None,
                         monthly_savings=None, roi_percentage=None, payback_months=None, 
                         recommended_tools=None, deadline=None):
        """Salva um projeto para um usuário específico"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        tools_json = json.dumps(recommended_tools) if recommended_tools else None
        
        cursor.execute('''
            INSERT INTO user_projects (user_id, title, description, status, priority, 
                                     estimated_hours, expected_savings, implementation_cost,
                                     monthly_savings, roi_percentage, payback_months, recommended_tools, deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, title, description, status, priority, estimated_hours, 
              expected_savings, implementation_cost, monthly_savings, roi_percentage, 
              payback_months, tools_json, deadline))
        
        conn.commit()
        conn.close()
        return cursor.lastrowid
    
    def get_user_projects(self, user_id):
        """Recupera todos os projetos de um usuário"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM user_projects 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ''', (user_id,))
        
        projects = []
        for row in cursor.fetchall():
            recommended_tools = None
            if row['recommended_tools']:
                try:
                    recommended_tools = json.loads(row['recommended_tools'])
                except:
                    recommended_tools = None
            
            projects.append({
                'id': row['id'],
                'title': row['title'],
                'description': row['description'],
                'status': row['status'],
                'priority': row['priority'],
                'estimated_hours': row['estimated_hours'],
                'expected_savings': row['expected_savings'],
                'implementation_cost': row['implementation_cost'],
                'monthly_savings': row['monthly_savings'],
                'roi_percentage': row['roi_percentage'],
                'payback_months': row['payback_months'],
                'recommended_tools': recommended_tools,
                'deadline': row['deadline'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at']
            })
        
        conn.close()
        return projects
    
    def update_user_project(self, project_id, user_id, **kwargs):
        """Atualiza um projeto de um usuário"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        fields = []
        values = []
        
        for key, value in kwargs.items():
            if key in ['title', 'description', 'status', 'priority', 'estimated_hours', 
                      'expected_savings', 'implementation_cost', 'monthly_savings', 
                      'roi_percentage', 'payback_months', 'recommended_tools', 'deadline']:
                if key == 'recommended_tools':
                    value = json.dumps(value) if value else None
                fields.append(f"{key} = ?")
                values.append(value)
        
        if not fields:
            conn.close()
            return False
        
        fields.append("updated_at = CURRENT_TIMESTAMP")
        values.extend([project_id, user_id])
        
        query = f'''
            UPDATE user_projects 
            SET {', '.join(fields)}
            WHERE id = ? AND user_id = ?
        '''
        
        cursor.execute(query, values)
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return success
    
    def delete_user_project(self, project_id, user_id):
        """Deleta um projeto de um usuário"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM user_projects 
            WHERE id = ? AND user_id = ?
        ''', (project_id, user_id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return success
    
    def save_user_iot_metric(self, user_id, metric_name, metric_value, metric_unit=None):
        """Salva uma métrica IoT para um usuário"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_iot_metrics (user_id, metric_name, metric_value, metric_unit)
            VALUES (?, ?, ?, ?)
        ''', (user_id, metric_name, metric_value, metric_unit))
        
        conn.commit()
        conn.close()
        return cursor.lastrowid
    
    def get_user_iot_metrics(self, user_id, metric_name=None, limit=100):
        """Recupera métricas IoT de um usuário"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if metric_name:
            cursor.execute('''
                SELECT * FROM user_iot_metrics 
                WHERE user_id = ? AND metric_name = ?
                ORDER BY recorded_at DESC 
                LIMIT ?
            ''', (user_id, metric_name, limit))
        else:
            cursor.execute('''
                SELECT * FROM user_iot_metrics 
                WHERE user_id = ?
                ORDER BY recorded_at DESC 
                LIMIT ?
            ''', (user_id, limit))
        
        metrics = []
        for row in cursor.fetchall():
            metrics.append({
                'id': row['id'],
                'metric_name': row['metric_name'],
                'metric_value': row['metric_value'],
                'metric_unit': row['metric_unit'],
                'recorded_at': row['recorded_at']
            })
        
        conn.close()
        return metrics
    
    def get_user_analytics(self, user_id):
        """Recupera dados analíticos de um usuário"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Total de recomendações
        cursor.execute('SELECT COUNT(*) FROM user_recommendations WHERE user_id = ?', (user_id,))
        total_recommendations = cursor.fetchone()[0]
        
        # Total de projetos
        cursor.execute('SELECT COUNT(*) FROM user_projects WHERE user_id = ?', (user_id,))
        total_projects = cursor.fetchone()[0]
        
        # Projetos por status
        cursor.execute('''
            SELECT status, COUNT(*) FROM user_projects 
            WHERE user_id = ? GROUP BY status
        ''', (user_id,))
        projects_by_status = dict(cursor.fetchall())
        
        # ROI médio
        cursor.execute('''
            SELECT AVG(roi_percentage) FROM user_projects 
            WHERE user_id = ? AND roi_percentage IS NOT NULL
        ''', (user_id,))
        avg_roi = cursor.fetchone()[0] or 0
        
        # Economia total mensal
        cursor.execute('''
            SELECT SUM(monthly_savings) FROM user_projects 
            WHERE user_id = ? AND monthly_savings IS NOT NULL
        ''', (user_id,))
        total_monthly_savings = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return {
            'total_recommendations': total_recommendations,
            'total_projects': total_projects,
            'projects_by_status': projects_by_status,
            'avg_roi': round(avg_roi, 2),
            'total_monthly_savings': total_monthly_savings
        }

# Instância global do banco de dados
db = Database()
