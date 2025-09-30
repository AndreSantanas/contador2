import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { 
    getNecessidades, getNecessidadeComAlunos, addNecessidade, updateNecessidade, deleteNecessidade, 
    getAlunos, getTurmas, associarNecessidadesAoAluno 
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
                getNecessidades(1, 100),
                getAlunos(1, 500),
                getTurmas(1, 100)
            ]);
            
            const listaNecessidades = necessidadesData.data || [];
            setNecessidades(listaNecessidades);
            setTodosAlunos(alunosData.data || []);
            setTurmas(turmasData.data || []);

            if (listaNecessidades.length > 0) {
                const promises = listaNecessidades.map(nec => getNecessidadeComAlunos(nec.id));
                const resultados = await Promise.all(promises);
                
                const dadosEstruturados = resultados.filter(Boolean).map(nec => {
                    const alunosUnicos = new Map();
                    (nec.alunos || []).forEach(aluno => alunosUnicos.set(aluno.id, aluno));
                    return { ...nec, alunos: Array.from(alunosUnicos.values()) };
                });

                setDadosCompletos(dadosEstruturados);
            } else {
                setDadosCompletos([]);
            }
        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) {
                Swal.fire('Erro!', 'Não foi possível carregar os dados de planejamento.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const alunosFiltrados = useMemo(() => {
        if (filtroNecessidadeId === 'todas') {
            const alunosMap = new Map();
            dadosCompletos.forEach(nec => {
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
        return necessidadeSelecionada?.alunos || [];
    }, [filtroNecessidadeId, dadosCompletos, todosAlunos]);

    const handleAddNecessidade = async () => {
        const { value: nomeNecessidade } = await Swal.fire({
            title: 'Criar Nova Necessidade', input: 'text', inputPlaceholder: 'Nome da Necessidade',
            showCancelButton: true, confirmButtonText: 'Criar', confirmButtonColor: '#28a745',
            inputValidator: (value) => !value && 'Você precisa digitar um nome!'
        });

        if (nomeNecessidade) {
            try {
                await addNecessidade(nomeNecessidade);
                await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Necessidade criada.', timer: 1500, showConfirmButton: false});
                fetchData();
            } catch (error) { if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível criar a necessidade.', 'error'); }
        }
    };

    const handleEditNecessidade = async (necessidade) => {
        const { value: novoNome } = await Swal.fire({
            title: 'Editar Necessidade', input: 'text', inputValue: necessidade.necessidade,
            showCancelButton: true, confirmButtonText: 'Salvar', confirmButtonColor: '#28a745',
            inputValidator: (value) => !value && 'O nome não pode ser vazio!'
        });

        if (novoNome && novoNome !== necessidade.necessidade) {
            try {
                await updateNecessidade(necessidade.id, novoNome);
                await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Necessidade atualizada.', timer: 1500, showConfirmButton: false});
                fetchData();
            } catch (error) { if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível atualizar a necessidade.', 'error'); }
        }
    };

    const handleDeleteNecessidade = async (necessidade) => {
        const result = await Swal.fire({
            title: 'Tem certeza?', text: `A necessidade "${necessidade.necessidade}" será removida.`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, deletar!', cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteNecessidade(necessidade.id);
                await Swal.fire({icon: 'success', title: 'Deletado!', text: 'Necessidade removida.', timer: 1500, showConfirmButton: false});
                setFiltroNecessidadeId('todas');
                fetchData();
            } catch (error) { if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover a necessidade.', 'error'); }
        }
    };

    const handleRemoverAssociacao = async (aluno) => {
        if (filtroNecessidadeId === 'todas') return;
        const necessidadeAtual = necessidades.find(n => n.id === filtroNecessidadeId);
        const result = await Swal.fire({
            title: 'Remover Associação', html: `Tem certeza que deseja remover <strong>${aluno.nome}</strong> da necessidade <strong>${necessidadeAtual.necessidade}</strong>?`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, remover!', cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const alunoCompleto = todosAlunos.find(a => a.id === aluno.id);
                const necessidadesAtuaisIds = (alunoCompleto?.necessidades || []).map(n => n.id);
                const novasNecessidades = necessidadesAtuaisIds.filter(id => id !== filtroNecessidadeId);
                
                await associarNecessidadesAoAluno(aluno.id, novasNecessidades);
                await Swal.fire({icon: 'success', title: 'Removido!', text: 'Associação removida com sucesso.', timer: 1500, showConfirmButton: false});
                fetchData();
            } catch (error) { if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover a associação.', 'error'); }
        }
    };

    const handleGerenciarAlunosDaNecessidade = async () => {
        if (filtroNecessidadeId === 'todas') {
          Swal.fire('Atenção', 'Por favor, selecione uma necessidade na lista à esquerda para poder gerenciar os alunos.', 'info');
          return;
        }
    
        const necessidadeAtual = necessidades.find(n => n.id === filtroNecessidadeId);
        const alunosAtuaisDaNecessidade = (dadosCompletos.find(nec => nec.id === filtroNecessidadeId)?.alunos || []).map(a => a.id);
    
        const checkboxesHtml = todosAlunos.map(aluno => `
          <div class="swal-checkbox-item">
            <input type="checkbox" id="aluno-${aluno.id}" value="${aluno.id}" ${alunosAtuaisDaNecessidade.includes(aluno.id) ? 'checked' : ''}>
            <label for="aluno-${aluno.id}">${aluno.nome}</label>
          </div>
        `).join('');
    
        const { value: confirmed } = await Swal.fire({
          title: `Selecionar Alunos para: ${necessidadeAtual.necessidade}`, html: `<div class="swal-checkbox-container">${checkboxesHtml}</div>`,
          width: '600px', showCancelButton: true, confirmButtonText: 'Salvar Alterações',
          confirmButtonColor: '#28a745', focusConfirm: false,
        });
    
        if (confirmed) {
          const selectedIds = [];
          todosAlunos.forEach(aluno => {
            const checkbox = document.getElementById(`aluno-${aluno.id}`);
            if (checkbox && checkbox.checked) { selectedIds.push(aluno.id); }
          });
    
          const alunosParaAtualizar = todosAlunos.filter(aluno => {
              const isSelected = selectedIds.includes(aluno.id);
              const isAlreadyIn = alunosAtuaisDaNecessidade.includes(aluno.id);
              return isSelected !== isAlreadyIn;
          });
    
          const updatePromises = alunosParaAtualizar.map(aluno => {
            let necessidadesDoAlunoIds = (todosAlunos.find(a => a.id === aluno.id)?.necessidades || []).map(n => n.id);
            const isSelected = selectedIds.includes(aluno.id);
    
            if (isSelected) { necessidadesDoAlunoIds.push(filtroNecessidadeId); } 
            else { necessidadesDoAlunoIds = necessidadesDoAlunoIds.filter(id => id !== filtroNecessidadeId); }
            return associarNecessidadesAoAluno(aluno.id, necessidadesDoAlunoIds);
          });
    
          try {
            Swal.showLoading();
            await Promise.all(updatePromises);
            await Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Alunos atualizados com sucesso!', timer: 1500, showConfirmButton: false });
            fetchData();
          } catch (error) { if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Ocorreu um erro ao atualizar os alunos.', 'error'); }
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
                                    {filtroNecessidadeId !== 'todas' && <th className="coluna-acoes">Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={filtroNecessidadeId !== 'todas' ? 4 : 3} style={{textAlign: 'center', padding: '40px'}}>Carregando...</td></tr>
                                ) : alunosFiltrados.length > 0 ? alunosFiltrados.map(aluno => {
                                    const alunoCompleto = todosAlunos.find(a => a.id === aluno.id) || aluno;
                                    return (
                                    <tr key={aluno.id}>
                                        <td>{alunoCompleto.nome}</td>
                                        <td>{alunoCompleto.rm}</td>
                                        <td>{turmasMap[alunoCompleto.turmas_id] || 'N/A'}</td>
                                        {filtroNecessidadeId !== 'todas' && (
                                            <td className="coluna-acoes">
                                                <button className="action-button-icon delete-button" title="Remover desta Necessidade" onClick={() => handleRemoverAssociacao(alunoCompleto)}>
                                                    <i className="bi bi-trash-fill"></i>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )}) : (
                                    <tr><td colSpan={filtroNecessidadeId !== 'todas' ? 4 : 3}>
                                        <div className="empty-state">
                                            <i className="bi bi-search"></i>
                                            <p>Nenhum aluno encontrado para este filtro.</p>
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