import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
    getNecessidades, getNecessidadeComAlunos, addAlunoComFoto, updateAlunoComFoto, 
    deleteAluno, getTurmas, associarNecessidadesAoAluno 
} from '../../services/api';
import { API_BASE_URL } from '../../config/apiConfig';
import placeholderAvatar from '../../assets/img/avatar.png';
import './NaiPage.css';

// TODO: Insira aqui o logo da sua empresa em formato Base64
const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // Placeholder

const NaiPage = () => {
    const [naiAlunos, setNaiAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [naiNeedId, setNaiNeedId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const turmasMap = useMemo(() => turmas.reduce((map, turma) => {
        map[turma.id] = turma.nome_turma;
        return map;
    }, {}), [turmas]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [necessidadesData, turmasData] = await Promise.all([ getNecessidades(1, 100), getTurmas(1, 100) ]);
            setTurmas(turmasData.data || []);

            const necessidadeNai = (necessidadesData.data || []).find(n => n.necessidade.toUpperCase() === 'NAI');
            if (!necessidadeNai) {
                Swal.fire('Configuração Necessária', 'A necessidade "NAI" não foi encontrada. Crie-a na tela de Planejamento.', 'warning');
                setIsLoading(false);
                return;
            }
            setNaiNeedId(necessidadeNai.id);

            const naiData = await getNecessidadeComAlunos(necessidadeNai.id);
            const alunosUnicos = new Map();
            (naiData.alunos || []).forEach(aluno => alunosUnicos.set(aluno.id, aluno));
            setNaiAlunos(Array.from(alunosUnicos.values()));

        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = (aluno = null) => {
        const isEditing = !!aluno;
        const turmasOptionsHtml = turmas.map(t => `<option value="${t.id}" ${isEditing && aluno.turmas_id == t.id ? 'selected' : ''}>${t.nome_turma}</option>`).join('');

        Swal.fire({
            title: isEditing ? 'Editar Aluno NAI' : 'Adicionar Aluno NAI',
            width: '700px',
            html: `
                <div class="swal-form-container">
                    <input id="swal-nome" class="swal2-input" placeholder="Nome Completo" value="${isEditing ? aluno.nome : ''}">
                    <input id="swal-rm" class="swal2-input" placeholder="Registro de Matrícula (RM)" value="${isEditing ? aluno.rm : ''}">
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
                    <textarea id="swal-descricao" class="swal2-textarea" placeholder="Descrição da necessidade do aluno...">${isEditing ? aluno.descricao || '' : ''}</textarea>
                </div>
            `,
            focusConfirm: false, showCancelButton: true, confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745', cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const data = {
                    nome: document.getElementById('swal-nome').value,
                    rm: document.getElementById('swal-rm').value,
                    data_nascimento: document.getElementById('swal-data_nascimento').value,
                    genero: document.getElementById('swal-genero').value,
                    turmas_id: document.getElementById('swal-turma').value,
                    // TODO: Descomente a linha abaixo quando o backend suportar a descrição
                    // descricao: document.getElementById('swal-descricao').value,
                };
                const fotoFile = document.getElementById('swal-foto').files[0];
                if (fotoFile) data.foto = fotoFile;
                if (!data.nome || !data.rm) {
                    Swal.showValidationMessage('Nome e RM são obrigatórios!');
                    return false;
                }
                return data;
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    Swal.showLoading();
                    if (isEditing) {
                        await updateAlunoComFoto(aluno.id, result.value);
                    } else {
                        const newAlunoResponse = await addAlunoComFoto(result.value);
                        
                        // CORREÇÃO: Acessamos o ID diretamente da resposta
                        const newAlunoId = newAlunoResponse.id;

                        if (!newAlunoId) {
                            throw new Error("A API não retornou o ID do novo aluno.");
                        }
                        
                        await associarNecessidadesAoAluno(newAlunoId, [naiNeedId]);
                    }
                    await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Aluno salvo e associado ao NAI!', timer: 1500, showConfirmButton: false});
                    fetchData();
                } catch (error) {
                    if (!error.message.includes('Sessão expirada')) Swal.fire('Erro!', `Não foi possível salvar o aluno. Detalhe: ${error.message}`, 'error');
                }
            }
        });
    };

    const handleDelete = async (alunoId) => {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "O aluno será removido permanentemente do sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, deletar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteAluno(alunoId);
                await Swal.fire({icon: 'success', title: 'Deletado!', text: 'Aluno removido com sucesso.', timer: 1500, showConfirmButton: false});
                fetchData();
            } catch (error) {
                if (!error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover o aluno.', 'error');
            }
        }
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        doc.addImage(logoBase64, 'PNG', 14, 10, 40, 10);
        doc.setFontSize(16);
        doc.text('Relatório de Alunos NAI', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100);
        const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        doc.text(`Gerado em: ${dataHoje}`, pageWidth / 2, 22, { align: 'center' });

        const tableData = naiAlunos.map(aluno => [
            aluno.nome,
            aluno.rm,
            turmasMap[aluno.turmas_id] || 'N/A',
            aluno.descricao || 'Nenhuma'
        ]);

        doc.autoTable({
            head: [['Nome', 'RM', 'Turma', 'Descrição']],
            body: tableData,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [139, 0, 0] },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(`Página ${data.pageNumber} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
            }
        });
        doc.save(`Relatorio_NAI_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    return (
        <section className="nai-container">
            <div className="content-wrapper">
                <div className="nai-header">
                    <h1>Gerenciar Alunos NAI</h1>
                    <button className="action-button add-button" onClick={() => handleOpenModal()}>
                        <i className="bi bi-plus"></i> Adicionar Aluno
                    </button>
                </div>

                <div className="nai-grid-container">
                    {isLoading ? (
                        <div className="loading-state">Carregando...</div>
                    ) : naiAlunos.length > 0 ? naiAlunos.map(aluno => (
                        <div key={aluno.id} className="aluno-card-nai">
                            <div className="card-header">
                                <img src={aluno.foto ? `${API_BASE_URL}/storage/${aluno.foto}` : placeholderAvatar} alt={aluno.nome} className="card-photo" />
                                <div className="card-title">
                                    <h4 className="card-name">{aluno.nome}</h4>
                                    <span className="card-info">RM: {aluno.rm} | Turma: {turmasMap[aluno.turmas_id] || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="card-body">
                                <p className="card-description-title">Descrição</p>
                                <p className="card-description-text">{aluno.descricao || 'Nenhuma descrição fornecida.'}</p>
                            </div>
                            <div className="card-actions">
                                <button className="action-button-card edit-button-card" title="Editar" onClick={() => handleOpenModal(aluno)}>
                                    <i className="bi bi-pencil-fill"></i> Editar
                                </button>
                                <button className="action-button-card delete-button-card" title="Deletar" onClick={() => handleDelete(aluno.id)}>
                                    <i className="bi bi-trash-fill"></i> Deletar
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state-nai">
                            <i className="bi bi-person-x"></i>
                            <p>Nenhum aluno NAI encontrado.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="nai-footer">
                <button className="action-button download-button" onClick={handleDownloadPdf}>
                    <i className="bi bi-file-earmark-arrow-down-fill"></i> Baixar Relatório
                </button>
                <button className="action-button back-button" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
            </div>
        </section>
    );
};

export default NaiPage;