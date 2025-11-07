// /src/components/ContagemGeral/ReportFilterPanel.jsx
import React from 'react';
import { MONTHS } from './utils'; // <-- Garanta que está importando de utils
import './ReportFilterPanel.css'; 

const ReportFilterPanel = ({
    reportType,
    dataType,
    onDataTypeChange,
    filters,
    onFilterChange,
    onGenerate,
    onDownload,
    loading,
    reportData 
}) => {

    const handleFilter = (key, value) => {
        onFilterChange(prev => ({ ...prev, [key]: value }));
    };

    // Não precisamos mais do useEffect aqui, 
    // pois o ReportView já define o estado inicial com UTC.

    const renderFilters = () => {
        // ... (o JSX de renderFilters está correto e não precisa mudar)
        switch (reportType) {
            case 'diario':
                return (
                    <div className="filter-group">
                        <label>Selecione o Dia</label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => handleFilter('date', e.target.value)}
                        />
                    </div>
                );
            case 'semanal':
                 return (
                    <div className="filter-group">
                        <label>Data Início (Semana)</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilter('startDate', e.target.value)}
                        />
                         <label>Data Fim (Semana)</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilter('endDate', e.target.value)}
                        />
                    </div>
                );
            case 'mensal':
                return (
                    <div className="filter-group">
                        <label>Selecione o Mês</label>
                        <select
                            value={filters.month}
                            onChange={(e) => handleFilter('month', parseInt(e.target.value))}
                        >
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <label>Ano</label>
                        <input
                            type="number"
                            value={filters.year}
                            onChange={(e) => handleFilter('year', parseInt(e.target.value))}
                            className="input-ano"
                        />
                    </div>
                );
            case 'anual':
                 return (
                    <div className="filter-group">
                        <label>Selecione o Ano</label>
                         <input
                            type="number"
                            value={filters.year}
                            onChange={(e) => handleFilter('year', parseInt(e.target.value))}
                        />
                    </div>
                );
            case 'personalizado':
                return (
                    <div className="filter-group">
                        <label>Data Início</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilter('startDate', e.target.value)}
                        />
                         <label>Data Fim</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilter('endDate', e.target.value)}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="report-filter-panel">
            <div className="filter-section">
                <h4 className="filter-section-title">Filtros de Período</h4>
                {renderFilters()}
            </div>
            <div className="filter-section">
                 <h4 className="filter-section-title">Tipo de Dado</h4>
                <div className="filter-group">
                    <select
                        value={dataType}
                        onChange={(e) => onDataTypeChange(e.target.value)}
                    >
                        <option value="tudo">Tudo (Geral + NES)</option>
                        <option value="contagens">Contagens (Geral)</option>
                        <option value="necessidades">Necessidades (NES)</option>
                    </select>
                </div>
            </div>
            <div className="report-actions">
                <button 
                    className="btn-gerar" 
                    onClick={onGenerate} 
                    disabled={loading}
                >
                    {loading ? 'Gerando...' : 'Gerar Relatório'}
                </button>
                <button 
                    className="btn-baixar" 
                    onClick={onDownload}
                    disabled={!reportData} 
                >
                    <i className="bi bi-download"></i> Baixar PDF
                </button>
            </div>
        </div>
    );
};

export default ReportFilterPanel;