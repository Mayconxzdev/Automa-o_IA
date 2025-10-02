/**
 * Automation AI Advisor - JavaScript Consolidado
 * Sistema unificado e otimizado
 */

// ============================================================================
// SISTEMA DE NOTIFICAÇÕES
// ============================================================================

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    show(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = this.getIcon(type);
        const title = this.getTitle(type);

        toast.innerHTML = `
            <div class="toast-header">
                <h6 class="toast-title">
                    <i class="${icon}"></i> ${title}
                </h6>
                <button class="toast-close" onclick="notificationSystem.hide(this.parentElement.parentElement)">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            <div class="toast-body">${message}</div>
        `;

        return toast;
    }

    getIcon(type) {
        const icons = {
            'success': 'bi bi-check-circle-fill text-success',
            'error': 'bi bi-exclamation-triangle-fill text-danger',
            'warning': 'bi bi-exclamation-circle-fill text-warning',
            'info': 'bi bi-info-circle-fill text-info'
        };
        return icons[type] || icons['info'];
    }

    getTitle(type) {
        const titles = {
            'success': 'Sucesso',
            'error': 'Erro',
            'warning': 'Atenção',
            'info': 'Informação'
        };
        return titles[type] || titles['info'];
    }

    hide(toast) {
        if (toast && toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }
    }

    success(message, duration = 5000) { return this.show(message, 'success', duration); }
    error(message, duration = 7000) { return this.show(message, 'error', duration); }
    warning(message, duration = 6000) { return this.show(message, 'warning', duration); }
    info(message, duration = 5000) { return this.show(message, 'info', duration); }

    clear() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.hide(toast));
    }
}

// ============================================================================
// SISTEMA DE LOADING
// ============================================================================

class LoadingSystem {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        if (!document.querySelector('.loading-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2">Processando...</p>
                </div>
            `;
            document.body.appendChild(this.overlay);
        } else {
            this.overlay = document.querySelector('.loading-overlay');
        }
    }

    show(message = 'Processando...') {
        const messageElement = this.overlay.querySelector('p');
        if (messageElement) messageElement.textContent = message;
        this.overlay.classList.add('show');
    }

    hide() {
        this.overlay.classList.remove('show');
    }

    setMessage(message) {
        const messageElement = this.overlay.querySelector('p');
        if (messageElement) messageElement.textContent = message;
    }
}

// ============================================================================
// DASHBOARD PRINCIPAL
// ============================================================================

class UserDashboard {
    constructor() {
        this.currentModule = 'welcome';
        this.charts = {};
        this.projects = [];
        this.analytics = {};
        this.isGeneratingRecommendations = false;
        this.currentFilter = 'all';
        this.init();
    }

    destroyAllCharts() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
                this.charts[key] = null;
            }
        });
        this.charts = {};
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.showModule('welcome');
    }

    setupEventListeners() {
        // Form submission for process description
        const processForm = document.getElementById('processForm');
        if (processForm) {
            processForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateRecommendations();
            });
        }

        // Navigation clicks
        document.querySelectorAll('a[onclick^="showModule"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const onclick = e.target.getAttribute('onclick');
                if (onclick && onclick.match(/'([^']+)'/)) {
                    const module = onclick.match(/'([^']+)'/)[1];
                    this.showModule(module);
                }
            });
        });

        // Search functionality
        const searchInput = document.getElementById('projectSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProjects();
            });
        }

        // Filter badges
        document.querySelectorAll('.filter-badge').forEach(badge => {
            badge.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
                this.filterProjects();
            });
        });
    }

    async loadUserData() {
        try {
            // Load analytics
            const analyticsResponse = await fetch('/api/user/analytics');
            const analyticsData = await analyticsResponse.json();
            
            if (analyticsData.status === 'success') {
                this.analytics = analyticsData.analytics;
            }
        } catch (error) {
            notificationSystem.error('Erro ao conectar com o servidor');
        }
    }

    showModule(moduleName) {
        console.log('Mostrando módulo:', moduleName);
        
        // Hide all modules
        document.querySelectorAll('.module-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected module
        const module = document.getElementById(moduleName);
        console.log('Procurando módulo:', moduleName, 'Elemento encontrado:', module);
        if (module) {
            module.style.display = 'block';
            this.currentModule = moduleName;
            console.log('Módulo exibido:', moduleName, 'Display:', module.style.display);
        } else {
            console.error('Módulo não encontrado:', moduleName);
        }

        // Load module-specific data
        switch (moduleName) {
            case 'projects':
                this.loadUserProjects();
                break;
            case 'dashboard':
                this.loadUserDashboardCharts();
                break;
            case 'roi':
                this.loadUserROIAnalysis();
                break;
            case 'intelligence':
                this.loadRecentRecommendations();
                break;
        }
        
        this.updateNavigationState(moduleName);
    }
    
    updateNavigationState(activeModule) {
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[onclick*="'${activeModule}'"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async loadRecentRecommendations() {
        try {
            const response = await fetch('/api/user/recommendations?limit=5');
            const data = await response.json();
            
            if (data.status === 'success' && data.recommendations.length > 0) {
                this.displayRecentRecommendations(data.recommendations);
            }
        } catch (error) {
            console.error('Error loading recent recommendations:', error);
        }
    }

    async loadFlows() {
        console.log('Carregando fluxos...');
        try {
            const response = await fetch('/api/flows');
            const data = await response.json();
            
            console.log('Resposta da API de fluxos:', data);
            
            if (data.status === 'success') {
                this.currentFlows = data.flows;
                console.log('Fluxos carregados:', data.flows);
                this.renderFlows(data.flows);
            } else {
                console.error('Erro ao carregar fluxos:', data.error);
            }
        } catch (error) {
            console.error('Erro ao carregar fluxos:', error);
        }
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/flows/templates');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.renderTemplates(data.templates);
            }
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        }
    }

    renderFlows(flows) {
        console.log('Renderizando fluxos:', flows);
        const container = document.getElementById('flowsContainer');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const emptyState = document.getElementById('emptyState');
        
        console.log('Container encontrado:', container);
        console.log('Loading spinner encontrado:', loadingSpinner);
        console.log('Empty state encontrado:', emptyState);
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (flows.length === 0) {
            console.log('Nenhum fluxo encontrado, mostrando empty state');
            if (emptyState) emptyState.style.display = 'block';
            if (container) container.innerHTML = '';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        if (container) {
            console.log('Renderizando', flows.length, 'fluxos');
            container.innerHTML = flows.map(flow => `
                <div class="col-md-4 mb-4">
                    <div class="card flow-card h-100" onclick="viewFlow(${flow.id})">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title">${flow.title}</h6>
                                <span class="badge bg-${this.getDifficultyColor(flow.difficulty_level)}">${flow.difficulty_level}</span>
                            </div>
                            <p class="card-text text-muted small">${flow.description || 'Sem descrição'}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="bi bi-clock"></i> ${flow.estimated_time || 'N/A'}
                                </small>
                                <small class="text-muted">
                                    <i class="bi bi-tools"></i> ${flow.tools_used ? flow.tools_used.length : 0} ferramentas
                                </small>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent">
                            <div class="d-flex justify-content-between">
                                <span class="badge bg-secondary">${flow.flow_type}</span>
                                <div>
                                    <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); viewFlow(${flow.id})">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteFlow(${flow.id})">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            console.error('Container de fluxos não encontrado!');
        }
    }

    renderTemplates(templates) {
        const container = document.getElementById('templatesContainer');
        
        if (container) {
            container.innerHTML = templates.map(template => `
                <div class="col-md-4 mb-4">
                    <div class="card template-card h-100" onclick="useTemplate(${template.id})">
                        <div class="card-body">
                            <h6 class="card-title">${template.title}</h6>
                            <p class="card-text text-muted small">${template.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge bg-${this.getDifficultyColor(template.difficulty_level)}">${template.difficulty_level}</span>
                                <small class="text-muted">${template.estimated_time}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    getDifficultyColor(difficulty) {
        switch(difficulty) {
            case 'Fácil': return 'success';
            case 'Médio': return 'warning';
            case 'Avançado': return 'danger';
            default: return 'secondary';
        }
    }
    
    displayRecentRecommendations(recommendations) {
        const container = document.querySelector('#intelligence .col-md-6:last-child .card-body');
        if (!container) return;
        
        // Limpar seção anterior se existir
        const existingSection = container.querySelector('#recentRecommendationsSection');
        if (existingSection) {
            existingSection.remove();
        }
        
        const recentSection = document.createElement('div');
        recentSection.className = 'mt-4';
        recentSection.id = 'recentRecommendationsSection';
        recentSection.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-primary mb-0">
                    <i class="bi bi-clock-history"></i> Recomendações Recentes
                </h6>
                <button class="btn btn-sm btn-outline-danger" onclick="clearAllRecommendations()" title="Limpar todo o histórico">
                    <i class="bi bi-trash"></i> Limpar Tudo
                </button>
            </div>
            <div id="recentRecommendations">
                ${recommendations.map(rec => {
                    // Tratamento robusto da data
                    let dateText = 'Data não disponível';
                    if (rec.created_at) {
                        try {
                            const date = new Date(rec.created_at);
                            if (!isNaN(date.getTime())) {
                                dateText = date.toLocaleDateString('pt-BR');
                            }
                        } catch (e) {
                            console.warn('Erro ao formatar data:', rec.created_at);
                        }
                    }
                    
                    // Tratamento do título e descrição
                    let title = 'Recomendação de Automação';
                    let description = 'Sem descrição disponível';
                    
                    if (typeof rec === 'string') {
                        try {
                            const parsed = JSON.parse(rec);
                            title = parsed.title || title;
                            description = parsed.description || parsed.process_description || description;
                        } catch (e) {
                            // Se não conseguir fazer parse, usar o string como descrição
                            description = rec.substring(0, 100) + '...';
                        }
                    } else if (rec && typeof rec === 'object') {
                        title = rec.title || title;
                        description = rec.description || rec.process_description || description;
                    }
                    
                    return `
                    <div class="recent-recommendation mb-2 p-2 border rounded position-relative">
                        <button class="btn btn-sm btn-outline-danger position-absolute" style="top: 5px; right: 5px; padding: 2px 6px;" onclick="deleteRecommendation(${rec.id || 0})" title="Excluir recomendação">
                            <i class="bi bi-x"></i>
                        </button>
                        <div class="d-flex justify-content-between align-items-start mb-1" style="padding-right: 30px;">
                            <h6 class="mb-1 text-primary small">${title}</h6>
                            <small class="text-muted">${dateText}</small>
                        </div>
                        <p class="mb-2 small text-muted">${description.substring(0, 100)}...</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewRecommendationDetails(${rec.id || 0})">
                                <i class="bi bi-eye"></i> Ver Detalhes
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="regenerateRecommendation('${rec.id || 0}')">
                                <i class="bi bi-arrow-clockwise"></i> Regenerar
                            </button>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
        
        container.appendChild(recentSection);
    }

    regenerateRecommendationById(recommendationId) {
        const recommendation = this.getRecommendationById(recommendationId);
        if (!recommendation) {
            notificationSystem.error('Recomendação não encontrada');
            return;
        }

        const processDescription = recommendation.process_description || recommendation.description;
        if (!processDescription) {
            notificationSystem.error('Descrição do processo não encontrada');
            return;
        }

        const descriptionField = document.getElementById('processDescription');
        if (descriptionField) {
            descriptionField.value = processDescription;
            this.generateRecommendations();
            notificationSystem.info('Regenerando recomendação...');
        } else {
            notificationSystem.error('Campo de descrição não encontrado');
        }
    }

    getRecommendationById(id) {
        const recentRecs = document.querySelectorAll('#recentRecommendations .recent-recommendation');
        for (let rec of recentRecs) {
            const button = rec.querySelector('button[onclick*="regenerateRecommendation"]');
            if (button && button.getAttribute('onclick').includes(`'${id}'`)) {
                const dateElement = rec.querySelector('small.text-muted');
                const descElement = rec.querySelector('p.small');
                
                return {
                    id: id,
                    created_at: dateElement ? dateElement.textContent : null,
                    process_description: descElement ? descElement.textContent.replace('...', '') : null
                };
            }
        }
        return null;
    }

    async generateRecommendations() {
        if (this.isGeneratingRecommendations) return;

        const description = document.getElementById('processDescription')?.value?.trim();
        if (!description) {
            notificationSystem.error('Por favor, descreva o processo que deseja automatizar');
            return;
        }

        this.isGeneratingRecommendations = true;
        const container = document.getElementById('recommendationsContainer');
        
        if (container) {
            container.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p class="mt-2">Gerando recomendações...</p></div>';
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const response = await fetch('/api/generate-recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: description }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const result = await response.json();

            if (result.status === 'success') {
                this.displayRecommendations(result.recommendations);
                notificationSystem.success('Recomendações geradas com sucesso!');
                this.loadUserData();
            } else {
                notificationSystem.error(result.error || 'Erro ao gerar recomendações.');
                if (container) container.innerHTML = '<p class="text-muted">Erro ao gerar recomendações. Tente novamente.</p>';
            }
        } catch (error) {
            console.error('Error generating recommendations:', error);

            let errorMessage = 'Erro ao gerar recomendações.';
            let displayMessage = 'Erro ao gerar recomendações. Tente novamente.';

            if (error.name === 'AbortError') {
                errorMessage = 'Timeout: A IA demorou muito para responder.';
                displayMessage = 'A IA demorou mais de 120 segundos para responder. Tente novamente.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Erro de conexão com o servidor.';
                displayMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
            }

            notificationSystem.error(errorMessage);
            if (container) container.innerHTML = `<p class="text-muted">${displayMessage}</p>`;
        } finally {
            this.isGeneratingRecommendations = false;
        }
    }

    displayRecommendations(recommendations) {
        const container = document.getElementById('recommendationsContainer');
        if (!container) return;

        // Armazenar recomendações atuais globalmente
        currentRecommendations = recommendations;
        
        // Debug: verificar se as recomendações foram armazenadas
        console.log('Recomendações armazenadas:', currentRecommendations);

        if (recommendations.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma recomendação encontrada.</p>';
            return;
        }

        container.innerHTML = recommendations.map(rec => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title">${rec.title}</h5>
                        <span class="badge ${this.getPriorityClass(rec.priority)}">${rec.priority}</span>
                    </div>
                    <p class="card-text">${rec.description}</p>
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <small class="text-muted">Economia Estimada:</small>
                            <div class="fw-bold text-success">${rec.expected_savings}</div>
                        </div>
                        <div class="col-md-4">
                            <small class="text-muted">Tempo de Implementação:</small>
                            <div class="fw-bold">${rec.implementation_time || 'N/A'}</div>
                        </div>
                        <div class="col-md-4">
                            <small class="text-muted">ROI:</small>
                            <div class="fw-bold text-primary">${rec.roi_percentage || 0}%</div>
                        </div>
                    </div>
                    ${this.generateToolsHtml(rec.tools || [])}
                    ${rec.flow_example ? this.generateFlowExampleHtml(rec.flow_example) : ''}
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary btn-sm" onclick="convertToProject(${rec.id})">
                            <i class="bi bi-plus"></i> Converter em Projeto
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="viewRecommendationDetails(${rec.id})">
                            <i class="bi bi-eye"></i> Ver Detalhes
                        </button>
                        ${rec.flow_example ? `<button class="btn btn-outline-info btn-sm" onclick="viewFlowExample(${rec.id})">
                            <i class="bi bi-diagram-3"></i> Ver Fluxo
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    generateToolsHtml(tools) {
        if (!tools || tools.length === 0) {
            return '<p class="text-muted small">Nenhuma ferramenta específica recomendada.</p>';
        }

        let toolsHtml = '<div class="row">';

        tools.forEach(tool => {
            if (typeof tool === 'string') {
                toolsHtml += `
                    <div class="col-md-6 mb-2">
                        <div class="tool-card p-2 border rounded">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h6 class="mb-0">${tool}</h6>
                                <span class="badge bg-primary">Recomendado</span>
                            </div>
                            <p class="small text-muted mb-1">Ferramenta recomendada para automação</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-primary">Ferramenta</small>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                const costClass = this.getCostClass(tool.cost);
                const difficultyClass = this.getDifficultyClass(tool.difficulty);

                toolsHtml += `
                    <div class="col-md-6 mb-3">
                        <div class="tool-card p-3 border rounded h-100">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="mb-0">${tool.name || tool}</h6>
                                <div class="d-flex gap-1">
                                    <span class="badge ${costClass}">${tool.cost || 'N/A'}</span>
                                    <span class="badge ${difficultyClass}">${tool.difficulty || 'N/A'}</span>
                                </div>
                            </div>
                            <p class="small text-muted mb-2">${tool.description || 'Ferramenta recomendada para automação'}</p>
                            
                            ${tool.pricing ? `<div class="mb-2">
                                <small class="text-success fw-bold">
                                    <i class="bi bi-currency-dollar"></i> ${tool.pricing}
                                </small>
                            </div>` : ''}
                            
                            ${tool.setup_time ? `<div class="mb-2">
                                <small class="text-info">
                                    <i class="bi bi-clock"></i> Setup: ${tool.setup_time}
                                </small>
                            </div>` : ''}
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-primary">${tool.category || 'Ferramenta'}</small>
                                ${tool.website ? `<a href="${tool.website}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="bi bi-box-arrow-up-right"></i> Visitar
                                </a>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        toolsHtml += '</div>';
        return toolsHtml;
    }

    generateFlowExampleHtml(flowExample) {
        if (!flowExample || !flowExample.flow_data) {
            return '';
        }

        return `
            <div class="mt-3 p-3 bg-light rounded">
                <h6 class="text-info mb-2">
                    <i class="bi bi-diagram-3"></i> Exemplo de Fluxo: ${flowExample.title}
                </h6>
                <p class="small text-muted mb-2">${flowExample.description}</p>
                <div class="flow-preview" style="background: white; border-radius: 8px; padding: 15px; min-height: 120px; position: relative; overflow: hidden;">
                    ${this.renderFlowPreview(flowExample.flow_data)}
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        <i class="bi bi-info-circle"></i> Passe o mouse sobre os nós para ver detalhes
                    </small>
                </div>
            </div>
        `;
    }

    renderFlowPreview(flowData) {
        if (!flowData.nodes || flowData.nodes.length === 0) {
            return '<p class="text-muted text-center">Nenhuma visualização disponível</p>';
        }

        let html = '';
        
        // Calcular dimensões do container baseado nos nós
        const maxX = Math.max(...flowData.nodes.map(n => n.position.x));
        const maxY = Math.max(...flowData.nodes.map(n => n.position.y));
        const containerWidth = Math.max(300, maxX * 0.3 + 100);
        const containerHeight = Math.max(200, maxY * 0.3 + 50);
        
        // Renderizar nós
        flowData.nodes.forEach(node => {
            const nodeClass = this.getNodeClass(node.type);
            const nodeColor = this.getNodeColor(node.type);
            const x = Math.max(10, node.position.x * 0.3);
            const y = Math.max(10, node.position.y * 0.3);
            
            html += `
                <div class="flow-node-preview ${nodeClass}" style="
                    position: absolute;
                    left: ${x}px;
                    top: ${y}px;
                    border: 2px solid ${nodeColor};
                    border-radius: 6px;
                    padding: 6px 10px;
                    font-size: 10px;
                    font-weight: bold;
                    text-align: center;
                    min-width: 80px;
                    max-width: 100px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.2s;
                    z-index: 10;
                " 
                title="${node.description || node.name}"
                onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'; this.style.zIndex='20'"
                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 1px 4px rgba(0,0,0,0.1)'; this.style.zIndex='10'">
                    ${node.name}
                </div>
            `;
        });

        // Renderizar conexões
        if (flowData.connections) {
            flowData.connections.forEach(conn => {
                const fromNode = flowData.nodes.find(n => n.id === conn.from);
                const toNode = flowData.nodes.find(n => n.id === conn.to);
                
                if (fromNode && toNode) {
                    const x1 = fromNode.position.x * 0.3 + 40;
                    const y1 = fromNode.position.y * 0.3 + 15;
                    const x2 = toNode.position.x * 0.3 + 40;
                    const y2 = toNode.position.y * 0.3 + 15;
                    
                    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                    
                    html += `
                        <div style="
                            position: absolute;
                            left: ${x1}px;
                            top: ${y1}px;
                            width: ${length}px;
                            height: 2px;
                            background: #007bff;
                            transform: rotate(${angle}deg);
                            transform-origin: 0 50%;
                            z-index: 1;
                        "></div>
                    `;
                }
            });
        }

        return html;
    }

    getNodeClass(type) {
        switch(type) {
            case 'trigger': return 'trigger';
            case 'condition': return 'condition';
            case 'action': return 'action';
            default: return 'action';
        }
    }

    getNodeColor(type) {
        switch(type) {
            case 'trigger': return '#28a745';
            case 'condition': return '#ffc107';
            case 'action': return '#007bff';
            default: return '#007bff';
        }
    }

    getPriorityClass(priority) {
        switch (priority?.toLowerCase()) {
            case 'alta': return 'bg-danger';
            case 'média': return 'bg-warning text-dark';
            case 'baixa': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    getCostClass(cost) {
        if (!cost || typeof cost !== 'string') return 'bg-secondary';
        switch (cost.toLowerCase()) {
            case 'gratuito': return 'bg-success';
            case 'pago': return 'bg-warning text-dark';
            case 'enterprise': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    getDifficultyClass(difficulty) {
        if (!difficulty || typeof difficulty !== 'string') return 'bg-secondary';
        switch (difficulty.toLowerCase()) {
            case 'fácil': return 'bg-success';
            case 'médio': return 'bg-warning text-dark';
            case 'avançado': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    async loadUserProjects() {
        try {
            const response = await fetch('/api/user/projects');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.projects = data.projects;
                this.displayUserProjects();
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            notificationSystem.error('Erro ao carregar projetos');
        }
    }

    displayUserProjects() {
        const container = document.getElementById('projectsContainer');
        if (!container) return;

        if (this.projects.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum projeto encontrado.</p>';
            return;
        }

        // Setup Kanban columns
        const columns = {
            'Pendente': document.getElementById('pendingColumn'),
            'Em Andamento': document.getElementById('inProgressColumn'),
            'Concluído': document.getElementById('completedColumn')
        };

        // Setup drop zones
        Object.entries(columns).forEach(([status, column]) => {
            this.setupDropZone(column, status);
        });

        this.filterProjects();
    }

    setupDropZone(column, targetStatus) {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            const projectId = e.dataTransfer.getData('text/plain');
            const currentStatus = e.dataTransfer.getData('text/status');

            if (currentStatus !== targetStatus) {
                await this.updateProjectStatus(projectId, targetStatus);
            }
        });
    }

    async updateProjectStatus(projectId, newStatus) {
        try {
            const response = await fetch(`/api/user/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                notificationSystem.success('Status do projeto atualizado!');
                this.loadUserProjects();
            } else {
                notificationSystem.error('Erro ao atualizar status do projeto');
            }
        } catch (error) {
            console.error('Error updating project status:', error);
            notificationSystem.error('Erro ao atualizar status do projeto');
        }
    }

    setActiveFilter(filter) {
        document.querySelectorAll('.filter-badge').forEach(badge => {
            badge.classList.remove('active');
        });
        
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.currentFilter = filter;
    }

    filterProjects() {
        const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
        const filter = this.currentFilter || 'all';
        
        const columns = {
            'Pendente': document.getElementById('pendingColumn'),
            'Em Andamento': document.getElementById('inProgressColumn'),
            'Concluído': document.getElementById('completedColumn')
        };

        // Clear columns
        Object.values(columns).forEach(column => {
            column.innerHTML = '';
        });

        // Filter projects
        const filteredProjects = this.projects.filter(project => {
            const matchesSearch = searchTerm === '' || 
                project.title.toLowerCase().includes(searchTerm) ||
                project.description.toLowerCase().includes(searchTerm);
            
            let matchesFilter = true;
            if (filter !== 'all') {
                if (['Pendente', 'Em Andamento', 'Concluído'].includes(filter)) {
                    matchesFilter = project.status === filter;
                } else if (['Alta', 'Média', 'Baixa'].includes(filter)) {
                    matchesFilter = project.priority === filter;
                }
            }
            
            return matchesSearch && matchesFilter;
        });

        // Populate columns with filtered projects
        filteredProjects.forEach(project => {
            const card = this.createKanbanProjectCard(project);
            
            if (columns[project.status]) {
                columns[project.status].appendChild(card);
            }
        });

        this.updateProjectCounters(filteredProjects);
    }

    updateProjectCounters(projects) {
        const counters = {
            'Pendente': projects.filter(p => p.status === 'Pendente').length,
            'Em Andamento': projects.filter(p => p.status === 'Em Andamento').length,
            'Concluído': projects.filter(p => p.status === 'Concluído').length
        };

        const pendingCount = document.getElementById('pendingCount');
        const inProgressCount = document.getElementById('inProgressCount');
        const completedCount = document.getElementById('completedCount');

        if (pendingCount) pendingCount.textContent = counters['Pendente'];
        if (inProgressCount) inProgressCount.textContent = counters['Em Andamento'];
        if (completedCount) completedCount.textContent = counters['Concluído'];
    }

    createKanbanProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.draggable = true;
        card.dataset.projectId = project.id;
        card.dataset.status = project.status;

        const priorityClass = this.getPriorityClass(project.priority);
        
        let toolsHtml = '';
        if (project.recommended_tools && project.recommended_tools.length > 0) {
            toolsHtml = `
                <div class="mt-2">
                    <small class="text-primary">
                        <i class="bi bi-tools"></i> ${project.recommended_tools.length} ferramenta(s)
                    </small>
                    <div class="mt-1">
                        ${project.recommended_tools.slice(0, 2).map(tool => 
                            `<span class="badge bg-light text-dark me-1" style="font-size: 0.6rem;">${tool.name || tool}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title mb-0">${project.title}</h6>
                    <span class="badge ${priorityClass}">${project.priority}</span>
                </div>
                <p class="card-text small text-muted">${project.description.substring(0, 100)}...</p>
                ${toolsHtml}
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <small class="text-muted">ROI: ${project.roi_percentage || 0}%</small>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editProject(${project.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteProject(${project.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Drag and drop
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', project.id);
            e.dataTransfer.setData('text/status', project.status);
        });
        
        return card;
    }

    async loadUserDashboardCharts() {
        this.destroyAllCharts();
        
        try {
            const response = await fetch('/api/user/iot-metrics?limit=30');
            const data = await response.json();
            
            if (data.status === 'success') {
                await this.createUserCharts(data.metrics);
            }
        } catch (error) {
            console.error('Error loading IoT metrics:', error);
            await this.createDemoCharts();
        }
        
        this.loadProjectImpactData();
    }

    async createUserCharts(metrics) {
        const groupedMetrics = {};
        metrics.forEach(metric => {
            if (!groupedMetrics[metric.metric_name]) {
                groupedMetrics[metric.metric_name] = [];
            }
            groupedMetrics[metric.metric_name].push(metric);
        });

        // Aguardar Chart.js estar disponível
        await this.waitForChart();
        
        this.createEnergyChart(groupedMetrics['energy_consumption'] || []);
        this.createOccupancyChart(groupedMetrics['room_occupancy'] || []);
    }

    async createDemoCharts() {
        const demoData = this.generateDemoData();
        
        // Aguardar Chart.js estar disponível
        await this.waitForChart();
        
        this.createEnergyChart(demoData.energy);
        this.createOccupancyChart(demoData.occupancy);
    }

    generateDemoData() {
        const energy = [];
        const occupancy = [];
        
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            
            energy.push({
                metric_value: Math.random() * 400 + 800,
                recorded_at: date.toISOString()
            });
            
            occupancy.push({
                metric_value: Math.random() * 100,
                recorded_at: date.toISOString()
            });
        }
        
        return { energy, occupancy };
    }

    createEnergyChart(energyData) {
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            return;
        }

        if (this.charts.energy) {
            this.charts.energy.destroy();
        }
        
        const ctx = document.getElementById('energyChart');
        if (!ctx) return;
        
        const dates = energyData.map(d => new Date(d.recorded_at).toLocaleDateString());
        const values = energyData.map(d => d.metric_value);

        this.charts.energy = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Consumo de Energia (kWh)',
                    data: values,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Consumo de Energia - Últimos 30 dias'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'kWh'
                        }
                    }
                }
            }
        });
    }

    createOccupancyChart(occupancyData) {
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            return;
        }

        if (this.charts.occupancy) {
            this.charts.occupancy.destroy();
        }
        
        const ctx = document.getElementById('occupancyChart');
        if (!ctx) return;
        
        const dates = occupancyData.map(d => new Date(d.recorded_at).toLocaleDateString());
        const values = occupancyData.map(d => d.metric_value);

        this.charts.occupancy = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Ocupação (%)',
                    data: values,
                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                    borderColor: '#0d6efd',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Ocupação de Salas - Últimos 30 dias'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Ocupação (%)'
                        }
                    }
                }
            }
        });
    }

    loadProjectImpactData() {
        // Implementar carregamento de dados de impacto dos projetos
        console.log('Loading project impact data...');
    }

    async loadUserROIAnalysis() {
        try {
            this.destroyAllCharts();
            
            const response = await fetch('/api/user/projects');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.projects = data.projects;
                
                // Aguardar Chart.js estar disponível
                await this.waitForChart();
                
                this.createROIChart();
                this.createInteractiveProjectChart();
                this.createTimelineChart();
                
                this.loadFinancialSummary();
                this.loadROITable();
            }
        } catch (error) {
            console.error('Error loading ROI data:', error);
            notificationSystem.error('Erro ao carregar dados de ROI');
        }
    }

    // Função para aguardar Chart.js estar disponível
    waitForChart() {
        return new Promise((resolve) => {
            if (typeof Chart !== 'undefined') {
                console.log('Chart.js já está disponível para gráficos');
                resolve();
                return;
            }
            
            console.log('Aguardando Chart.js estar disponível para gráficos...');
            let attempts = 0;
            const maxAttempts = 30; // 3 segundos com intervalos de 100ms
            
            const checkChart = setInterval(() => {
                attempts++;
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkChart);
                    console.log('Chart.js disponível para gráficos após', attempts * 100, 'ms');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkChart);
                    console.error('Timeout: Chart.js não disponível para gráficos ROI');
                    resolve(); // Resolve mesmo assim para não travar
                }
            }, 100);
        });
    }

    createROIChart() {
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            notificationSystem.error('Biblioteca de gráficos não carregada');
            return;
        }

        if (this.charts.roi) {
            this.charts.roi.destroy();
        }
        
        const ctx = document.getElementById('roiChart');
        if (!ctx) return;
        
        const projectsWithROI = this.projects.filter(p => p.roi_percentage !== null);
        const labels = projectsWithROI.map(p => p.title);
        const roiData = projectsWithROI.map(p => p.roi_percentage);

        this.charts.roi = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ROI (%)',
                    data: roiData,
                    backgroundColor: [
                        'rgba(220, 53, 69, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(13, 110, 253, 0.8)',
                        'rgba(111, 66, 193, 0.8)'
                    ],
                    borderColor: [
                        'rgba(220, 53, 69, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(40, 167, 69, 1)',
                        'rgba(13, 110, 253, 1)',
                        'rgba(111, 66, 193, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'ROI por Projeto'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'ROI (%)'
                        }
                    }
                }
            }
        });
    }

    createInteractiveProjectChart() {
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            return;
        }

        if (this.charts.projectStatus) {
            this.charts.projectStatus.destroy();
        }
        
        const ctx = document.getElementById('projectChart');
        if (!ctx) return;
        
        const statusData = {
            'Pendente': this.projects.filter(p => p.status === 'Pendente').length,
            'Em Andamento': this.projects.filter(p => p.status === 'Em Andamento').length,
            'Concluído': this.projects.filter(p => p.status === 'Concluído').length
        };

        this.charts.projectStatus = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusData),
                datasets: [{
                    data: Object.values(statusData),
                    backgroundColor: [
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(13, 110, 253, 0.8)',
                        'rgba(40, 167, 69, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 193, 7, 1)',
                        'rgba(13, 110, 253, 1)',
                        'rgba(40, 167, 69, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Projetos por Status'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createTimelineChart() {
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            return;
        }

        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }
        
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;
        
        const monthlyData = {};
        this.projects.forEach(project => {
            const date = new Date(project.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey]++;
        });

        const labels = Object.keys(monthlyData).sort();
        const data = labels.map(label => monthlyData[label]);

        this.charts.timeline = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Projetos Criados',
                    data: data,
                    borderColor: 'rgba(13, 110, 253, 1)',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Timeline de Projetos'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Projetos'
                        }
                    }
                }
            }
        });
    }

    loadFinancialSummary() {
        // Implementar carregamento de resumo financeiro
        console.log('Loading financial summary...');
    }

    loadROITable() {
        // Implementar carregamento de tabela de ROI
        console.log('Loading ROI table...');
    }
}

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let currentRecommendations = [];

// ============================================================================
// FUNÇÕES GLOBAIS
// ============================================================================

// Função para visualizar exemplo de fluxo - VERSÃO COMPLETAMENTE NOVA
function viewFlowExample(recommendationId) {
    console.log('=== INICIANDO VISUALIZAÇÃO DE FLUXO ===');
    console.log('ID da recomendação:', recommendationId);
    console.log('Tipo do ID:', typeof recommendationId);
    
    // Encontrar a recomendação atual
    const recommendation = currentRecommendations?.find(rec => {
        console.log('Comparando:', rec.id, 'com', recommendationId, 'Resultado:', rec.id == recommendationId);
        return rec.id == recommendationId;
    });
    
    if (!recommendation) {
        console.error('❌ Recomendação não encontrada para ID:', recommendationId);
        console.log('Recomendações disponíveis:', currentRecommendations);
        notificationSystem.error('Recomendação não encontrada');
        return;
    }
    
    console.log('✅ Recomendação encontrada:', recommendation);
    
    // Verificar se tem flow_example
    if (!recommendation.flow_example) {
        console.error('❌ Sem flow_example na recomendação');
        notificationSystem.error('Exemplo de fluxo não encontrado para esta recomendação');
        return;
    }
    
    const flowExample = recommendation.flow_example;
    console.log('✅ Flow example encontrado:', flowExample);
    
    // Extrair dados com fallbacks seguros
    const title = flowExample.title || 'Fluxo de Automação';
    const description = flowExample.description || 'Descrição do fluxo não disponível';
    const flowData = flowExample.flow_data || null;
    
    console.log('📋 Dados extraídos:');
    console.log('  Título:', title);
    console.log('  Descrição:', description);
    console.log('  Flow Data:', flowData ? 'Presente' : 'Ausente');
    
    if (flowData) {
        console.log('  Nodes:', flowData.nodes ? flowData.nodes.length : 0);
        console.log('  Connections:', flowData.connections ? flowData.connections.length : 0);
    }

    // Criar modal HTML com dados seguros
    const modalHtml = `
        <div class="modal fade" id="flowExampleModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-diagram-3 text-primary"></i> ${title}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-3">${description}</p>
                        <div class="flow-modal-container" style="background: #f8f9fa; border-radius: 10px; padding: 20px; min-height: 400px; max-height: 600px; overflow: auto; position: relative;">
                            ${createFlowVisualization(flowData)}
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-primary" onclick="createFlowFromExample('${recommendationId}')">
                                <i class="bi bi-plus"></i> Criar Fluxo Baseado neste Exemplo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente se houver
    const existingModal = document.getElementById('flowExampleModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Adicionar modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('flowExampleModal'));
    modal.show();
    
    console.log('✅ Modal criado e exibido com sucesso!');

    // Remover modal do DOM quando fechado
    document.getElementById('flowExampleModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Funções auxiliares para fluxos
function getNodeClass(type) {
    switch(type) {
        case 'trigger': return 'trigger';
        case 'condition': return 'condition';
        case 'action': return 'action';
        default: return 'action';
    }
}

function getNodeColor(type) {
    switch(type) {
        case 'trigger': return '#28a745';
        case 'condition': return '#ffc107';
        case 'action': return '#007bff';
        default: return '#007bff';
    }
}

// Função para renderizar visualização do fluxo
function renderFlowVisualization(flowData) {
    console.log('Renderizando visualização do fluxo:', flowData);
    
    if (!flowData || !flowData.nodes) {
        console.log('Dados do fluxo inválidos:', flowData);
        return '<p class="text-muted text-center">Nenhuma visualização disponível</p>';
    }

    let html = '';
    
    // Calcular dimensões do container baseado nos nós
    const maxX = Math.max(...flowData.nodes.map(n => n.position.x));
    const maxY = Math.max(...flowData.nodes.map(n => n.position.y));
    const containerWidth = Math.max(600, maxX + 200);
    const containerHeight = Math.max(400, maxY + 100);
    
    // Renderizar nós
    flowData.nodes.forEach(node => {
        const nodeColor = getNodeColor(node.type);
        const nodeClass = getNodeClass(node.type);
        const x = Math.max(20, node.position.x);
        const y = Math.max(20, node.position.y);
        
        html += `
            <div class="flow-node ${nodeClass}" style="
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                border: 2px solid ${nodeColor};
                border-radius: 8px;
                padding: 10px 15px;
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                min-width: 120px;
                max-width: 150px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.2s;
                z-index: 10;
            " 
            title="${node.description || node.name}"
            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.2)'; this.style.zIndex='20'"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; this.style.zIndex='10'">
                ${node.name}
            </div>
        `;
    });

    // Renderizar conexões
    if (flowData.connections) {
        flowData.connections.forEach(conn => {
            const fromNode = flowData.nodes.find(n => n.id === conn.from);
            const toNode = flowData.nodes.find(n => n.id === conn.to);
            
            if (fromNode && toNode) {
                const x1 = fromNode.position.x + 60;
                const y1 = fromNode.position.y + 20;
                const x2 = toNode.position.x + 60;
                const y2 = toNode.position.y + 20;
                
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                
                html += `
                    <div style="
                        position: absolute;
                        left: ${x1}px;
                        top: ${y1}px;
                        width: ${length}px;
                        height: 2px;
                        background: #007bff;
                        transform: rotate(${angle}deg);
                        transform-origin: 0 50%;
                        z-index: 1;
                    "></div>
                `;
            }
        });
    }

    return html;
}

// Função para obter cor do nó
function getNodeColor(type) {
    switch(type) {
        case 'trigger': return '#28a745';
        case 'condition': return '#ffc107';
        case 'action': return '#007bff';
        default: return '#007bff';
    }
}

// Função para criar visualização do fluxo - VERSÃO COMPLETAMENTE NOVA
function createFlowVisualization(flowData) {
    console.log('🎨 Criando visualização do fluxo:', flowData);
    
    // Verificação robusta dos dados
    if (!flowData) {
        console.log('❌ FlowData é null/undefined');
        return '<div class="text-center p-4"><p class="text-muted">Nenhuma visualização disponível</p></div>';
    }
    
    if (!flowData.nodes || !Array.isArray(flowData.nodes) || flowData.nodes.length === 0) {
        console.log('❌ Nodes inválidos:', flowData.nodes);
        return '<div class="text-center p-4"><p class="text-muted">Nenhum nó encontrado no fluxo</p></div>';
    }
    
    console.log('✅ Dados válidos - Nodes:', flowData.nodes.length);
    console.log('✅ Connections:', flowData.connections ? flowData.connections.length : 0);

    let html = '';
    
    // Calcular dimensões do container
    const positions = flowData.nodes.map(n => n.position || {x: 0, y: 0});
    const maxX = Math.max(...positions.map(p => p.x || 0));
    const maxY = Math.max(...positions.map(p => p.y || 0));
    const containerWidth = Math.max(800, maxX + 300);
    const containerHeight = Math.max(500, maxY + 200);
    
    console.log('📐 Dimensões do container:', containerWidth, 'x', containerHeight);
    
    // Container principal
    html += `<div style="position: relative; width: ${containerWidth}px; height: ${containerHeight}px; margin: 0 auto;">`;
    
    // Renderizar conexões primeiro (para ficarem atrás dos nós)
    if (flowData.connections && Array.isArray(flowData.connections)) {
        flowData.connections.forEach((conn, index) => {
            const fromNode = flowData.nodes.find(n => n.id === conn.from);
            const toNode = flowData.nodes.find(n => n.id === conn.to);
            
            if (fromNode && toNode && fromNode.position && toNode.position) {
                const x1 = (fromNode.position.x || 0) + 75;
                const y1 = (fromNode.position.y || 0) + 20;
                const x2 = (toNode.position.x || 0) + 75;
                const y2 = (toNode.position.y || 0) + 20;
                
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                
                html += `
                    <div class="flow-connection" style="
                        position: absolute;
                        left: ${x1}px;
                        top: ${y1}px;
                        width: ${length}px;
                        height: 3px;
                        background: linear-gradient(90deg, #007bff, #0056b3);
                        transform: rotate(${angle}deg);
                        transform-origin: 0 50%;
                        z-index: 1;
                        border-radius: 2px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    " title="Conexão: ${fromNode.name} → ${toNode.name}"></div>
                `;
            }
        });
    }
    
    // Renderizar nós
    flowData.nodes.forEach((node, index) => {
        const position = node.position || {x: 100 + (index * 200), y: 100};
        const x = Math.max(20, position.x);
        const y = Math.max(20, position.y);
        
        const nodeType = node.type || 'action';
        const nodeName = node.name || `Nó ${index + 1}`;
        const nodeDescription = node.description || nodeName;
        
        // Cores baseadas no tipo
        let backgroundColor, borderColor, textColor;
        switch(nodeType) {
            case 'trigger':
                backgroundColor = 'linear-gradient(135deg, #28a745, #20c997)';
                borderColor = '#28a745';
                textColor = 'white';
                break;
            case 'condition':
                backgroundColor = 'linear-gradient(135deg, #ffc107, #fd7e14)';
                borderColor = '#ffc107';
                textColor = '#212529';
                break;
            case 'action':
            default:
                backgroundColor = 'linear-gradient(135deg, #007bff, #6f42c1)';
                borderColor = '#007bff';
                textColor = 'white';
                break;
        }
        
        html += `
            <div class="flow-node" style="
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                background: ${backgroundColor};
                border: 2px solid ${borderColor};
                border-radius: 12px;
                padding: 12px 16px;
                font-size: 13px;
                font-weight: 600;
                text-align: center;
                color: ${textColor};
                min-width: 120px;
                max-width: 180px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 10;
                word-wrap: break-word;
            " 
            title="${nodeDescription}"
            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.25)'; this.style.zIndex='20'"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'; this.style.zIndex='10'">
                <div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${nodeType}
                </div>
                <div style="font-weight: 700;">
                    ${nodeName}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    console.log('✅ Visualização criada com sucesso');
    return html;
}

// Função para criar fluxo baseado no exemplo
async function createFlowFromExample(recommendationId) {
    const recommendation = currentRecommendations?.find(rec => rec.id == recommendationId);
    if (!recommendation) {
        notificationSystem.error('Recomendação não encontrada');
        return;
    }
    
    if (!recommendation.flow_example) {
        notificationSystem.error('Exemplo de fluxo não encontrado para esta recomendação');
        return;
    }

    try {
        const response = await fetch('/api/flows', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: recommendation.flow_example.title,
                description: recommendation.flow_example.description,
                flow_type: 'workflow',
                difficulty_level: 'Médio',
                estimated_time: '2-4 horas',
                tools_used: recommendation.tools ? recommendation.tools.map(t => typeof t === 'string' ? t : t.name) : [],
                flow_data: recommendation.flow_example.flow_data
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            notificationSystem.success('Fluxo criado com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('flowExampleModal')).hide();
            // Redirecionar para página de fluxos
            window.location.href = '/flows';
        } else {
            notificationSystem.error('Erro ao criar fluxo: ' + data.error);
        }
    } catch (error) {
        notificationSystem.error('Erro ao criar fluxo: ' + error.message);
    }
}

// Função para converter recomendação em projeto
async function convertToProject(recommendationId) {
    console.log('Tentando converter projeto para ID:', recommendationId);
    console.log('Recomendações disponíveis:', currentRecommendations);
    
    const recommendation = currentRecommendations?.find(rec => rec.id == recommendationId);
    if (!recommendation) {
        console.error('Recomendação não encontrada para ID:', recommendationId);
        notificationSystem.error('Recomendação não encontrada');
        return;
    }

    // Criar modal para configurar o projeto
    const modalHtml = `
        <div class="modal fade" id="convertProjectModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-plus-circle text-primary"></i> Converter em Projeto
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="convertProjectForm">
                            <div class="mb-3">
                                <label class="form-label">Título do Projeto</label>
                                <input type="text" class="form-control" id="projectTitle" value="${recommendation.title}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Descrição</label>
                                <textarea class="form-control" id="projectDescription" rows="3" required>${recommendation.description}</textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Prioridade</label>
                                    <select class="form-select" id="projectPriority">
                                        <option value="Baixa">Baixa</option>
                                        <option value="Média" selected>Média</option>
                                        <option value="Alta">Alta</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Prazo (Opcional)</label>
                                    <input type="date" class="form-control" id="projectDeadline">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Custo de Implementação (R$)</label>
                                    <input type="number" class="form-control" id="implementationCost" step="0.01" placeholder="0.00">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Economia Mensal (R$)</label>
                                    <input type="number" class="form-control" id="monthlySavings" step="0.01" placeholder="0.00">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ferramentas Recomendadas</label>
                                <div class="border rounded p-2" style="max-height: 150px; overflow-y: auto;">
                                    ${recommendation.tools ? recommendation.tools.map(tool => 
                                        `<div class="form-check">
                                            <input class="form-check-input" type="checkbox" value="${typeof tool === 'string' ? tool : tool.name}" id="tool_${typeof tool === 'string' ? tool : tool.name}" checked>
                                            <label class="form-check-label" for="tool_${typeof tool === 'string' ? tool : tool.name}">
                                                ${typeof tool === 'string' ? tool : tool.name}
                                            </label>
                                        </div>`
                                    ).join('') : '<p class="text-muted">Nenhuma ferramenta específica</p>'}
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveConvertedProject('${recommendationId}')">
                            <i class="bi bi-save"></i> Criar Projeto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente se houver
    const existingModal = document.getElementById('convertProjectModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Adicionar modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('convertProjectModal'));
    modal.show();

    // Remover modal do DOM quando fechado
    document.getElementById('convertProjectModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Função para salvar projeto convertido
async function saveConvertedProject(recommendationId) {
    const recommendation = currentRecommendations?.find(rec => rec.id == recommendationId);
    if (!recommendation) {
        notificationSystem.error('Recomendação não encontrada');
        return;
    }

    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDescription').value;
    const priority = document.getElementById('projectPriority').value;
    const deadline = document.getElementById('projectDeadline').value;
    const implementationCost = parseFloat(document.getElementById('implementationCost').value) || 0;
    const monthlySavings = parseFloat(document.getElementById('monthlySavings').value) || 0;

    if (!title || !description) {
        notificationSystem.error('Título e descrição são obrigatórios');
        return;
    }

    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                priority,
                deadline,
                implementation_cost: implementationCost,
                monthly_savings: monthlySavings,
                estimated_hours: recommendation.estimated_hours || 20
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            notificationSystem.success('Projeto criado com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('convertProjectModal')).hide();
            // Recarregar dados do usuário
            if (window.userDashboard) {
                window.userDashboard.loadUserData();
            }
        } else {
            notificationSystem.error('Erro ao criar projeto: ' + data.error);
        }
    } catch (error) {
        notificationSystem.error('Erro ao criar projeto: ' + error.message);
    }
}

// Função para ver detalhes da recomendação
function viewRecommendationDetails(recommendationId) {
    console.log('Tentando ver detalhes para ID:', recommendationId);
    console.log('Recomendações disponíveis:', currentRecommendations);
    
    const recommendation = currentRecommendations?.find(rec => rec.id == recommendationId);
    if (!recommendation) {
        console.error('Recomendação não encontrada para ID:', recommendationId);
        notificationSystem.error('Recomendação não encontrada');
        return;
    }

    // Criar modal para mostrar detalhes completos
    const modalHtml = `
        <div class="modal fade" id="recommendationDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-info-circle text-primary"></i> Detalhes da Recomendação
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h4>${recommendation.title}</h4>
                                <p class="text-muted">${recommendation.description}</p>
                                
                                <div class="row mb-4">
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <h6 class="card-title text-success">Economia Estimada</h6>
                                                <p class="card-text fw-bold">${recommendation.expected_savings}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <h6 class="card-title text-info">Tempo de Implementação</h6>
                                                <p class="card-text fw-bold">${recommendation.implementation_time || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <h6 class="card-title text-warning">ROI</h6>
                                                <p class="card-text fw-bold">${recommendation.roi_percentage || 0}%</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <h6 class="card-title text-primary">Prioridade</h6>
                                                <p class="card-text fw-bold">${recommendation.priority}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h5>Ferramentas Recomendadas</h5>
                                <div class="row">
                                    ${recommendation.tools ? recommendation.tools.map(tool => {
                                        const toolData = typeof tool === 'string' ? {name: tool, description: 'Ferramenta recomendada'} : tool;
                                        return `
                                            <div class="col-md-6 mb-3">
                                                <div class="card">
                                                    <div class="card-body">
                                                        <h6 class="card-title">${toolData.name}</h6>
                                                        <p class="card-text small">${toolData.description}</p>
                                                        <div class="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <span class="badge bg-${toolData.cost === 'Gratuito' ? 'success' : 'warning'}">${toolData.cost || 'N/A'}</span>
                                                                <span class="badge bg-${toolData.difficulty === 'Fácil' ? 'success' : toolData.difficulty === 'Médio' ? 'warning' : 'danger'}">${toolData.difficulty || 'N/A'}</span>
                                                            </div>
                                                            ${toolData.website ? `<a href="${toolData.website}" target="_blank" class="btn btn-sm btn-outline-primary">Visitar</a>` : ''}
                                                        </div>
                                                        ${toolData.pricing ? `<small class="text-success d-block mt-1"><i class="bi bi-currency-dollar"></i> ${toolData.pricing}</small>` : ''}
                                                        ${toolData.setup_time ? `<small class="text-info d-block"><i class="bi bi-clock"></i> Setup: ${toolData.setup_time}</small>` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('') : '<p class="text-muted">Nenhuma ferramenta específica recomendada</p>'}
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Ações Rápidas</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-primary" onclick="convertToProject('${recommendationId}')">
                                                <i class="bi bi-plus-circle"></i> Converter em Projeto
                                            </button>
                                            ${recommendation.flow_example ? `<button class="btn btn-outline-info" onclick="viewFlowExample('${recommendationId}')">
                                                <i class="bi bi-diagram-3"></i> Ver Fluxo
                                            </button>` : ''}
                                            <button class="btn btn-outline-secondary" onclick="shareRecommendation('${recommendationId}')">
                                                <i class="bi bi-share"></i> Compartilhar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="card mt-3">
                                    <div class="card-header">
                                        <h6 class="mb-0">Informações Técnicas</h6>
                                    </div>
                                    <div class="card-body">
                                        <p><strong>Horas Estimadas:</strong> ${recommendation.estimated_hours || 'N/A'}</p>
                                        <p><strong>Tipo de Automação:</strong> ${recommendation.tools ? recommendation.tools[0]?.category || 'Geral' : 'Geral'}</p>
                                        <p><strong>Complexidade:</strong> ${recommendation.tools ? recommendation.tools.map(t => typeof t === 'string' ? 'Médio' : t.difficulty).join(', ') : 'Médio'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente se houver
    const existingModal = document.getElementById('recommendationDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Adicionar modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('recommendationDetailsModal'));
    modal.show();

    // Remover modal do DOM quando fechado
    document.getElementById('recommendationDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Função para compartilhar recomendação
function shareRecommendation(recommendationId) {
    const recommendation = currentRecommendations?.find(rec => rec.id == recommendationId);
    if (!recommendation) {
        notificationSystem.error('Recomendação não encontrada');
        return;
    }

    const shareText = `Recomendação de Automação: ${recommendation.title}\n\n${recommendation.description}\n\nEconomia estimada: ${recommendation.expected_savings}\nROI: ${recommendation.roi_percentage || 0}%`;
    
    if (navigator.share) {
        navigator.share({
            title: recommendation.title,
            text: shareText,
            url: window.location.href
        });
    } else {
        // Fallback para copiar para clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            notificationSystem.success('Recomendação copiada para a área de transferência!');
        }).catch(() => {
            notificationSystem.error('Erro ao copiar recomendação');
        });
    }
}

function showModule(moduleName) {
    if (window.userDashboard) {
        window.userDashboard.showModule(moduleName);
    }
}

function regenerateRecommendation(recommendationId) {
    if (window.userDashboard) {
        window.userDashboard.regenerateRecommendationById(recommendationId);
    }
}

async function deleteRecommendation(recommendationId) {
    if (!confirm('Tem certeza que deseja excluir esta recomendação?')) {
        return;
    }

    try {
        const response = await fetch(`/api/recommendations/${recommendationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            notificationSystem.success('Recomendação excluída com sucesso!');
            // Recarregar recomendações recentes
            if (window.userDashboard) {
                window.userDashboard.loadRecentRecommendations();
            }
        } else {
            const error = await response.json();
            notificationSystem.error(error.error || 'Erro ao excluir recomendação');
        }
    } catch (error) {
        console.error('Erro ao excluir recomendação:', error);
        notificationSystem.error('Erro de conexão ao excluir recomendação');
    }
}

async function clearAllRecommendations() {
    if (!confirm('Tem certeza que deseja excluir TODAS as recomendações do histórico?\n\nEsta ação não pode ser desfeita!')) {
        return;
    }

    try {
        const response = await fetch('/api/recommendations/clear-all', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            notificationSystem.success('Todo o histórico foi limpo com sucesso!');
            // Recarregar recomendações recentes
            if (window.userDashboard) {
                window.userDashboard.loadRecentRecommendations();
            }
        } else {
            const error = await response.json();
            notificationSystem.error(error.error || 'Erro ao limpar histórico');
        }
    } catch (error) {
        console.error('Erro ao limpar histórico:', error);
        notificationSystem.error('Erro de conexão ao limpar histórico');
    }
}

function convertToProject(recommendationId) {
    // Implementar conversão de recomendação para projeto
    notificationSystem.info('Funcionalidade em desenvolvimento');
}

// ============================================================================
// SISTEMA DE FLUXOS - VERSÃO LIMPA E FUNCIONAL
// ============================================================================

// Variáveis globais para fluxos
let currentFlows = [];
let currentFlow = null;

// ============================================================================
// FUNÇÕES PRINCIPAIS DE FLUXOS
// ============================================================================

// Carregar fluxos do usuário
async function loadFlows() {
    console.log('🔄 Carregando fluxos...');
    
    try {
        const response = await fetch('/api/flows');
        const data = await response.json();
        
        if (data.status === 'success') {
            currentFlows = data.flows || [];
            console.log('✅ Fluxos carregados:', currentFlows.length);
            renderFlows(currentFlows);
        } else {
            console.error('❌ Erro ao carregar fluxos:', data.error);
            showFlowsEmptyState();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar fluxos:', error);
        showFlowsEmptyState();
    }
}

// Renderizar fluxos em cards
function renderFlows(flows) {
    console.log('🎨 Renderizando fluxos:', flows.length);
    
    const container = document.getElementById('flowsContainer');
    const loadingSpinner = document.getElementById('flowsLoadingSpinner');
    const emptyState = document.getElementById('flowsEmptyState');
    
    // Esconder loading
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    
    if (!flows || flows.length === 0) {
        showFlowsEmptyState();
        return;
    }
    
    // Esconder empty state
    if (emptyState) emptyState.style.display = 'none';
    
    // Renderizar cards
    if (container) {
        container.innerHTML = flows.map(flow => createFlowCard(flow)).join('');
        console.log('✅ Cards renderizados');
    }
}

// Criar card de fluxo
function createFlowCard(flow) {
    const difficultyColor = getDifficultyColor(flow.difficulty_level);
    const typeIcon = getFlowTypeIcon(flow.flow_type);
    const typeName = getFlowTypeName(flow.flow_type);
    
    return `
        <div class="col-md-4 mb-4">
            <div class="card flow-card h-100" onclick="viewFlow(${flow.id})">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">${flow.title}</h6>
                        <span class="badge ${difficultyColor}">${flow.difficulty_level}</span>
                    </div>
                    <p class="card-text text-muted small">${flow.description || 'Sem descrição'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="bi bi-clock"></i> ${flow.estimated_time || 'N/A'}
                        </small>
                        <small class="text-muted">
                            <i class="${typeIcon}"></i> ${typeName}
                        </small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); viewFlow(${flow.id})">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteFlow(${flow.id})">
                            <i class="bi bi-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Mostrar estado vazio
function showFlowsEmptyState() {
    const container = document.getElementById('flowsContainer');
    const loadingSpinner = document.getElementById('flowsLoadingSpinner');
    const emptyState = document.getElementById('flowsEmptyState');
    
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    if (container) container.innerHTML = '';
}

// ============================================================================
// FUNÇÕES DE MODAL
// ============================================================================

// Mostrar modal de criar fluxo
function showCreateFlowModal() {
    const modal = new bootstrap.Modal(document.getElementById('createFlowModal'));
    modal.show();
}

// Mostrar modal de templates
function showTemplatesModal() {
    loadTemplates();
    const modal = new bootstrap.Modal(document.getElementById('templatesModal'));
    modal.show();
}

// Criar novo fluxo
async function createNewFlow() {
    const title = document.getElementById('flowTitle').value;
    const description = document.getElementById('flowDescription').value;
    const flowType = document.getElementById('flowType').value;
    const difficulty = document.getElementById('difficultyLevel').value;
    const estimatedTime = document.getElementById('estimatedTime').value;
    const tools = document.getElementById('toolsUsed').value;
    
    if (!title) {
        notificationSystem.error('Título é obrigatório');
        return;
    }
    
    try {
        const response = await fetch('/api/flows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                flow_type: flowType,
                difficulty_level: difficulty,
                estimated_time: estimatedTime,
                tools_used: tools,
                flow_data: { nodes: [], connections: [] }
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            notificationSystem.success('Fluxo criado com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('createFlowModal')).hide();
            document.getElementById('createFlowForm').reset();
            loadFlows();
        } else {
            notificationSystem.error(data.error || 'Erro ao criar fluxo');
        }
    } catch (error) {
        console.error('Erro ao criar fluxo:', error);
        notificationSystem.error('Erro de conexão');
    }
}

// Visualizar fluxo
async function viewFlow(flowId) {
    try {
        const response = await fetch(`/api/flows/${flowId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            currentFlow = data.flow;
            showFlowModal(data.flow);
        } else {
            notificationSystem.error('Erro ao carregar fluxo');
        }
    } catch (error) {
        console.error('Erro ao visualizar fluxo:', error);
        notificationSystem.error('Erro de conexão');
    }
}

// Mostrar modal de fluxo
function showFlowModal(flow) {
    document.getElementById('viewFlowTitle').textContent = flow.title;
    
    // Renderizar visualização
    const visualization = document.getElementById('flowVisualization');
    if (flow.flow_data && flow.flow_data.nodes && flow.flow_data.nodes.length > 0) {
        visualization.innerHTML = createFlowVisualization(flow.flow_data);
    } else {
        visualization.innerHTML = '<p class="text-muted text-center">Nenhuma visualização disponível</p>';
    }
    
    // Mostrar ferramentas
    const toolsDiv = document.getElementById('flowTools');
    if (flow.tools_used) {
        toolsDiv.innerHTML = flow.tools_used.split(',').map(tool => 
            `<span class="badge bg-secondary me-1">${tool.trim()}</span>`
        ).join('');
    } else {
        toolsDiv.innerHTML = '<span class="text-muted">Nenhuma ferramenta especificada</span>';
    }
    
    // Mostrar informações
    const infoDiv = document.getElementById('flowInfo');
    infoDiv.innerHTML = `
        <p><strong>Dificuldade:</strong> ${flow.difficulty_level}</p>
        <p><strong>Tempo Estimado:</strong> ${flow.estimated_time || 'N/A'}</p>
        <p><strong>Criado em:</strong> ${new Date(flow.created_at).toLocaleDateString()}</p>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('viewFlowModal'));
    modal.show();
}

// Excluir fluxo
async function deleteFlow(flowId) {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;
    
    try {
        const response = await fetch(`/api/flows/${flowId}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.status === 'success') {
            notificationSystem.success('Fluxo excluído com sucesso!');
            loadFlows();
        } else {
            notificationSystem.error(data.error || 'Erro ao excluir fluxo');
        }
    } catch (error) {
        console.error('Erro ao excluir fluxo:', error);
        notificationSystem.error('Erro de conexão');
    }
}

// ============================================================================
// FUNÇÕES DE FILTROS
// ============================================================================

// Aplicar filtros
function applyFlowFilters() {
    const type = document.getElementById('flowTypeFilter').value;
    const difficulty = document.getElementById('difficultyFilter').value;
    const search = document.getElementById('searchInput').value;
    
    let filteredFlows = currentFlows;
    
    if (type) {
        filteredFlows = filteredFlows.filter(flow => flow.flow_type === type);
    }
    
    if (difficulty) {
        filteredFlows = filteredFlows.filter(flow => flow.difficulty_level === difficulty);
    }
    
    if (search) {
        const searchLower = search.toLowerCase();
        filteredFlows = filteredFlows.filter(flow => 
            flow.title.toLowerCase().includes(searchLower) ||
            (flow.description && flow.description.toLowerCase().includes(searchLower))
        );
    }
    
    renderFlows(filteredFlows);
}

// Limpar filtros
function clearFlowFilters() {
    document.getElementById('flowTypeFilter').value = '';
    document.getElementById('difficultyFilter').value = '';
    document.getElementById('searchInput').value = '';
    renderFlows(currentFlows);
}

// Criar novo fluxo
// ============================================================================
// FUNÇÕES DE TEMPLATES
// ============================================================================

// Carregar templates
async function loadTemplates() {
    try {
        const response = await fetch('/api/flows/templates');
        const data = await response.json();
        
        if (data.status === 'success') {
            renderTemplates(data.templates);
        }
    } catch (error) {
        console.error('Erro ao carregar templates:', error);
    }
}

// Renderizar templates
function renderTemplates(templates) {
    const container = document.getElementById('templatesContainer');
    if (container) {
        container.innerHTML = templates.map(template => `
            <div class="col-md-4 mb-3">
                <div class="card template-card h-100" onclick="useTemplate('${template.id}')">
                    <div class="card-body">
                        <h6 class="card-title">${template.title}</h6>
                        <p class="card-text small text-muted">${template.description}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="bi bi-clock"></i> ${template.estimated_time}
                            </small>
                            <small class="text-muted">
                                <i class="bi bi-person"></i> ${template.difficulty_level}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Usar template
function useTemplate(templateId) {
    notificationSystem.info('Funcionalidade de template em desenvolvimento');
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function getDifficultyColor(difficulty) {
    switch (difficulty) {
        case 'Fácil': return 'bg-success';
        case 'Médio': return 'bg-warning';
        case 'Avançado': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function getFlowTypeIcon(type) {
    switch (type) {
        case 'email_automation': return 'bi bi-envelope';
        case 'data_processing': return 'bi bi-database';
        case 'backup': return 'bi bi-archive';
        case 'workflow': return 'bi bi-diagram-3';
        default: return 'bi bi-gear';
    }
}

function getFlowTypeName(type) {
    switch (type) {
        case 'email_automation': return 'Email';
        case 'data_processing': return 'Dados';
        case 'backup': return 'Backup';
        case 'workflow': return 'Workflow';
        default: return 'Geral';
    }
}

// ============================================================================
// INICIALIZAÇÃO DO SISTEMA DE FLUXOS
// ============================================================================

// Adicionar event listeners para filtros
document.addEventListener('DOMContentLoaded', () => {
    const flowTypeFilter = document.getElementById('flowTypeFilter');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (flowTypeFilter) {
        flowTypeFilter.addEventListener('change', applyFlowFilters);
    }
    
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', applyFlowFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFlowFilters);
    }
});

// ============================================================================
// SISTEMA DE MODO ESCURO
// ============================================================================

function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    
    // Verificar se o modo escuro está ativo
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
    
    // Event listener para o toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
}

async function useTemplate(templateId) {
    try {
        const response = await fetch(`/api/flows/templates/${templateId}/use`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Fluxo criado com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('templatesModal')).hide();
            if (window.userDashboard) {
                window.userDashboard.loadFlows();
            }
        } else {
            alert('Erro ao criar fluxo: ' + data.error);
        }
    } catch (error) {
        alert('Erro ao criar fluxo: ' + error.message);
    }
}

async function createFlow() {
    const title = document.getElementById('flowTitle').value;
    const description = document.getElementById('flowDescription').value;
    const flowType = document.getElementById('flowType').value;
    const difficultyLevel = document.getElementById('difficultyLevel').value;
    const estimatedTime = document.getElementById('estimatedTime').value;
    const toolsUsed = document.getElementById('toolsUsed').value.split(',').map(t => t.trim()).filter(t => t);
    
    if (!title) {
        alert('Título é obrigatório');
        return;
    }
    
    try {
        const response = await fetch('/api/flows', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                flow_type: flowType,
                difficulty_level: difficultyLevel,
                estimated_time: estimatedTime,
                tools_used: toolsUsed,
                flow_data: {
                    nodes: [],
                    connections: []
                }
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Fluxo criado com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('createFlowModal')).hide();
            document.getElementById('createFlowForm').reset();
            if (window.userDashboard) {
                window.userDashboard.loadFlows();
            }
        } else {
            alert('Erro ao criar fluxo: ' + data.error);
        }
    } catch (error) {
        alert('Erro ao criar fluxo: ' + error.message);
    }
}

async function deleteFlow(flowId) {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/flows/${flowId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Fluxo excluído com sucesso!');
            if (window.userDashboard) {
                window.userDashboard.loadFlows();
            }
        } else {
            alert('Erro ao excluir fluxo: ' + data.error);
        }
    } catch (error) {
        alert('Erro ao excluir fluxo: ' + error.message);
    }
}

function clearFilters() {
    document.getElementById('flowTypeFilter').value = '';
    document.getElementById('difficultyFilter').value = '';
    document.getElementById('searchInput').value = '';
    if (window.userDashboard && window.userDashboard.currentFlows) {
        window.userDashboard.renderFlows(window.userDashboard.currentFlows);
    }
}

function applyFilters() {
    const typeFilter = document.getElementById('flowTypeFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    const searchFilter = document.getElementById('searchInput').value.toLowerCase();
    
    if (!window.userDashboard || !window.userDashboard.currentFlows) return;
    
    let filteredFlows = window.userDashboard.currentFlows;
    
    if (typeFilter) {
        filteredFlows = filteredFlows.filter(flow => flow.flow_type === typeFilter);
    }
    
    if (difficultyFilter) {
        filteredFlows = filteredFlows.filter(flow => flow.difficulty_level === difficultyFilter);
    }
    
    if (searchFilter) {
        filteredFlows = filteredFlows.filter(flow => 
            flow.title.toLowerCase().includes(searchFilter) ||
            (flow.description && flow.description.toLowerCase().includes(searchFilter))
        );
    }
    
    window.userDashboard.renderFlows(filteredFlows);
}

function viewRecommendationDetails(recommendationId) {
    // Implementar visualização de detalhes da recomendação
    notificationSystem.info('Funcionalidade em desenvolvimento');
}

function editProject(projectId) {
    // Implementar edição de projeto
    notificationSystem.info('Funcionalidade em desenvolvimento');
}

function deleteProject(projectId) {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
        // Implementar exclusão de projeto
        notificationSystem.info('Funcionalidade em desenvolvimento');
    }
}

// ============================================================================
// SISTEMA DE MODO ESCURO
// ============================================================================

function initDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
    }
    
    updateChartColors(theme === 'dark');
}

function updateChartColors(isDark) {
    const colors = isDark ? {
        text: '#ffffff',
        grid: 'rgba(255, 255, 255, 0.1)'
    } : {
        text: '#000000',
        grid: 'rgba(0, 0, 0, 0.1)'
    };
    
    if (window.userDashboard && window.userDashboard.charts.roi) {
        window.userDashboard.charts.roi.options.scales.x.ticks.color = colors.text;
        window.userDashboard.charts.roi.options.scales.y.ticks.color = colors.text;
        window.userDashboard.charts.roi.options.scales.y.title.color = colors.text;
        window.userDashboard.charts.roi.options.scales.x.grid.color = colors.grid;
        window.userDashboard.charts.roi.options.scales.y.grid.color = colors.grid;
        window.userDashboard.charts.roi.update();
    }
}

// ============================================================================
// SISTEMA DE IDIOMAS
// ============================================================================

async function loadCurrentLanguage() {
    try {
        const response = await fetch('/api/language');
        const data = await response.json();
        
        if (data.status === 'success') {
            document.documentElement.lang = data.language;
        }
    } catch (error) {
        console.error('Erro ao carregar idioma atual:', error);
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    window.userDashboard = new UserDashboard();
    initDarkMode();
    loadCurrentLanguage();
    
    // Adicionar event listeners para filtros de fluxos
    const flowTypeFilter = document.getElementById('flowTypeFilter');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (flowTypeFilter) {
        flowTypeFilter.addEventListener('change', applyFilters);
    }
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', applyFilters);
    }
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
});

// Instâncias globais
const notificationSystem = new NotificationSystem();
const loadingSystem = new LoadingSystem();

// Exportar para uso global
window.notificationSystem = notificationSystem;
window.loadingSystem = loadingSystem;
