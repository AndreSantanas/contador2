import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import {
    getTurmas,
    getContagensDeHoje,
    getNecessidades,
    getNecessidadeComAlunos,
    getCronograma,
    addContagem,
    updateContagem,
    getAlunosContagemNes,
    addAlunoNaContagemNes,
    removeAlunoDaContagemNes
} from '../../services/api';
import { PUBLIC_STORAGE_URL } from '../../config/apiConfig';
import placeholderAvatar from '../../assets/img/avatar.png';
import './ContagemPage.css'; // Importa o novo CSS

const ContagemPage = () => {
    // Estados do componente (sem alterações)
    const [turmas, setTurmas] = useState([]);
    const [contagens, setContagens] = useState([]);
    const [necessidades, setNecessidades] = useState([]);
    const [alunosNesDeHoje, setAlunosNesDeHoje] = useState([]); 
    const [idsAlunosNoCronograma, setIdsAlunosNoCronograma] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);

    // Função para carregar dados iniciais ou re-sincronizar
    const carregarDados = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [turmasRes, contagensRes, necessidadesRes, cronogramaRes, alunosNesRes] = await Promise.all([
                getTurmas(),
                getContagensDeHoje(),
                getNecessidades(),
                getCronograma(),
                getAlunosContagemNes() // Pega TODOS os registros NES do dia
            ]);

            setTurmas(turmasRes.data || []);
            setContagens(contagensRes.data || []);
            setNecessidades(necessidadesRes.data || []);
            // A API retorna o formato: { id: 115, aluno: { id: 5, nome: '...' } }
            setAlunosNesDeHoje(alunosNesRes.data || []); 

            const diasDaSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
            const hojeIndex = new Date().getDay();
            const nomeDoDiaHoje = diasDaSemana[hojeIndex]; 
            const cronogramaDeHoje = (cronogramaRes.data || []).find(dia => dia.dia === nomeDoDiaHoje);
            let idsDeHoje = new Set();
            if (cronogramaDeHoje && cronogramaDeHoje.alunos) {
                cronogramaDeHoje.alunos.forEach(aluno => {
                    if (aluno && aluno.id) idsDeHoje.add(aluno.id);
                });
            }
            setIdsAlunosNoCronograma(idsDeHoje);

        } catch (error) {
            console.error("Erro no carregamento de dados:", error);
            if (!error.message.includes("Sessão expirada")) {
                Swal.fire('Erro!', 'Não foi possível carregar os dados essenciais da página.', 'error');
            }
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // Cálculos derivados do estado
    const totalGeral = useMemo(() => contagens.reduce((sum, c) => sum + Number(c?.qtd_contagem || 0), 0), [contagens]);
    
    // Esta função é inteligente para lidar com duplicatas (se existirem)
    const getContagemDaTurma = useCallback((turmaId) => {
        const contagensDaTurmaHoje = contagens.filter(c => c.turmas_id === turmaId && c.data_contagem === hoje);
        if (contagensDaTurmaHoje.length === 0) return null;
        if (contagensDaTurmaHoje.length === 1) return contagensDaTurmaHoje[0];

        // Se houver duplicatas, prioriza a que tem filhos
        const idsComFilhos = new Set(alunosNesDeHoje.map(nes => nes.contagem_id));
        const contagemComFilhos = contagensDaTurmaHoje.find(c => idsComFilhos.has(c.id) || idsComFilhos.has(String(c.id)));

        return contagemComFilhos || contagensDaTurmaHoje[0];

    }, [contagens, hoje, alunosNesDeHoje]); 

    // Função principal para abrir o modal
    const abrirModalContagem = async (turma) => {
        let contagemAtual = getContagemDaTurma(turma.id); // Variável LOCAL
        const isCreatingContagem = !contagemAtual; 
        const quantidadeInicial = isCreatingContagem ? 32 : contagemAtual.qtd_contagem;

        Swal.fire({
            title: 'Preparando Contagem...',
            text: `Buscando dados para a turma ${turma.nome_turma}`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            // 1. Filtrar alunos elegíveis para o modal (NAI/Cronograma)
            const necessidadesComAlunos = await Promise.all(
                necessidades.map(n => getNecessidadeComAlunos(n.id))
            );
            let alunosParaExibir = []; 
            necessidadesComAlunos.forEach(nec => {
                (nec.alunos || []).forEach(aluno => {
                    // Este 'joinId' é o 'alunos_has_necessidades_id'
                    const joinId = aluno.pivot?.id; 
                    if (aluno.turmas_id === turma.id && joinId) {
                        if (nec.necessidade.toUpperCase() === 'NAI' || idsAlunosNoCronograma.has(aluno.id)) {
                            alunosParaExibir.push({
                                ...aluno,
                                necessidade_id: nec.id,
                                necessidade_nome: nec.necessidade,
                                alunos_has_necessidades_id: joinId 
                            });
                        }
                    }
                });
            });

            // 2. Lógica de Criação Automática vs. Leitura do Estado Atual
            let mapaAlunosAtivosModal = new Map(); 
            let dadosNesParaRenderizar = [...alunosNesDeHoje];

            // Se for a PRIMEIRA VEZ e houver alunos a exibir
            if (isCreatingContagem && alunosParaExibir.length > 0) {
                // a. Crie a contagem principal ANTES
                 try {
                    const novaContagemResponse = await addContagem({ quantidade: quantidadeInicial, turmaId: turma.id });
                    contagemAtual = novaContagemResponse.data || novaContagemResponse; 
                    if (!contagemAtual) throw new Error("Falha ao criar contagem principal inicial.");
                    setContagens(prev => [...prev, contagemAtual]); 
                } catch (err) {
                    throw new Error(`Erro ao criar contagem principal: ${err.message}`);
                }

                // b. Crie todos os 'contagem_nes'
                try {
                    // Pega os IDs (ahp_id) que já existem HOJE (conforme sua lógica)
                    const nesExistentes = new Set(
                        alunosNesDeHoje.map(nes => nes.aluno.id) 
                    );
                    const nesParaCriar = alunosParaExibir.filter(
                        aluno => !nesExistentes.has(aluno.alunos_has_necessidades_id)
                    );

                    if (nesParaCriar.length > 0) {
                        const promessasCriacao = nesParaCriar.map(aluno =>
                            addAlunoNaContagemNes(contagemAtual.id, aluno.alunos_has_necessidades_id) 
                        );
                        await Promise.all(promessasCriacao);
                    }
                } catch (createError) {
                    console.error("Erro na criação automática de NES:", createError);
                }

                // d. DEPOIS que tudo for criado, BUSQUE NOVAMENTE
                try {
                    const alunosNesRes = await getAlunosContagemNes(); // Re-busca a "verdade"
                    dadosNesParaRenderizar = alunosNesRes.data || []; 
                    setAlunosNesDeHoje(dadosNesParaRenderizar); 
                } catch (fetchError) {
                    console.error("Erro ao re-buscar NES:", fetchError);
                    throw new Error(`Erro ao buscar dados pós-criação: ${fetchError.message}`);
                }
            }
            
            // 3. Preencher o Mapa (Sempre acontece, seja criação ou edição)
            // Esta é a lógica correta que você descobriu
            dadosNesParaRenderizar.forEach(nes => {
                // nes.aluno.id é o 'alunos_has_necessidades_id' (conforme sua info)
                // nes.id é o ID da tabela 'contagem_nes' (para o delete)
                if (nes.aluno && nes.aluno.id) {
                    mapaAlunosAtivosModal.set(nes.aluno.id, nes.id);
                }
            });
            // Agora o mapa está correto, e os botões ficarão verdes.

            // 4. Montar e Exibir o Modal (COM AS NOVAS CLASSES CSS)
            await Swal.fire({
                 title: `Contagem - ${turma.nome_turma}`,
                 html: `
                   <div class="contador">
                       <button id="menos" class="btn-contador" aria-label="Diminuir">-</button>
                       
                       <input type="number" id="contadorValor" class="contador-input" value="${quantidadeInicial}" min="0"/>
                       
                       <button id="mais" class="btn-contador" aria-label="Aumentar">+</button>
                   </div>
                   ${alunosParaExibir.length > 0 ? `
                       <h3 class="titulo-nes">Necessidades Especiais</h3>
                       <div class="lista-nes">
                           ${necessidades.map(n => {
                               const alunosDoGrupo = alunosParaExibir.filter(a => a.necessidade_id === n.id);
                               if (alunosDoGrupo.length === 0) return '';
                               return `
                                   <div class="nes-group">
                                       <h4>${n.necessidade}</h4>
                                       ${alunosDoGrupo.map(a => `
                                           
                                           <div class="nes-item ${mapaAlunosAtivosModal.has(a.alunos_has_necessidades_id) ? 'ativo' : ''}" 
                                                id="nes-item-${a.alunos_has_necessidades_id}">
                                               <img src="${a.foto ? `${PUBLIC_STORAGE_URL}/${a.foto}` : placeholderAvatar}" alt="${a.nome}">
                                               <span>${a.nome}</span>
                                               <label class="switch">
                                                   <input type="checkbox"
                                                       data-aluno-nes-id="${a.alunos_has_necessidades_id}"
                                                       
                                                       ${mapaAlunosAtivosModal.has(a.alunos_has_necessidades_id) ? 'checked' : ''}
                                                   >
                                                   <span class="slider"></span>
                                               </label>
                                           </div>
                                       `).join('')}
                                   </div>
                               `;
                           }).join('')}
                       </div>
                   ` : '<p>Nenhum aluno com necessidades especiais para exibir hoje.</p>'}
                 `,
                 confirmButtonText: 'Salvar',
                 confirmButtonColor: '#198754', // Mantém o verde para "Salvar"
                 showCancelButton: true,
                 cancelButtonText: 'Fechar',
                 cancelButtonColor: '#dc3545', // Mantém o vermelho para "Fechar"
                 reverseButtons: true,
                 width: 600,
                 didOpen: () => {
                     const contadorInput = document.getElementById('contadorValor');
                     // Os botões +/- agora são 'btn-contador'
                     document.getElementById('menos').onclick = () => { contadorInput.value = Math.max(0, parseInt(contadorInput.value || '0') - 1); };
                     document.getElementById('mais').onclick = () => { contadorInput.value = parseInt(contadorInput.value || '0') + 1; };

                     // Listener para os toggles (lógica intacta)
                     document.querySelectorAll('.nes-item input[type="checkbox"]').forEach(chk => {
                         chk.addEventListener('change', async (e) => {
                             const alunoNesId = parseInt(e.target.dataset.alunoNesId, 10);
                             const itemElement = e.target.closest('.nes-item');

                             // Garante que a contagem principal exista
                             if (!contagemAtual) {
                                 try {
                                     const qtdAtual = parseInt(document.getElementById('contadorValor').value) || (isCreatingContagem ? 32 : 0);
                                     const novaContagemResponse = await addContagem({ quantidade: qtdAtual, turmaId: turma.id });
                                     contagemAtual = novaContagemResponse.data || novaContagemResponse;
                                     if (!contagemAtual) throw new Error("Falha ao criar contagem de referência.");
                                     setContagens(prev => [...prev, contagemAtual]);
                                 } catch (err) {
                                     Swal.showValidationMessage(`Erro ao criar contagem principal: ${err.message}`);
                                     e.target.checked = !e.target.checked; return;
                                 }
                             }

                             // Salva ou remove o registro NES em tempo real
                             if (e.target.checked) {
                                 // Como o mapa agora está correto, isso previne duplicatas
                                 if (!mapaAlunosAtivosModal.has(alunoNesId)) { 
                                     try {
                                         const res = await addAlunoNaContagemNes(contagemAtual.id, alunoNesId);
                                         // A API addAluno... deve retornar { id, aluno: { id } } ou similar
                                         const novoRegistro = res.data || res;
                                         const novoContagemNesId = novoRegistro.id;
                                         const novoAlunoNesId = novoRegistro.aluno?.id || alunoNesId; // Garante

                                         if (novoContagemNesId) {
                                             mapaAlunosAtivosModal.set(novoAlunoNesId, novoContagemNesId); 
                                             itemElement.classList.add('ativo');
                                         } else { throw new Error("API não retornou ID ao criar NES."); }
                                     } catch (err) {
                                         console.error("Erro ao adicionar NES:", err);
                                         Swal.showValidationMessage(`Erro: ${err.message}`);
                                         e.target.checked = false; itemElement.classList.remove('ativo');
                                     }
                                 } else { 
                                    itemElement.classList.add('ativo'); 
                                 }
                             } else {
                                 // Remove o registro
                                 const idParaRemover = mapaAlunosAtivosModal.get(alunoNesId);
                                 if (idParaRemover) {
                                     try {
                                         await removeAlunoDaContagemNes(idParaRemover);
                                         mapaAlunosAtivosModal.delete(alunoNesId); 
                                         itemElement.classList.remove('ativo');
                                     } catch (err) {
                                         console.error("Erro ao remover NES:", err);
                                         Swal.showValidationMessage(`Erro: ${err.message}`);
                                         e.target.checked = true; itemElement.classList.add('ativo');
                                     }
                                 } else {
                                      console.warn("Tentativa de remover NES não encontrado:", alunoNesId);
                                      itemElement.classList.remove('ativo');
                                 }
                             }
                         });
                     });
                 },
                 
                // CORREÇÃO DAS DUPLICATAS DA 'Contagem' ao Salvar
                 preConfirm: () => {
                     return {
                         quantidadeFinal: parseInt(document.getElementById('contadorValor').value || '0', 10),
                         contagemOriginal: contagemAtual // <-- USA A VARIÁVEL LOCAL
                     }
                 }
            }).then(async (result) => {
                 // Bloco executado quando o modal fecha (por Salvar ou Fechar)
                 
                if (result.isConfirmed) {
                    const { quantidadeFinal, contagemOriginal } = result.value;
                    try {
                        if (contagemOriginal) { 
                             if (contagemOriginal.qtd_contagem !== quantidadeFinal) {
                                 await updateContagem(contagemOriginal.id, { quantidade: quantidadeFinal });
                             }
                        } else { 
                             if (quantidadeFinal > 0 || (isCreatingContagem && quantidadeFinal === 32)) {
                                 await addContagem({ quantidade: quantidadeFinal, turmaId: turma.id });
                             }
                        }
                        Swal.fire('Sucesso', 'Contagem salva!', 'success');
                    } catch (error) {
                         Swal.fire('Erro!', `Não foi possível salvar o número da contagem. <br><small>${error.message}</small>`, 'error');
                    }
                }
                
                // Recarrega os dados ao fechar para garantir sincronia
                carregarDados(false); 
            });
        } catch (error) {
            console.error("Erro ao abrir modal:", error);
            Swal.fire('Erro Fatal!', `Não foi possível processar a contagem. <br><small>${error.message}</small>`, 'error');
             setLoading(false); 
        }
    };

    if (loading) {
        return <div className="carregando"><div className="spinner"></div><p>Carregando dados...</p></div>;
    }

    return (
        <section className="contagem-section">
            <div className="total-geral">
                <div>
                    <i className="bi bi-people-fill"></i>
                    <span>Total de Alunos Hoje:</span>
                </div>
                <strong>{totalGeral}</strong>
            </div>
            <div className="turmas-grid">
                {turmas.map((turma) => {
                    const contagem = getContagemDaTurma(turma.id);
                    return (
                        <button
                            key={turma.id}
                            className={`turma-card ${contagem ? 'tem-contagem' : 'sem-contagem'}`}
                            onClick={() => abrirModalContagem(turma)}
                        >
                            <span className="turma-nome-display">{turma.nome_turma}</span>
                            <span className="turma-contagem-display">
                                {contagem ? `${contagem.qtd_contagem} alunos` : 'Fazer Contagem'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default ContagemPage;