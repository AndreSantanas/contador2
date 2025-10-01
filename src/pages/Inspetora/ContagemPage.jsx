import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { 
    getTurmas, getCronograma, getContagensDeHoje, getAlunos, getNecessidades, getNecessidadeComAlunos,
    addContagem, updateContagem, setAlunosContagemNes, getAlunosContagemNes
} from '../../services/api';
import { PUBLIC_STORAGE_URL } from '../../config/apiConfig';
import placeholderAvatar from '../../assets/img/avatar.png';
import './ContagemPage.css';

const ContagemPage = () => {
    const [turmas, setTurmas] = useState([]);
    const [contagens, setContagens] = useState({});
    const [alunosComRestricao, setAlunosComRestricao] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const diaDaSemanaMap = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [turmasData, cronogramaData, contagensData, alunosData, necessidadesData] = await Promise.all([
                getTurmas(1, 100), getCronograma(), getContagensDeHoje(),
                getAlunos(1, 1000), getNecessidades(1, 100)
            ]);

            setTurmas(turmasData.data || []);
            const contagensMap = (contagensData.data || []).reduce((map, contagem) => {
                map[contagem.turmas_id] = contagem;
                return map;
            }, {});
            setContagens(contagensMap);

            const todosAlunos = alunosData.data || [];
            const listaNecessidades = necessidadesData.data || [];

            const relationLookupMap = new Map();
            const necessidadesComAlunos = await Promise.all(listaNecessidades.map(nec => getNecessidadeComAlunos(nec.id)));
            necessidadesComAlunos.forEach(nec => {
                (nec.alunos || []).forEach(aluno => {
                    const relacaoId = aluno.pivot?.id;
                    if (relacaoId) {
                        const lookupKey = `aluno${aluno.id}-nec${nec.id}`;
                        relationLookupMap.set(lookupKey, relacaoId);
                    }
                });
            });

            const hojeIndex = new Date().getDay();
            const diaAtual = cronogramaData.data.find(dia => dia.dia === diaDaSemanaMap[hojeIndex]);
            
            if (diaAtual) {
                const alunosDoDia = (diaAtual.alunos || []).map(alunoAgendado => {
                    if (!alunoAgendado || !alunoAgendado.necessidade_relacionada) return null;
                    const alunoCompleto = todosAlunos.find(a => a.id === alunoAgendado.id);
                    const lookupKey = `aluno${alunoAgendado.id}-nec${alunoAgendado.necessidade_relacionada.id}`;
                    const idDaJuncao = relationLookupMap.get(lookupKey);
                    if (!alunoCompleto || !idDaJuncao) return null;
                    return {
                        alunoId: alunoCompleto.id, nome: alunoCompleto.nome, foto: alunoCompleto.foto,
                        turmas_id: alunoCompleto.turmas_id, necessidade: alunoAgendado.necessidade_relacionada.necessidade,
                        alunosHasNecessidadesId: idDaJuncao,
                    };
                }).filter(Boolean);
                setAlunosComRestricao(alunosDoDia);
            }
        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const totalContagem = useMemo(() => {
        return Object.values(contagens).reduce((total, cont) => total + (parseInt(cont.qtd_contagem, 10) || 0), 0);
    }, [contagens]);

    const handleOpenModal = async (turma) => {
        const contagemExistente = contagens[turma.id];
        const isEditing = !!contagemExistente;
        const alunosDaTurmaComRestricao = alunosComRestricao.filter(aluno => aluno.turmas_id === turma.id);

        let alunosNesConfirmados = new Set();
        if (isEditing) {
            try {
                const contagemNesData = await getAlunosContagemNes(contagemExistente.id);
                (contagemNesData.data || []).forEach(item => alunosNesConfirmados.add(item.alunos_has_necessidades_id));
            } catch (e) {
                console.error("Não foi possível carregar alunos confirmados.", e);
            }
        }

        const restricoesHtml = alunosDaTurmaComRestricao.length > 0
            ? `<h4 class="swal-restricoes-title">Alunos com Necessidades Hoje</h4>` +
              alunosDaTurmaComRestricao.map(aluno => `
                <label class="swal-aluno-item" for="aluno-nes-${aluno.alunosHasNecessidadesId}">
                    <img src="${aluno.foto ? `${PUBLIC_STORAGE_URL}/storage/${aluno.foto}` : placeholderAvatar}" alt="${aluno.nome}" class="swal-aluno-avatar">
                    <div class="swal-aluno-info">
                        <span class="swal-aluno-nome">${aluno.nome}</span>
                        <span class="swal-aluno-necessidade">${aluno.necessidade}</span>
                    </div>
                    <input type="checkbox" class="swal-aluno-checkbox" value="${aluno.alunosHasNecessidadesId}" id="aluno-nes-${aluno.alunosHasNecessidadesId}" ${alunosNesConfirmados.has(aluno.alunosHasNecessidadesId) ? 'checked' : ''}>
                </label>
            `).join('')
            : '<p class="swal-no-restricoes">Nenhuma necessidade especial agendada para esta turma hoje.</p>';

        Swal.fire({
            title: `Contagem - ${turma.nome_turma}`,
            width: '600px',
            html: `
                <div class="swal-contagem-container">
                    <div class="swal-qtd-control">
                        <button id="swal-btn-minus" class="swal-qtd-button" type="button">-</button>
                        <input id="swal-qtd" type="number" class="swal-qtd-input" value="${isEditing ? contagemExistente.qtd_contagem : 0}" min="0">
                        <button id="swal-btn-plus" class="swal-qtd-button" type="button">+</button>
                    </div>
                    <div class="swal-restricoes-container">${restricoesHtml}</div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: isEditing ? 'Salvar Edição' : 'Salvar Contagem',
            confirmButtonColor: '#28a745',
            didOpen: () => {
                const qtdInput = document.getElementById('swal-qtd');
                document.getElementById('swal-btn-minus').onclick = () => { qtdInput.value = Math.max(0, parseInt(qtdInput.value) - 1); };
                document.getElementById('swal-btn-plus').onclick = () => { qtdInput.value = parseInt(qtdInput.value) + 1; };
            },
            preConfirm: () => {
                const qtd_contagem = document.getElementById('swal-qtd').value;
                const alunosConfirmadosIds = [];
                alunosDaTurmaComRestricao.forEach(aluno => {
                    const checkbox = document.getElementById(`aluno-nes-${aluno.alunosHasNecessidadesId}`);
                    if (checkbox?.checked) { alunosConfirmadosIds.push(checkbox.value); }
                });
                if (!qtd_contagem || parseInt(qtd_contagem) < 0) {
                    Swal.showValidationMessage('A quantidade deve ser um número válido.');
                    return false;
                }
                return { qtd_contagem, alunosConfirmadosIds, turmas_id: turma.id };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { qtd_contagem, alunosConfirmadosIds, turmas_id } = result.value;
                try {
                    Swal.showLoading();
                    let contagemSalva;
                    if (isEditing) {
                        contagemSalva = await updateContagem(contagemExistente.id, { qtd_contagem });
                        contagemSalva = { ...contagemSalva, id: contagemExistente.id };
                    } else {
                        contagemSalva = await addContagem({ qtd_contagem, turmas_id });
                    }

                    const contagemId = contagemSalva?.id;
                    if (!contagemId) throw new Error("Não foi possível obter o ID da contagem salva.");

                    await setAlunosContagemNes(contagemId, alunosConfirmadosIds);
                    await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Contagem salva!', timer: 1500, showConfirmButton: false});
                    fetchData();
                } catch (error) {
                    if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', `Não foi possível salvar. ${error.message}`, 'error');
                }
            }
        });
    };

    return (
        <section className="contagem-container">
            <div className="contagem-header">
                <h1>Contagem do Dia</h1>
                <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
            </div>
            {isLoading ? <p style={{textAlign: 'center', padding: '40px'}}>Carregando...</p> : (
                <div className="turmas-grid">
                    {turmas.map(turma => (
                        <button 
                            key={turma.id}
                            className={`turma-button ${contagens[turma.id] ? 'contado' : ''}`}
                            onClick={() => handleOpenModal(turma)}
                        >
                            <span className="turma-button-nome">{turma.nome_turma}</span>
                            {contagens[turma.id] && <span className="turma-button-qtd">{contagens[turma.id].qtd_contagem}</span>}
                        </button>
                    ))}
                    <div className="total-card">
                        <span className="total-label">Total</span>
                        <span className="total-value">{totalContagem}</span>
                    </div>
                </div>
            )}
            <div className="contagem-footer">
                <button className="action-button back-button" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
            </div>
        </section>
    );
};

export default ContagemPage;