// /src/pages/ControleProducao/ControleProducaoPage.jsx
import React, { useState, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getProducao } from '../../services/api';

// Importa os novos componentes de view
import ProducaoManagementView from '../../components/ControleProducao/ProducaoManagementView';
import ProducaoReportPreview from '../../components/ControleProducao/ProducaoReportPreview';
import ProducaoFilterPanel from '../../components/ControleProducao/ProducaoFilterPanel';

// Importa funções de data
import { toISODateString, parseISODateAsUTC, formatFriendlyDate } from '../../components/ContagemGeral/utils';

import './ControleProducaoPage.css'; // O CSS principal
import logo from '../../assets/img/logo.png'; // Logo para o PDF

// Função para pegar os dias no range (para o filtro)
const getDaysInRange = (startDate, endDate) => {
    const days = [];
    let currentDate = parseISODateAsUTC(startDate);
    const lastDate = parseISODateAsUTC(endDate);
    for (let i = 0; i <= 366 && currentDate <= lastDate; i++) {
        days.push(toISODateString(currentDate)); 
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return days;
};

const ControleProducaoPage = () => {
    // Estado da view principal
    const [viewMode, setViewMode] = useState('management'); // 'management' ou 'report'
    
    // Estado de todos os dados de produção (para a tabela)
    const [allProducaoData, setAllProducaoData] = useState([]);
    
    // Estado dos dados filtrados (para o relatório)
    const [reportData, setReportData] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [currentReportTitle, setCurrentReportTitle] = useState("Selecione os filtros");

    // Estado dos filtros (agora no pai)
    const initialState = useMemo(() => {
        const today = new Date();
        return {
            startDate: toISODateString(today),
            endDate: toISODateString(today),
            searchTerm: '',
        };
    }, []);
    const [filters, setFilters] = useState(initialState);

    // Busca todos os dados de produção
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProducao();
            setAllProducaoData(data.data || []);
        } catch (error) {
            Swal.fire('Erro!', 'Não foi possível carregar os dados de produção.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Hook para buscar os dados na montagem
    useState(() => {
        fetchData();
    }, [fetchData]);

    // Função para gerar o relatório
    const handleGenerateReport = useCallback(() => {
        setLoading(true);
        setReportData(null);
        
        const { startDate, endDate, searchTerm } = filters;
        
        let title = `Relatório Personalizado: ${formatFriendlyDate(startDate)} a ${formatFriendlyDate(endDate)}`;
        if (startDate === endDate) {
            title = `Relatório do Dia: ${formatFriendlyDate(startDate)}`;
        }
        if (searchTerm) {
            title += ` (Filtro: "${searchTerm}")`;
        }
        setCurrentReportTitle(title);

        try {
            const validDaysSet = new Set(getDaysInRange(startDate, endDate));
            
            const filteredData = allProducaoData.filter(item => {
                const itemDate = item.data_alimento;
                const dateMatch = validDaysSet.has(itemDate);
                const searchMatch = item.nome_alimento.toLowerCase().includes(searchTerm.toLowerCase());
                return dateMatch && searchMatch;
            });
            
            setReportData(filteredData);
        } catch (error) {
            Swal.fire('Erro!', 'Não foi possível filtrar os dados.', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters, allProducaoData]);

    // Função para o botão de baixar (usa a do ProducaoFilterPanel)
    const handleDownloadReport = () => {
        // A lógica de download agora fica no ProducaoFilterPanel
        // Apenas como placeholder
        console.log("Download solicitado...");
    };


    return (
        <section className="producao-container-v2">
            <div className="producao-layout-grid-v2">
                
                {/* Coluna 1: Sidebar de Navegação */}
                <div className="producao-sidebar-v2">
                    <h3>Visualização</h3>
                    <button 
                        className={`sidebar-action-button ${viewMode === 'management' ? 'active' : ''}`} 
                        onClick={() => setViewMode('management')}
                    >
                        <i className="bi bi-pencil-square"></i>
                        <span>Gerenciamento</span>
                    </button>
                    <button 
                        className={`sidebar-action-button ${viewMode === 'report' ? 'active' : ''}`}
                        onClick={() => setViewMode('report')}
                    >
                        <i className="bi bi-file-earmark-text-fill"></i>
                        <span>Relatório</span>
                    </button>
                </div>

                {/* Coluna 2: Conteúdo Principal (Tabela ou Preview) */}
                <div className="producao-content-v2">
                    {viewMode === 'management' ? (
                        <ProducaoManagementView 
                            initialData={allProducaoData}
                            isLoading={loading}
                            onDataChange={fetchData} // Passa a função para o filho atualizar
                        />
                    ) : (
                        <div className="producao-report-preview-area">
                            <ProducaoReportPreview
                                data={reportData}
                                loading={loading && !reportData} // Mostra loading só se estiver gerando
                                title={currentReportTitle}
                            />
                        </div>
                    )}
                </div>

                {/* Coluna 3: Painel de Filtros */}
                <ProducaoFilterPanel
                    filters={filters}
                    onFilterChange={setFilters}
                    onGenerate={handleGenerateReport}
                    onDownload={handleDownloadReport}
                    loading={loading}
                    reportData={reportData}
                    logo={logo} // Passa a logo para o PDF
                    isReportMode={viewMode === 'report'} // Mostra filtros apenas no modo relatório
                />
            </div>
        </section>
    );
};

export default ControleProducaoPage;