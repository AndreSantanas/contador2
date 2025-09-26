import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getAlunos, addAluno, updateAluno, deleteAluno, getTurmas } from '../../services/api';
import { API_BASE_URL } from '../../config/apiConfig';
import './AlunosPage.css';
import placeholderAvatar from '../../assets/img/avatar.png';

const AlunosPage = () => {
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Otimização: Cria um mapa de turmas para busca rápida de nomes
  const turmasMap = useMemo(() => {
    return turmas.reduce((map, turma) => {
      map[turma.id] = turma.nome_turma;
      return map;
    }, {});
  }, [turmas]);

  const fetchData = async (page = 1) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/'); return; }
      
      const [alunosData, turmasData] = await Promise.all([
        getAlunos(token, page),
        getTurmas(token) // Pega a primeira página de turmas para o dropdown
      ]);

      setAlunos(alunosData.data || []);
      setPagination(alunosData.meta);
      setTurmas(turmasData.data || []);

    } catch (error) {
      Swal.fire('Erro!', 'Não foi possível carregar os dados da página.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (aluno = null) => {
    const isEditing = aluno !== null;
    const turmasOptionsHtml = turmas.map(t => `<option value="${t.id}" ${isEditing && aluno.turmas_id == t.id ? 'selected' : ''}>${t.nome_turma}</option>`).join('');
    const diasOptions = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta'];
    const diasOptionsHtml = diasOptions.map(d => `<option value="${d}" ${isEditing && aluno.dia === d ? 'selected' : ''}>${d}</option>`).join('');

    Swal.fire({
      title: isEditing ? 'Editar Aluno' : 'Adicionar Novo Aluno',
      html: `
        <div class="swal-form-container">
          <input id="swal-nome" class="swal2-input" placeholder="Nome Completo" value="${isEditing ? aluno.nome : ''}">
          <input id="swal-rm" class="swal2-input" placeholder="Registro de Matrícula (RM)" value="${isEditing ? aluno.rm : ''}">
          <input id="swal-data_nascimento" type="date" class="swal2-input" placeholder="Data de Nascimento" value="${isEditing ? aluno.data_nascimento : ''}">
          <select id="swal-genero" class="swal2-select">
            <option value="">Selecione o Gênero</option>
            <option value="Masculino" ${isEditing && aluno.genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
            <option value="Feminino" ${isEditing && aluno.genero === 'Feminino' ? 'selected' : ''}>Feminino</option>
          </select>
          <select id="swal-turma" class="swal2-select">
            <option value="">Selecione a Turma</option>
            ${turmasOptionsHtml}
          </select>
          <select id="swal-dia" class="swal2-select">
            <option value="">Selecione o Dia (Opcional)</option>
            ${diasOptionsHtml}
          </select>
          <label for="swal-foto" class="swal2-file-label">Foto do Aluno (Opcional)</label>
          <input id="swal-foto" type="file" class="swal2-file" accept="image/*">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      confirmButtonColor: '#28a745',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const fotoFile = document.getElementById('swal-foto').files[0];
        const data = {
          nome: document.getElementById('swal-nome').value,
          rm: document.getElementById('swal-rm').value,
          data_nascimento: document.getElementById('swal-data_nascimento').value,
          genero: document.getElementById('swal-genero').value,
          turmas_id: document.getElementById('swal-turma').value,
          dia: document.getElementById('swal-dia').value,
        };
        if (fotoFile) {
          data.foto = fotoFile;
        }
        
        if (!data.nome || !data.rm || !data.data_nascimento || !data.genero || !data.turmas_id) {
          Swal.showValidationMessage('Preencha todos os campos obrigatórios!');
          return false;
        }
        return data;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const token = localStorage.getItem('authToken');
        try {
          if (isEditing) {
            await updateAluno(aluno.id, result.value, token);
          } else {
            await addAluno(result.value, token);
          }
          Swal.fire('Sucesso!', 'Aluno salvo com sucesso!', 'success');
          fetchData(pagination?.current_page || 1);
        } catch (error) {
          Swal.fire('Erro!', 'Não foi possível salvar o aluno.', 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: "O registro do aluno será removido.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgba(81, 179, 42, 1)',
      cancelButtonColor: '#d63030ff',
      confirmButtonText: 'Sim, deletar!',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('authToken');
          await deleteAluno(id, token);
          Swal.fire('Deletado!', 'Aluno removido com sucesso.', 'success');
          fetchData(pagination?.current_page || 1);
        } catch (error) {
          Swal.fire('Erro!', 'Não foi possível remover o aluno.', 'error');
        }
      }
    });
  };

  const handlePageChange = (page) => {
    if (page) {
      fetchData(page);
    }
  };

  return (
    <section className="alunos-container">
      <div className="alunos-header">
        <h1>Gerenciar Alunos</h1>
        <button className="action-button add-button" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus"></i> Adicionar Aluno
        </button>
      </div>
      
      <div className="table-wrapper">
        <table className="alunos-table">
          <thead>
            <tr>
              <th className="coluna-foto">Foto</th>
              <th>Nome</th>
              <th>RM</th>
              <th>Nascimento</th>
              <th>Turma</th>
              <th className="coluna-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Carregando...</td></tr>
            ) : alunos.length > 0 ? (
              alunos.map(aluno => (
                <tr key={aluno.id}>
                  <td className="coluna-foto">
                    <img 
                      src={aluno.foto ? `${API_BASE_URL}/storage/${aluno.foto}` : placeholderAvatar} 
                      alt={aluno.nome} 
                      className="aluno-avatar"
                      onError={(e) => { e.target.onerror = null; e.target.src = placeholderAvatar; }} // Fallback se a imagem da API falhar
                    />
                  </td>
                  <td>{aluno.nome}</td>
                  <td>{aluno.rm}</td>
                  <td>{new Date(aluno.data_nascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                  <td>{turmasMap[aluno.turmas_id] || 'N/A'}</td>
                  <td className="coluna-acoes actions-cell">
                    <button className="action-button edit-button" title="Editar" onClick={() => handleOpenModal(aluno)}><i className="bi bi-pencil-fill"></i></button>
                    <button className="action-button delete-button" title="Deletar" onClick={() => handleDelete(aluno.id)}><i className="bi bi-trash-fill"></i></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Nenhum aluno encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="pagination-container">
          {pagination.links.map((link, index) => (
            <button
              key={index}
              className={`pagination-button ${link.active ? 'active' : ''} ${!link.page ? 'disabled' : ''}`}
              onClick={() => handlePageChange(link.page)}
              dangerouslySetInnerHTML={{ __html: link.label }}
              disabled={!link.page}
            />
          ))}
        </div>
      )}

      <div className="alunos-footer">
        <button className="action-button back-button" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Voltar
        </button>
      </div>
    </section>
  );
};

export default AlunosPage;