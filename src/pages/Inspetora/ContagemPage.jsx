import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { 
    getTurmas, getCronograma, getContagensDeHoje, getAlunos, getNecessidades, getNecessidadeComAlunos,
    addContagem, updateContagem, getAlunosContagemNes, addAlunoNaContagemNes, removeAlunoDaContagemNes
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
                        relationLookupMap.set(`aluno${aluno.id}-nec${nec.id}`, relacaoId);
                    }
                });
            });

            const alunosParaHoje = new Map();
            
            const necessidadeNai = necessidadesComAlunos.find(n => n.necessidade.toUpperCase() === 'NAI');
            if (necessidadeNai && necessidadeNai.alunos) {
                necessidadeNai.alunos.forEach(alunoNai => {
                    const alunoCompleto = todosAlunos.find(a => a.id === alunoNai.id);
                    const idDaJuncao = relationLookupMap.get(`aluno${alunoNai.id}-nec${necessidadeNai.id}`);
                    if (alunoCompleto && idDaJuncao) {
                        alunosParaHoje.set(idDaJuncao, {
                            alunoId: alunoCompleto.id, nome: alunoCompleto.nome, foto: alunoCompleto.foto,
                            turmas_id: alunoCompleto.turmas_id, necessidade: "NAI",
                            alunosHasNecessidadesId: idDaJuncao,
                        });
                    }
                });
            }

            const hojeIndex = new Date().getDay();
            const diaAtual = cronogramaData.data.find(dia => dia.dia === diaDaSemanaMap[hojeIndex]);
            if (diaAtual) {
                (diaAtual.alunos || []).forEach(alunoAgendado => {
                    if (!alunoAgendado.necessidade_relacionada) return;
                    
                    const alunoCompleto = todosAlunos.find(a => a.id === alunoAgendado.id);
                    const idDaJuncao = relationLookupMap.get(`aluno${alunoAgendado.id}-nec${alunoAgendado.necessidade_relacionada.id}`);
                    
                    if(alunoCompleto && idDaJuncao && !alunosParaHoje.has(idDaJuncao)) {
                        alunosParaHoje.set(idDaJuncao, {
                            alunoId: alunoCompleto.id, nome: alunoCompleto.nome, foto: alunoCompleto.foto,
                            turmas_id: alunoCompleto.turmas_id, necessidade: alunoAgendado.necessidade_relacionada.necessidade,
                            alunosHasNecessidadesId: idDaJuncao,
                        });
                    }
                });
            }
            
            setAlunosComRestricao(Array.from(alunosParaHoje.values()));

        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const totalContagem = useMemo(() => {
        return Object.values(contagens).reduce((total, cont) => total + (parseInt(cont.qtd_contagem, 10) || 0), 0);
    }, [contagens]);

    const abrirLightbox = (aluno) => {
        Swal.fire({
            imageUrl: aluno.foto ? `${PUBLIC_STORAGE_URL}/storage/${aluno.foto}` : placeholderAvatar,
            imageAlt: aluno.nome,
            title: aluno.nome,
            showConfirmButton: false,
            background: 'rgba(0,0,0,0.8)',
            backdrop: true,
        });
    };
    
    const handleOpenModal = async (turma) => {
        let contagem = contagens[turma.id];

        if (!contagem) {
            try {
                Swal.showLoading();
                const novaContagem = await addContagem({ qtd_contagem: 0, turmas_id: turma.id });
                if (!novaContagem || !novaContagem.id) throw new Error("API não retornou a nova contagem.");
                contagem = novaContagem;
                setContagens(prev => ({...prev, [turma.id]: contagem}));
                Swal.close();
            } catch (error) {
                Swal.fire('Erro!', 'Não foi possível iniciar a contagem para esta turma.', 'error');
                return;
            }
        }
        
        const alunosDaTurma = alunosComRestricao.filter(aluno => aluno.turmas_id === turma.id);
        
        let alunosConfirmadosMap = new Map();
        try {
            const contagemNesData = await getAlunosContagemNes(contagem.id);
            (contagemNesData.data || []).forEach(item => {
                alunosConfirmadosMap.set(item.alunos_has_necessidades_id, item.id);
            });
        } catch (e) { console.error("Não foi possível carregar alunos confirmados.", e); }

        const restricoesHtml = alunosDaTurma.length > 0
            ? `<div class="container-restricoes">` +
              alunosDaTurma.map(aluno => {
                const isConfirmed = alunosConfirmadosMap.has(aluno.alunosHasNecessidadesId);
                return `
                    <div class="card-aluno ${isConfirmed ? 'verde' : ''}" id="card-aluno-${aluno.alunosHasNecessidadesId}">
                        <img src="${aluno.foto ? `${PUBLIC_STORAGE_URL}/storage/${aluno.foto}` : placeholderAvatar}" alt="${aluno.nome}" class="foto-aluno" data-aluno-id="${aluno.alunoId}">
                        <div class="info-aluno">
                            <span>${aluno.nome}<br><small>${aluno.necessidade}</small></span>
                            <button type="button" class="btn-toggle-status ${isConfirmed ? 'confirmado' : ''}" data-id="${aluno.alunosHasNecessidadesId}">
                                ${isConfirmed ? 'Não' : 'Sim'}
                            </button>
                        </div>
                    </div>
                `;
              }).join('') + `</div>`
            : '<p class="swal-no-restricoes">Nenhuma necessidade especial para esta turma hoje.</p>';

        Swal.fire({
            title: `Contagem - ${turma.nome_turma}`,
            html: `
              <div class="swal-qtd-control">
                  <button id="swal-btn-minus" class="swal-qtd-button" type="button">-</button>
                  <input id="swal-qtd" type="number" class="swal-qtd-input" value="${contagem.qtd_contagem}" min="0">
                  <button id="swal-btn-plus" class="swal-qtd-button" type="button">+</button>
              </div>
              ${restricoesHtml}
            `,
            showCancelButton: false,
            confirmButtonText: 'Salvar e Fechar',
            didOpen: () => {
                const qtdInput = document.getElementById('swal-qtd');
                document.getElementById('swal-btn-minus').onclick = () => { qtdInput.value = Math.max(0, parseInt(qtdInput.value) - 1); };
                document.getElementById('swal-btn-plus').onclick = () => { qtdInput.value = parseInt(qtdInput.value) + 1; };

                document.querySelectorAll('.btn-toggle-status').forEach(button => {
                    button.onclick = async () => {
                        const isCurrentlyConfirmed = button.classList.contains('confirmado');
                        const alunoHasNecessidadeId = parseInt(button.dataset.id, 10);
                        const card = document.getElementById(`card-aluno-${alunoHasNecessidadeId}`);
                        
                        button.disabled = true;

                        try {
                            if (isCurrentlyConfirmed) {
                                const contagemNesId = alunosConfirmadosMap.get(alunoHasNecessidadeId);
                                if (contagemNesId) {
                                    await removeAlunoDaContagemNes(contagemNesId);
                                    alunosConfirmadosMap.delete(alunoHasNecessidadeId);
                                    button.classList.remove('confirmado');
                                    card.classList.remove('verde');
                                    button.textContent = 'Sim';
                                }
                            } else {
                                const novoRegistro = await addAlunoNaContagemNes(alunoHasNecessidadeId);
                                if (novoRegistro && novoRegistro.id) {
                                    alunosConfirmadosMap.set(alunoHasNecessidadeId, novoRegistro.id);
                                }
                                button.classList.add('confirmado');
                                card.classList.add('verde');
                                button.textContent = 'Não';
                            }
                        } catch (err) {
                            console.error("Falha ao atualizar status:", err);
                        } finally {
                            button.disabled = false;
                        }
                    };
                });
                
                document.querySelectorAll('.foto-aluno').forEach(foto => {
                    foto.onclick = () => {
                        const alunoId = parseInt(foto.dataset.alunoId, 10);
                        const aluno = alunosDaTurma.find(a => a.alunoId === alunoId);
                        if(aluno) abrirLightbox(aluno);
                    };
                });
            },
            preConfirm: () => {
                return document.getElementById('swal-qtd').value;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const qtd_contagem = result.value;
                try {
                    Swal.showLoading();
                    await updateContagem(contagem.id, { qtd_contagem });
                    await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Contagem salva!', timer: 1500, showConfirmButton: false});
                    fetchData();
                } catch (error) {
                    if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', `Não foi possível salvar a contagem.`, 'error');
                }
            }
        });
    };

    return (
        <main className="contar">
            <div className="buttons-container">
                {isLoading ? <p style={{textAlign: 'center', gridColumn: '1 / -1'}}>Carregando turmas...</p> : (
                    <>
                        {turmas.map(turma => (
                            <button 
                                key={turma.id}
                                className={`main-button ${contagens[turma.id] ? 'contado' : ''}`}
                                onClick={() => handleOpenModal(turma)}
                            >
                                <i className='bi bi-people-fill'></i> 
                                {turma.nome_turma}
                            </button>
                        ))}
                        <div className="total-card">
                            <span className="total-label">Total do Dia</span>
                            <span className="total-value">{totalContagem}</span>
                        </div>
                    </>
                )}
            </div>
            <button className="back-button" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left"></i> Voltar
            </button>
        </main>
    );
};

export default ContagemPage;