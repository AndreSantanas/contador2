import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { 
    getNecessidades, getNecessidadeComAlunos, addNecessidade, updateNecessidade, deleteNecessidade, 
    getAlunos, getTurmas, associarNecessidadesAoAluno, desassociarAlunoDaNecessidade
} from '../../services/api';
import './PlanejamentoPage.css';

const PlanejamentoPage = () => {
    const [necessidades, setNecessidades] = useState([]);
    const [todosAlunos, setTodosAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [dadosCompletos, setDadosCompletos] = useState([]);
    const [filtroNecessidadeId, setFiltroNecessidadeId] = useState('todas');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const turmasMap = useMemo(() => turmas.reduce((map, turma) => {
        map[turma.id] = turma.nome_turma;
        return map;
    }, {}), [turmas]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [necessidadesData, alunosData, turmasData] = await Promise.all([
                getNecessidades(1, 100), getAlunos(1, 500), getTurmas(1, 100)
            ]);
            
            const listaNecessidades = necessidadesData.data || [];
            setNecessidades(listaNecessidades);
            setTodosAlunos(alunosData.data || []);
            setTurmas(turmasData.data || []);

            if (listaNecessidades.length > 0) {
                const resultados = await Promise.all(listaNecessidades.map(nec => getNecessidadeComAlunos(nec.id)));
                const dadosEstruturados = resultados.filter(Boolean).map(nec => {
                    const alunosUnicos = new Map();
                    (nec.alunos || []).forEach(aluno => alunosUnicos.set(aluno.id, aluno));
                    return { ...nec, alunos: Array.from(alunosUnicos.values()) };
                });
                setDadosCompletos(dadosEstruturados);
            } else { setDadosCompletos([]); }
        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const alunosFiltrados = useMemo(() => {
        if (filtroNecessidadeId === 'todas') {
            const alunosMap = new Map();
            (dadosCompletos || []).forEach(nec => {
                (nec.alunos || []).forEach(aluno => {
                    if (!alunosMap.has(aluno.id)) {
                        const alunoCompleto = todosAlunos.find(a => a.id === aluno.id);
                        alunosMap.set(aluno.id, alunoCompleto);
                    }
                });
            });
            return Array.from(alunosMap.values()).filter(Boolean);
        }
        const necessidadeSelecionada = dadosCompletos.find(nec => nec.id === filtroNecessidadeId);
        return (necessidadeSelecionada?.alunos || []).map(aluno => todosAlunos.find(a => a.id === aluno.id)).filter(Boolean);
    }, [filtroNecessidadeId, dadosCompletos, todosAlunos]);

    const handleAddNecessidade = async () => {
        const { value: nome } = await Swal.fire({ title: 'Criar Necessidade', input: 'text', inputPlaceholder: 'Nome', showCancelButton: true, confirmButtonText: 'Criar', confirmButtonColor: '#28a745', inputValidator: (v) => !v && 'Digite um nome!' });
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
                if(filtroNecessidadeId === necessidade.id) setFiltroNecessidadeId('todas');
                fetchData();
            } catch (error) { if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover.', 'error'); }
        }
    };
    
    const handleGerenciarAlunosDaNecessidade = async () => {
        if (filtroNecessidadeId === 'todas') {
          Swal.fire('Atenção', 'Selecione uma necessidade para gerenciar os alunos.', 'info');
          return;
        }
    
        const necessidadeAtual = necessidades.find(n => n.id === filtroNecessidadeId);
        const originalIds = new Set((dadosCompletos.find(nec => nec.id === filtroNecessidadeId)?.alunos || []).map(a => a.id));
    
        const checkboxesHtml = todosAlunos.map(aluno => `
          <div class="swal-checkbox-item">
            <input type="checkbox" id="aluno-${aluno.id}" value="${aluno.id}" ${originalIds.has(aluno.id) ? 'checked' : ''}>
            <label for="aluno-${aluno.id}">${aluno.nome}</label>
          </div>
        `).join('');
    
        const { value: confirmed } = await Swal.fire({
          title: `Gerenciar Alunos para: ${necessidadeAtual.necessidade}`,
          html: `<div class="swal-checkbox-container">${checkboxesHtml}</div>`,
          width: '600px', showCancelButton: true, confirmButtonText: 'Salvar', confirmButtonColor: '#28a745',
        });
    
        if (confirmed) {
            const selectedIds = new Set();
            todosAlunos.forEach(aluno => {
              const checkbox = document.getElementById(`aluno-${aluno.id}`);
              if (checkbox?.checked) selectedIds.add(aluno.id);
            });

            try {
                Swal.showLoading();
                const updatePromises = [];
                const alunosParaAtualizar = [...new Set([...[...selectedIds].filter(id => !originalIds.has(id)), ...[...originalIds].filter(id => !selectedIds.has(id))])];

                for (const alunoId of alunosParaAtualizar) {
                    const aluno = todosAlunos.find(a => a.id === alunoId);
                    if (!aluno) continue;

                    const necessidadesAtuaisIds = new Set((aluno.necessidades || []).map(n => n.id));
                    if (selectedIds.has(alunoId)) necessidadesAtuaisIds.add(filtroNecessidadeId);
                    else necessidadesAtuaisIds.delete(filtroNecessidadeId);
                    
                    updatePromises.push(associarNecessidadesAoAluno(alunoId, Array.from(necessidadesAtuaisIds)));
                }
                await Promise.all(updatePromises);
                await Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Alunos atualizados!', timer: 1500, showConfirmButton: false });
                fetchData();
            } catch (error) { 
                if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Ocorreu um erro ao atualizar os alunos.', 'error');
            }
        }
    };

    const handleRemoverAssociacao = async (aluno) => {
        if (filtroNecessidadeId === 'todas') return;
        const necessidadeAtual = necessidades.find(n => n.id === filtroNecessidadeId);
        const result = await Swal.fire({
            title: 'Remover Associação',
            html: `Certeza que quer remover <strong>${aluno.nome}</strong> de <strong>${necessidadeAtual.necessidade}</strong>?`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, remover!', cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                Swal.showLoading();
                await desassociarAlunoDaNecessidade(filtroNecessidadeId, aluno.id);
                await Swal.fire({icon: 'success', title: 'Removido!', text: 'Associação removida.', timer: 1500, showConfirmButton: false});
                fetchData();
            } catch (error) { 
                if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover a associação.', 'error'); 
            }
        }
    };

    const nomeFiltro = useMemo(() => {
        if (filtroNecessidadeId === 'todas') return 'Visão Geral de Alunos';
        return `Alunos em: ${necessidades.find(n => n.id === filtroNecessidadeId)?.necessidade || ''}`;
    }, [filtroNecessidadeId, necessidades]);

    return (
        <div className="planejamento-page-container">
            <div className="planejamento-main-content">
                <div className="panel-necessidades">
                    <div className="panel-header">
                        <h3>Necessidades</h3>
                        <button className="add-button-small" onClick={handleAddNecessidade} title="Criar Nova Necessidade">+</button>
                    </div>
                    <div className="list-container">
                        <div className={`list-item-container ${filtroNecessidadeId === 'todas' ? 'active' : ''}`} onClick={() => setFiltroNecessidadeId('todas')}>
                            <span className="list-item-name">Ver Todas</span>
                        </div>
                        {necessidades.map(nec => (
                            <div key={nec.id} className={`list-item-container ${filtroNecessidadeId === nec.id ? 'active' : ''}`} onClick={() => setFiltroNecessidadeId(nec.id)}>
                                <span className="list-item-name">{nec.necessidade}</span>
                                <div className="list-item-actions">
                                    <button title="Editar" onClick={(e) => { e.stopPropagation(); handleEditNecessidade(nec); }}><i className="bi bi-pencil-fill"></i></button>
                                    <button title="Excluir" onClick={(e) => { e.stopPropagation(); handleDeleteNecessidade(nec); }}><i className="bi bi-trash-fill"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="panel-display">
                    <div className="panel-header">
                        <h3>{nomeFiltro}</h3>
                        <button className="action-button add-button" onClick={handleGerenciarAlunosDaNecessidade} title="Gerenciar todos os alunos para a necessidade selecionada">
                            <i className="bi bi-people-fill"></i> Gerenciar Alunos
                        </button>
                    </div>
                    <div className="table-wrapper-planejamento">
                        <table className="planejamento-table">
                            <thead>
                                <tr>
                                    <th>Nome do Aluno</th>
                                    <th>RM</th>
                                    <th>Turma</th>
                                    {filtroNecessidadeId === 'todas' && <th className="coluna-necessidades-header">Necessidades Atuais</th>}
                                    {filtroNecessidadeId !== 'todas' && <th className="coluna-acoes">Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="4" style={{textAlign: 'center', padding: '40px'}}>Carregando...</td></tr>
                                ) : alunosFiltrados.length > 0 ? alunosFiltrados.map(aluno => (
                                    <tr key={aluno.id}>
                                        <td>{aluno.nome}</td>
                                        <td>{aluno.rm}</td>
                                        <td>{turmasMap[aluno.turmas_id] || 'N/A'}</td>
                                        {filtroNecessidadeId === 'todas' && (
                                            <td>
                                                <div className="necessidades-list-cell">
                                                    {(aluno.necessidades || []).map(nec => ( <span key={nec.id} className="necessidade-badge">{nec.necessidade}</span> ))}
                                                </div>
                                            </td>
                                        )}
                                        {filtroNecessidadeId !== 'todas' && (
                                            <td className="coluna-acoes">
                                                <button className="action-button-icon delete-button" title="Remover desta Necessidade" onClick={() => handleRemoverAssociacao(aluno)}>
                                                    <i className="bi bi-trash-fill"></i>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4">
                                        <div className="empty-state">
                                            <i className="bi bi-search"></i>
                                            <p>Nenhum aluno encontrado.</p>
                                        </div>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="planejamento-footer">
                <button className="action-button back-button" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
            </div>
        </div>
    );
};

export default PlanejamentoPage;