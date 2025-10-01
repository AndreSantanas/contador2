import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getNecessidades, getNecessidadeComAlunos, getCronograma, agendarRelacaoNosDias, removerAgendamentoDoDia } from '../../services/api';
import './CronogramaPage.css';

const CronogramaPage = () => {
    const [boardState, setBoardState] = useState(null);
    const [allRelations, setAllRelations] = useState({});
    const [necessidades, setNecessidades] = useState([]);
    const [filterId, setFilterId] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            !boardState && setIsLoading(true);
            
            const [necessidadesResponse, cronogramaData] = await Promise.all([
                getNecessidades(1, 100),
                getCronograma(),
            ]);

            const listaNecessidades = necessidadesResponse.data || [];
            setNecessidades(listaNecessidades);
            
            const relationsMap = {};
            const relationLookupMap = new Map();

            const necessidadesComAlunos = await Promise.all(
                listaNecessidades.map(nec => getNecessidadeComAlunos(nec.id))
            );
            
            necessidadesComAlunos.forEach(nec => {
                (nec.alunos || []).forEach(aluno => {
                    const relacaoId = aluno.pivot?.id;
                    if (!relacaoId) return;
                    
                    const relacaoKey = `rel-${relacaoId}`;
                    const lookupKey = `aluno${aluno.id}-nec${nec.id}`;

                    relationsMap[relacaoKey] = {
                        id: relacaoKey,
                        content: `${aluno.nome} - ${nec.necessidade}`,
                        relacaoId: relacaoId,
                        necessidadeId: nec.id,
                    };
                    relationLookupMap.set(lookupKey, relacaoKey);
                });
            });
            setAllRelations(relationsMap);

            const columns = {};
            const diasDaSemana = (cronogramaData.data || []);
            diasDaSemana.forEach(dia => {
                columns[dia.id] = { id: String(dia.id), title: dia.dia, itemIds: [] };
                
                // =========================================================
                // CORREÇÃO FINAL: Lendo a nova estrutura com "necessidade_relacionada"
                // =========================================================
                (dia.alunos || []).forEach(alunoAgendado => {
                    if (!alunoAgendado || !alunoAgendado.necessidade_relacionada) return;

                    const alunoId = alunoAgendado.id;
                    const necessidadeId = alunoAgendado.necessidade_relacionada.id;

                    const lookupKey = `aluno${alunoId}-nec${necessidadeId}`;
                    const relacaoKey = relationLookupMap.get(lookupKey);

                    if (relacaoKey) {
                        const occurrenceId = `${relacaoKey}-occurrence-${dia.id}-${Math.random()}`;
                        columns[dia.id].itemIds.push({ id: occurrenceId, originalId: relacaoKey });
                    }
                });
            });
            
            setBoardState({
                columns,
                columnOrder: diasDaSemana.map(d => String(d.id)),
            });

        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredSourceItems = useMemo(() => {
        const relationsArray = Object.values(allRelations);
        if (filterId === 'all') return relationsArray;
        return relationsArray.filter(rel => rel.necessidadeId === filterId);
    }, [filterId, allRelations]);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index) || destination.droppableId === 'source') {
            return;
        }

        const isCopying = source.droppableId === 'source';
        const relation = isCopying ? allRelations[draggableId] : allRelations[draggableId.split('-occurrence-')[0]];
        if (!relation) return;
        
        const diaDeDestino = [parseInt(destination.droppableId)];

        try {
            Swal.showLoading();
            await agendarRelacaoNosDias(relation.relacaoId, diaDeDestino);
            
            if (!isCopying) {
                await removerAgendamentoDoDia(relation.relacaoId, parseInt(source.droppableId));
            }

            await Swal.close();
            fetchData();
        } catch (error) {
            Swal.close();
            if (error.message.includes('Duplicate entry')) {
                 Swal.fire('Atenção!', 'Este aluno já está agendado neste dia.', 'warning');
            } else if (error.message && !error.message.includes('Sessão expirada')) {
                Swal.fire('Erro!', 'Não foi possível salvar o agendamento.', 'error');
            }
            if (!error.message.includes('Duplicate entry')) {
                fetchData();
            }
        }
    };

    const handleDelete = async (itemOccurrence, columnId) => {
        if(!itemOccurrence || !itemOccurrence.originalId) return;

        const relation = allRelations[itemOccurrence.originalId];
        if(!relation) return;
        
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: `Remover "${relation.content}" de ${boardState.columns[columnId].title}?`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, remover!', cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                Swal.showLoading();
                await removerAgendamentoDoDia(relation.relacaoId, parseInt(columnId));
                await Swal.close();
                fetchData();
            } catch (error) { 
                if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover o agendamento.', 'error'); 
            }
        }
    };

    if (isLoading) return <div className="loading-message">Carregando cronograma...</div>;

    return (
        <section className="cronograma-container">

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="cronograma-board-wrapper">
                    <div className="source-panel">
                        <div className="source-header">
                            <h3>Alunos & Necessidades</h3>
                            <select className="form-control" value={filterId} onChange={(e) => setFilterId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}>
                                <option value="all">Filtrar por Necessidade</option>
                                {necessidades.map(nec => <option key={nec.id} value={nec.id}>{nec.necessidade}</option>)}
                            </select>
                        </div>
                        <Droppable droppableId="source" isDropDisabled={true}>
                            {(provided) => (
                                <div className="source-list" ref={provided.innerRef} {...provided.droppableProps}>
                                    {filteredSourceItems.map((item, index) => (
                                        <Draggable draggableId={item.id} index={index} key={item.id}>
                                            {(provided, snapshot) => (
                                                <div className={`source-item ${snapshot.isDragging ? 'dragging' : ''}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                    {item.content}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>

                    <div className="schedule-panel">
                        <div className="schedule-board">
                            {boardState && boardState.columnOrder.map(columnId => {
                                const column = boardState.columns[columnId];
                                const items = column.itemIds.map(occurrence => ({...allRelations[occurrence.originalId], occurrenceId: occurrence.id })).filter(item => item.id);
                                return (
                                    <Droppable droppableId={column.id} key={column.id}>
                                        {(provided, snapshot) => (
                                            <div className="day-column" ref={provided.innerRef} {...provided.droppableProps}>
                                                <h3 className="day-title">{column.title}</h3>
                                                <div className={`cards-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}>
                                                    {items.map((item, index) => (
                                                        <Draggable draggableId={item.occurrenceId} index={index} key={item.occurrenceId}>
                                                            {(provided, snapshot) => (
                                                                <div className={`student-card ${snapshot.isDragging ? 'dragging' : ''}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                    <p className="student-name">{item.content}</p>
                                                                    <button className="delete-schedule-button" title="Remover agendamento" onClick={() => handleDelete(item, column.id)}><i className="bi bi-trash-fill"></i></button>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            </div>
                                        )}
                                    </Droppable>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </DragDropContext>
            <div className="cronograma-footer">
                <button className="action-button back-button" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
            </div>
        </section>
    );
};

export default CronogramaPage;