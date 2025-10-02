// ============================================================================
// SISTEMA DE FLUXOS RECOMENDADOS - VERSÃO LIMPA E FUNCIONAL
// ============================================================================

// Variáveis globais para fluxos recomendados
let currentRecommendedFlows = [];

// ============================================================================
// FUNÇÕES PRINCIPAIS DE FLUXOS RECOMENDADOS
// ============================================================================

// Carregar fluxos recomendados
async function loadRecommendedFlows() {
    console.log('🔄 Carregando fluxos recomendados...');
    
    try {
        const response = await fetch('/api/recommended-flows');
        const data = await response.json();
        
        if (data.status === 'success') {
            currentRecommendedFlows = data.flows || [];
            console.log('✅ Fluxos recomendados carregados:', currentRecommendedFlows.length);
            renderRecommendedFlows(currentRecommendedFlows);
        } else {
            console.error('❌ Erro ao carregar fluxos recomendados:', data.error);
            showRecommendedFlowsEmptyState();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar fluxos recomendados:', error);
        showRecommendedFlowsEmptyState();
    }
}

// Renderizar fluxos recomendados em cards
function renderRecommendedFlows(flows) {
    console.log('🎨 Renderizando fluxos recomendados:', flows.length);
    
    const container = document.getElementById('recommendedFlowsContainer');
    const loadingSpinner = document.getElementById('recommendedFlowsLoadingSpinner');
    const emptyState = document.getElementById('recommendedFlowsEmptyState');
    
    // Esconder loading
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    
    if (!flows || flows.length === 0) {
        showRecommendedFlowsEmptyState();
        return;
    }
    
    // Esconder empty state
    if (emptyState) emptyState.style.display = 'none';
    
    // Renderizar cards
    if (container) {
        container.innerHTML = flows.map(flow => createRecommendedFlowCard(flow)).join('');
        console.log('✅ Cards de fluxos recomendados renderizados');
    }
}

// Criar card de fluxo recomendado
function createRecommendedFlowCard(flow) {
    const priorityClass = getPriorityClass(flow.priority);
    const difficultyColor = getDifficultyColor(flow.difficulty_level);
    const roiColor = getROIColor(flow.roi_percentage);
    
    return `
        <div class="col-md-4 mb-4">
            <div class="card recommended-flow-card h-100" onclick="viewRecommendedFlow('${flow.id}')">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex align-items-center gap-2">
                            <span class="ai-badge">IA</span>
                            <h6 class="card-title mb-0">${flow.title}</h6>
                        </div>
                        <span class="badge ${difficultyColor}">${flow.difficulty_level}</span>
                    </div>
                    
                    <p class="card-text text-muted small mb-3">${flow.description}</p>
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted d-block">Prioridade</small>
                            <span class="${priorityClass}">${flow.priority}</span>
                        </div>
                        <div class="col-6">
                            <small class="text-muted d-block">ROI</small>
                            <span class="${roiColor}">${flow.roi_percentage}%</span>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted d-block">Economia</small>
                            <small class="text-success fw-bold">${flow.expected_savings}</small>
                        </div>
                        <div class="col-6">
                            <small class="text-muted d-block">Tempo</small>
                            <small class="text-info">${flow.implementation_time}</small>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted d-block">Ferramentas</small>
                        <div class="d-flex flex-wrap gap-1">
                            ${flow.tools_used.split(',').slice(0, 3).map(tool => 
                                `<span class="badge bg-light text-dark">${tool.trim()}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="card-footer bg-transparent">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-warning" onclick="event.stopPropagation(); viewRecommendedFlow('${flow.id}')">
                            <i class="bi bi-eye"></i> Ver Fluxo
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="event.stopPropagation(); createFlowFromRecommendation('${flow.recommendation_id}')">
                            <i class="bi bi-plus"></i> Criar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Mostrar estado vazio
function showRecommendedFlowsEmptyState() {
    const container = document.getElementById('recommendedFlowsContainer');
    const loadingSpinner = document.getElementById('recommendedFlowsLoadingSpinner');
    const emptyState = document.getElementById('recommendedFlowsEmptyState');
    
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    if (container) container.innerHTML = '';
}

// ============================================================================
// FUNÇÕES DE VISUALIZAÇÃO
// ============================================================================

// Visualizar fluxo recomendado
function viewRecommendedFlow(flowId) {
    const flow = currentRecommendedFlows.find(f => f.id === flowId);
    if (!flow) {
        notificationSystem.error('Fluxo não encontrado');
        return;
    }
    
    showRecommendedFlowModal(flow);
}

// Mostrar modal de fluxo recomendado
function showRecommendedFlowModal(flow) {
    const modalHtml = `
        <div class="modal fade" id="recommendedFlowModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-lightbulb text-warning"></i> ${flow.title}
                            <span class="ai-badge ms-2">Recomendado pela IA</span>
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-md-8">
                                <h6>Descrição</h6>
                                <p class="text-muted">${flow.description}</p>
                            </div>
                            <div class="col-md-4">
                                <h6>Informações</h6>
                                <div class="row">
                                    <div class="col-6">
                                        <small class="text-muted d-block">Prioridade</small>
                                        <span class="${getPriorityClass(flow.priority)}">${flow.priority}</span>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted d-block">Dificuldade</small>
                                        <span class="badge ${getDifficultyColor(flow.difficulty_level)}">${flow.difficulty_level}</span>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col-6">
                                        <small class="text-muted d-block">ROI</small>
                                        <span class="${getROIColor(flow.roi_percentage)}">${flow.roi_percentage}%</span>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted d-block">Economia</small>
                                        <small class="text-success fw-bold">${flow.expected_savings}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <h6>Visualização do Fluxo</h6>
                        <div class="flow-visualization" style="min-height: 300px;">
                            ${createFlowVisualization(flow.flow_data)}
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <h6>Ferramentas Recomendadas</h6>
                                <div class="d-flex flex-wrap gap-2">
                                    ${flow.tools_used.split(',').map(tool => 
                                        `<span class="badge bg-primary">${tool.trim()}</span>`
                                    ).join('')}
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6>Detalhes de Implementação</h6>
                                <ul class="list-unstyled">
                                    <li><strong>Tempo estimado:</strong> ${flow.implementation_time}</li>
                                    <li><strong>Horas economizadas:</strong> ${flow.estimated_hours} horas</li>
                                    <li><strong>Criado em:</strong> ${new Date(flow.created_at).toLocaleDateString()}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        <button type="button" class="btn btn-warning" onclick="createFlowFromRecommendation('${flow.recommendation_id}')">
                            <i class="bi bi-plus"></i> Criar Fluxo Baseado nesta Recomendação
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente se houver
    const existingModal = document.getElementById('recommendedFlowModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Adicionar novo modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('recommendedFlowModal'));
    modal.show();
    
    // Limpar modal quando fechado
    document.getElementById('recommendedFlowModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Criar fluxo baseado na recomendação
async function createFlowFromRecommendation(recommendationId) {
    try {
        // Buscar dados da recomendação
        const recommendation = currentRecommendedFlows.find(f => f.recommendation_id == recommendationId);
        if (!recommendation) {
            notificationSystem.error('Recomendação não encontrada');
            return;
        }
        
        // Criar fluxo baseado na recomendação
        const response = await fetch('/api/flows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: recommendation.title,
                description: recommendation.description,
                flow_type: 'workflow',
                difficulty_level: recommendation.difficulty_level,
                estimated_time: recommendation.implementation_time,
                tools_used: recommendation.tools_used,
                flow_data: recommendation.flow_data
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            notificationSystem.success('Fluxo criado com sucesso baseado na recomendação da IA!');
            
            // Fechar modal se estiver aberto
            const modal = bootstrap.Modal.getInstance(document.getElementById('recommendedFlowModal'));
            if (modal) {
                modal.hide();
            }
            
            // Recarregar fluxos normais
            if (typeof loadFlows === 'function') {
                loadFlows();
            }
        } else {
            notificationSystem.error(data.error || 'Erro ao criar fluxo');
        }
    } catch (error) {
        console.error('Erro ao criar fluxo da recomendação:', error);
        notificationSystem.error('Erro de conexão');
    }
}

// ============================================================================
// FUNÇÕES DE FILTROS
// ============================================================================

// Aplicar filtros
function applyRecommendedFilters() {
    const priority = document.getElementById('priorityFilter').value;
    const difficulty = document.getElementById('difficultyFilterRec').value;
    const search = document.getElementById('searchInputRec').value;
    
    let filteredFlows = currentRecommendedFlows;
    
    if (priority) {
        filteredFlows = filteredFlows.filter(flow => flow.priority === priority);
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
    
    renderRecommendedFlows(filteredFlows);
}

// Limpar filtros
function clearRecommendedFilters() {
    document.getElementById('priorityFilter').value = '';
    document.getElementById('difficultyFilterRec').value = '';
    document.getElementById('searchInputRec').value = '';
    renderRecommendedFlows(currentRecommendedFlows);
}

// Atualizar fluxos recomendados
function refreshRecommendedFlows() {
    loadRecommendedFlows();
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function getPriorityClass(priority) {
    switch (priority) {
        case 'Alta': return 'priority-high';
        case 'Média': return 'priority-medium';
        case 'Baixa': return 'priority-low';
        default: return 'text-muted';
    }
}

function getROIColor(roi) {
    if (roi >= 200) return 'text-success fw-bold';
    if (roi >= 100) return 'text-warning fw-bold';
    return 'text-danger fw-bold';
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Adicionar event listeners para filtros
document.addEventListener('DOMContentLoaded', () => {
    const priorityFilter = document.getElementById('priorityFilter');
    const difficultyFilterRec = document.getElementById('difficultyFilterRec');
    const searchInputRec = document.getElementById('searchInputRec');
    
    if (priorityFilter) {
        priorityFilter.addEventListener('change', applyRecommendedFilters);
    }
    
    if (difficultyFilterRec) {
        difficultyFilterRec.addEventListener('change', applyRecommendedFilters);
    }
    
    if (searchInputRec) {
        searchInputRec.addEventListener('input', applyRecommendedFilters);
    }
});
