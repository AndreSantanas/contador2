import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
    getNecessidades, addNecessidade, updateNecessidade, deleteNecessidade, 
    getAlunos, addAluno, updateAluno, deleteAluno, getTurmas, 
    associarNecessidadesAoAluno, desassociarAlunoDaNecessidade, uploadFile,
    getNecessidadeComAlunos, agendarRelacaoNosDias, getDiasDaRelacao, getCronograma
} from '../../services/api';
import { PUBLIC_STORAGE_URL } from '../../config/apiConfig';
import placeholderAvatar from '../../assets/img/avatar.png';
import './PlanejamentoPage.css';

// Componente reutilizável para a Busca Animada
const SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="search-container">
            <input 
                type="search" 
                placeholder={placeholder}
                className={`search-input ${isExpanded ? 'expanded' : ''}`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => { if(!searchTerm) setIsExpanded(false); }}
                onFocus={() => setIsExpanded(true)}
            />
            <button className="search-icon" onClick={() => setIsExpanded(true)}>
                <i className="bi bi-search"></i>
            </button>
        </div>
    );
};

// Componente reutilizável para o Card de Aluno
const AlunoCard = ({ aluno, type, turmasMap, onAdd, onEdit, onDelete, onSchedule, onRemove, disabledAdd }) => (
    <div className="aluno-card">
        <div className="card-header">
            <img src={aluno.foto ? `${PUBLIC_STORAGE_URL}/${aluno.foto}` : placeholderAvatar} alt={aluno.nome} className="card-photo" />
            <div className="card-info">
                <h5 className="card-name">{aluno.nome}</h5>
                <span className="card-details">RM: {aluno.rm} | {turmasMap[aluno.turmas_id] || 'N/A'}</span>
            </div>
        </div>
        {aluno.descricao && type === 'associado' && (
            <div className="card-body">
                <p className="card-description-text">{aluno.descricao}</p>
            </div>
        )}
        <div className="card-actions" data-button-count={type === 'geral' ? 3 : 2}>
            {type === 'geral' ? (
                <>
                    <button title="Adicionar à necessidade selecionada" className="action-button-card add" onClick={onAdd} disabled={disabledAdd}><i className="bi bi-plus-lg"></i></button>
                    <button title="Editar Aluno" className="action-button-card edit" onClick={onEdit}><i className="bi bi-pencil-fill"></i></button>
                    <button title="Deletar Aluno" className="action-button-card delete" onClick={onDelete}><i className="bi bi-trash-fill"></i></button>
                </>
            ) : (
                <>
                    <button className="action-button-card schedule" onClick={onSchedule} title="Agendar Dia"><i className="bi bi-calendar-week"></i></button>
                    <button className="action-button-card remove" onClick={onRemove} title="Deletar junção"><i className="bi bi-trash-fill"></i></button>
                </>
            )}
        </div>
    </div>
);

const PlanejamentoPage = () => {
    const [necessidades, setNecessidades] = useState([]);
    const [todosAlunos, setTodosAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [dadosCompletos, setDadosCompletos] = useState([]);
    const [diasDaSemana, setDiasDaSemana] = useState([]);
    const [selectedNecessidadeId, setSelectedNecessidadeId] = useState(null);
    const [searchTermCentral, setSearchTermCentral] = useState('');
    const [searchTermAlunosPanel, setSearchTermAlunosPanel] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    const turmasMap = useMemo(() => turmas.reduce((map, turma) => {
        map[turma.id] = turma.nome_turma;
        return map;
    }, {}), [turmas]);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [necessidadesData, alunosData, turmasData, cronogramaData] = await Promise.all([
                getNecessidades(1, 100), getAlunos(1, 1000), getTurmas(1, 100), getCronograma()
            ]);
            
            const listaNecessidades = necessidadesData.data || [];
            setNecessidades(listaNecessidades);
            setTodosAlunos(alunosData.data || []);
            setTurmas(turmasData.data || []);
            setDiasDaSemana(cronogramaData.data || []);

            if (listaNecessidades.length > 0) {
                const resultados = await Promise.all(listaNecessidades.map(nec => getNecessidadeComAlunos(nec.id)));
                setDadosCompletos(resultados.filter(Boolean));
            }
        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
        } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSelectNecessidade = (id) => {
        setSelectedNecessidadeId(id);
        setSearchTermCentral('');
    };
    
    const displayedAlunosCentral = useMemo(() => {
        if (!selectedNecessidadeId) return [];
        const necessidadeSelecionada = dadosCompletos.find(nec => nec.id === selectedNecessidadeId);
        let alunosToShow = (necessidadeSelecionada?.alunos || []).map(aluno => todosAlunos.find(a => a.id === aluno.id)).filter(Boolean);
        
        if (searchTermCentral) {
            return alunosToShow.filter(aluno => aluno.nome.toLowerCase().includes(searchTermCentral.toLowerCase()));
        }
        return alunosToShow;
    }, [selectedNecessidadeId, todosAlunos, dadosCompletos, searchTermCentral]);
    
    const filteredAlunosPanel = useMemo(() => 
        todosAlunos.filter(a => a.nome.toLowerCase().includes(searchTermAlunosPanel.toLowerCase()))
    , [todosAlunos, searchTermAlunosPanel]);
    
    const nomeDaVisao = useMemo(() => {
        if (selectedNecessidadeId) {
            return `Alunos em: ${necessidades.find(n => n.id === selectedNecessidadeId)?.necessidade || ''}`;
        }
        return 'Selecione uma necessidade para começar';
    }, [selectedNecessidadeId, necessidades]);

    const handleAddNecessidade = async () => {
        const { value: nome } = await Swal.fire({ title: 'Criar Necessidade', input: 'text', inputPlaceholder: 'Nome da Necessidade', showCancelButton: true, confirmButtonText: 'Criar', confirmButtonColor: '#28a745', inputValidator: (v) => !v && 'Digite um nome!' });
        if (nome) {
            try {
                await addNecessidade(nome);
                await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Necessidade criada.', timer: 1500, showConfirmButton: false});
                fetchData();
            } catch (error) { if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível criar.', 'error'); }
        }
    };
    
    const handleEditNecessidade = async (necessidade) => {
        const { value: nome } = await Swal.fire({ title: 'Editar Necessidade', input: 'text', inputValue: necessidade.necessidade, showCancelButton: true, confirmButtonText: 'Salvar', confirmButtonColor: '#28a745', inputValidator: (v) => !v && 'O nome não pode ser vazio!' });
        if (nome && nome !== necessidade.necessidade) {
            try {
                await updateNecessidade(necessidade.id, nome);
                await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Necessidade atualizada.', timer: 1500, showConfirmButton: false});
                fetchData();
            } catch (error) { if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível atualizar.', 'error'); }
        }
    };

    const handleDeleteNecessidade = async (necessidade) => {
        const res = await Swal.fire({ title: 'Tem certeza?', text: `A necessidade "${necessidade.necessidade}" será removida.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, deletar!', cancelButtonText: 'Cancelar' });
        if (res.isConfirmed) {
            try {
                await deleteNecessidade(necessidade.id);
                await Swal.fire({icon: 'success', title: 'Deletado!', timer: 1500, showConfirmButton: false});
                if(selectedNecessidadeId === necessidade.id) setSelectedNecessidadeId(null);
                fetchData();
            } catch (error) { if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover.', 'error'); }
        }
    };
    
    const handleOpenAlunoModal = (aluno = null) => {
        const isEditing = !!aluno;
        const turmasOptionsHtml = turmas.map(t => `<option value="${t.id}" ${isEditing && aluno.turmas_id == t.id ? 'selected' : ''}>${t.nome_turma}</option>`).join('');

        Swal.fire({
            title: isEditing ? 'Editar Aluno' : 'Adicionar Aluno',
            width: '700px',
            html: `
                <div class="swal-form-container">
                    <input id="swal-nome" class="swal2-input" placeholder="Nome Completo" value="${isEditing ? aluno.nome : ''}">
                    <input id="swal-rm" class="swal2-input" placeholder="RM" value="${isEditing ? aluno.rm : ''}">
                    <input id="swal-data_nascimento" type="date" class="swal2-input" value="${isEditing ? aluno.data_nascimento : ''}">
                    <select id="swal-genero" class="swal2-select">
                        <option value="">Selecione o Gênero</option>
                        <option value="Masculino" ${isEditing && aluno.genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
                        <option value="Feminino" ${isEditing && aluno.genero === 'Feminino' ? 'selected' : ''}>Feminino</option>
                    </select>
                    <select id="swal-turma" class="swal2-select">
                        <option value="">Selecione a Turma</option>
                        ${turmasOptionsHtml}
                    </select>
                    <label for="swal-foto" class="swal2-file-label">Foto do Aluno (Opcional)</label>
                    <input id="swal-foto" type="file" class="swal2-file" accept="image/*">
                    <textarea id="swal-descricao" class="swal2-textarea" placeholder="Observações sobre o aluno...">${isEditing ? aluno.descricao || '' : ''}</textarea>
                </div>
            `,
            focusConfirm: false, showCancelButton: true, confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            preConfirm: async () => {
                const data = {
                    nome: document.getElementById('swal-nome').value,
                    rm: document.getElementById('swal-rm').value,
                    data_nascimento: document.getElementById('swal-data_nascimento').value,
                    genero: document.getElementById('swal-genero').value,
                    turmas_id: document.getElementById('swal-turma').value,
                    descricao: document.getElementById('swal-descricao').value,
                };
                const fotoFile = document.getElementById('swal-foto').files[0];
                
                if (!data.nome || !data.rm) {
                    Swal.showValidationMessage('Nome e RM são obrigatórios!');
                    return false;
                }
                
                if (fotoFile) {
                    if (fotoFile.size > 2 * 1024 * 1024) { // 2MB
                        Swal.showValidationMessage('A imagem não pode ser maior que 2MB.');
                        return false;
                    }
                    try {
                        const uploadResponse = await uploadFile(fotoFile);
                        data.foto = uploadResponse.path;
                    } catch (e) {
                        Swal.showValidationMessage('Falha no upload da foto.');
                        return false;
                    }
                }
                
                return data;
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    Swal.showLoading();
                    if (isEditing) {
                        await updateAluno(aluno.id, result.value);
                    } else {
                        await addAluno(result.value);
                    }
                    await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Aluno salvo!', timer: 1500, showConfirmButton: false});
                    fetchData();
                } catch (error) {
                    if (!error.message.includes('Sessão expirada')) Swal.fire('Erro!', `Não foi possível salvar o aluno.`, 'error');
                }
            }
        });
    };
    
    const handleDeleteAluno = async (alunoId) => {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "O aluno será removido permanentemente do sistema.",
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, deletar!',
        });

        if (result.isConfirmed) {
            try {
                await deleteAluno(alunoId);
                await Swal.fire({icon: 'success', title: 'Deletado!', text: 'Aluno removido.', timer: 1500, showConfirmButton: false});
                fetchData();
            } catch (error) {
                if (!error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover o aluno.', 'error');
            }
        }
    };

    const handleAddAlunoToNecessidade = async (alunoId) => {
        if (!selectedNecessidadeId) {
            Swal.fire('Atenção!', 'Selecione uma necessidade na coluna da esquerda primeiro.', 'info');
            return;
        }
        
        const necessidadeAtual = dadosCompletos.find(n => n.id === selectedNecessidadeId);
        const jaAssociado = necessidadeAtual?.alunos.some(a => a.id === alunoId);
        if (jaAssociado) {
            Swal.fire('Atenção!', 'Este aluno já está associado a esta necessidade.', 'warning');
            return;
        }

        try {
            await associarNecessidadesAoAluno(alunoId, [selectedNecessidadeId]);
            const alunoAssociado = todosAlunos.find(a => a.id === alunoId);
            Swal.fire({
                icon: 'success',
                title: 'Associado!',
                text: `${alunoAssociado.nome} foi adicionado à necessidade.`,
                timer: 2000,
                showConfirmButton: false
            });
            fetchData();
        } catch (error) {
            Swal.fire('Erro!', 'Não foi possível associar o aluno.', 'error');
        }
    };
    
    const handleRemoveAlunoFromNecessidade = async (aluno) => {
        if (!selectedNecessidadeId) return;
        const necessidadeAtual = necessidades.find(n => n.id === selectedNecessidadeId);
        const result = await Swal.fire({
            title: 'Remover Associação',
            html: `Certeza que quer remover <strong>${aluno.nome}</strong> de <strong>${necessidadeAtual.necessidade}</strong>?`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, remover!', cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                Swal.showLoading();
                await desassociarAlunoDaNecessidade(selectedNecessidadeId, aluno.id);
                await Swal.fire({icon: 'success', title: 'Removido!', text: 'Associação removida.', timer: 1500, showConfirmButton: false});
                fetchData();
            } catch (error) { 
                if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover a associação.', 'error'); 
            }
        }
    };

    const handleOpenScheduleModal = async (aluno) => {
        if (!selectedNecessidadeId) return;
        const relacao = dadosCompletos.find(n => n.id === selectedNecessidadeId)?.alunos?.find(a => a.id === aluno.id);
        if(!relacao?.pivot?.id) return Swal.fire('Erro', 'ID da relação não encontrado.', 'error');

        const relacaoId = relacao.pivot.id;
        
        const diasAgendadosNomes = [];
        diasDaSemana.forEach(dia => {
            const alunoEstaNesteDia = dia.alunos.some(alunoAgendado => 
                alunoAgendado.id === aluno.id && 
                alunoAgendado.necessidade_relacionada?.id === selectedNecessidadeId
            );
            if (alunoEstaNesteDia) {
                diasAgendadosNomes.push(dia.dia);
            }
        });

        const diasHtml = diasDaSemana.map(dia => `
            <label class="swal-checkbox-label">
                <input type="checkbox" class="swal-dia-checkbox" value="${dia.id}" ${diasAgendadosNomes.includes(dia.dia) ? 'checked' : ''}>
                ${dia.dia}
            </label>
        `).join('');

        const { value: diasSelecionadosIds } = await Swal.fire({
            title: `Agendar dias para ${aluno.nome}`,
            html: `<div class="swal-checkbox-container">${diasHtml}</div>`,
            showCancelButton: true,
            confirmButtonText: 'Salvar Agendamento',
            preConfirm: () => {
                const selectedIds = [];
                document.querySelectorAll('.swal-dia-checkbox:checked').forEach(cb => selectedIds.push(cb.value));
                return selectedIds;
            }
        });

        if (diasSelecionadosIds) { // O resultado de 'preConfirm' pode ser um array vazio, mas não é 'undefined'
            try {
                Swal.showLoading();
                // A API `agendarRelacaoNosDias` substitui todos os agendamentos.
                // Esta é a maneira mais limpa: enviar o estado final desejado.
                await agendarRelacaoNosDias(relacaoId, diasSelecionadosIds);
                
                await Swal.fire('Sucesso!', 'Agendamento atualizado.', 'success');
                fetchData(); // Recarrega os dados para refletir as mudanças
            } catch (error) {
                Swal.fire('Erro!', 'Não foi possível salvar o agendamento.', 'error');
            }
        } else if (diasSelecionadosIds === undefined) {
            // O usuário cancelou, não faz nada
        } else {
            // O usuário confirmou sem selecionar nenhum dia
             try {
                Swal.showLoading();
                await agendarRelacaoNosDias(relacaoId, []); // Envia um array vazio para limpar
                await Swal.fire('Sucesso!', 'Agendamento atualizado.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Erro!', 'Não foi possível limpar o agendamento.', 'error');
            }
        }
    };
    
    const handleDownloadPdf = () => {
        if (!selectedNecessidadeId) return;
        const necessidadeAtual = necessidades.find(n => n.id === selectedNecessidadeId);
        if (!necessidadeAtual || displayedAlunosCentral.length === 0) {
            Swal.fire('Atenção', 'Não há alunos para gerar o relatório.', 'info');
            return;
        }

        const doc = new jsPDF();
        const dataFormatada = new Date().toLocaleDateString('pt-BR');
        doc.text(`Relatório de Alunos - ${necessidadeAtual.necessidade}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${dataFormatada}`, 14, 25);
        
        doc.autoTable({
            startY: 35,
            head: [['Nome do Aluno', 'RM', 'Turma']],
            body: displayedAlunosCentral.map(aluno => [
                aluno.nome,
                aluno.rm,
                turmasMap[aluno.turmas_id] || 'N/A'
            ]),
        });

        doc.save(`relatorio_${necessidadeAtual.necessidade.toLowerCase().replace(/ /g, '_')}.pdf`);
    };

    return (
        <section className="planejamento-container-grid">
            
            <div className="panel-lateral panel-necessidades">
                <div className="panel-header">
                    <h3>Necessidades</h3>
                    <button className="add-button-small" onClick={handleAddNecessidade} title="Criar Nova Necessidade">+</button>
                </div>
                <div className="list-container">
                    {isLoading ? <p style={{padding: '10px'}}>Carregando...</p> : necessidades.map(nec => (
                        <div key={nec.id} className={`list-item-container ${selectedNecessidadeId === nec.id ? 'active' : ''}`} onClick={() => handleSelectNecessidade(nec.id)}>
                            <span className="list-item-name">{nec.necessidade}</span>
                            <div className="list-item-actions">
                                <button title="Editar" onClick={(e) => { e.stopPropagation(); handleEditNecessidade(nec); }}><i className="bi bi-pencil-fill"></i></button>
                                <button title="Excluir" onClick={(e) => { e.stopPropagation(); handleDeleteNecessidade(nec); }}><i className="bi bi-trash-fill"></i></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="panel-central">
                <div className="panel-header">
                    <h3>{nomeDaVisao}</h3>
                    <div className="header-actions">
                        <SearchBar searchTerm={searchTermCentral} setSearchTerm={setSearchTermCentral} placeholder="Buscar..." />
                        <button className="action-button-pdf" onClick={handleDownloadPdf} disabled={!selectedNecessidadeId}>
                            <i className="bi bi-file-earmark-pdf-fill"></i> Baixar PDF
                        </button>
                    </div>
                </div>
                <div className="grid-container-central">
                    {isLoading ? <p style={{padding: '20px'}}>Carregando...</p> 
                    : !selectedNecessidadeId ? (
                        <div className="empty-state">
                            <i className="bi bi-arrow-left-circle"></i>
                            <p>Selecione uma necessidade para ver os alunos.</p>
                        </div>
                    )
                    : displayedAlunosCentral.length > 0 ? displayedAlunosCentral.map(aluno => (
                        <AlunoCard 
                            key={aluno.id}
                            aluno={aluno}
                            type="associado"
                            turmasMap={turmasMap}
                            onSchedule={() => handleOpenScheduleModal(aluno)}
                            onRemove={() => handleRemoveAlunoFromNecessidade(aluno)}
                        />
                    )) : (
                        <div className="empty-state">
                            <i className="bi bi-search"></i>
                            <p>Nenhum aluno associado.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="panel-lateral panel-alunos">
                <div className="panel-header">
                    <h3>Todos os Alunos</h3>
                    <button className="add-button-small" onClick={() => handleOpenAlunoModal()} title="Adicionar Novo Aluno">+</button>
                </div>
                <div style={{padding: '0 15px 10px 15px', flexShrink: 0}}>
                    <SearchBar searchTerm={searchTermAlunosPanel} setSearchTerm={setSearchTermAlunosPanel} placeholder="Buscar em todos..." />
                </div>
                <div className="list-container-cards">
                    {isLoading ? <p style={{padding: '10px'}}>Carregando...</p> : filteredAlunosPanel.map(aluno => (
                         <AlunoCard 
                            key={aluno.id}
                            aluno={aluno}
                            type="geral"
                            turmasMap={turmasMap}
                            onAdd={() => handleAddAlunoToNecessidade(aluno.id)}
                            onEdit={() => handleOpenAlunoModal(aluno)}
                            onDelete={() => handleDeleteAluno(aluno.id)}
                            disabledAdd={!selectedNecessidadeId}
                         />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PlanejamentoPage;