import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getCategorias, addCategoria, updateCategoria, deleteCategoria } from '../../services/api';
import './CategoriasPage.css';

// Função para escolher a cor do badge da turma
const getTurmaBadgeClass = (nomeTurma) => {
  if (!nomeTurma || typeof nomeTurma !== 'string') {
    return 'turma-badge-default';
  }
  const firstChar = nomeTurma.trim().charAt(0);
  if (!isNaN(firstChar) && firstChar >= '1' && firstChar <= '9') {
    return `turma-badge-${firstChar}`;
  }
  return 'turma-badge-default';
};

const CategoriasPage = () => {
  const [categorias, setCategorias] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async (page = 1) => {
    try {
      setIsLoading(true);
      const data = await getCategorias(page);
      setCategorias(data.data || []);
      setPagination(data.meta);
    } catch (error) {
      if (error && !error.message.includes('Sessão expirada')) {
        Swal.fire('Erro!', 'Não foi possível carregar as categorias.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    Swal.fire({
      title: item ? 'Editar Categoria' : 'Adicionar Nova Categoria',
      input: 'text',
      inputValue: item ? item.nome_categoria : '',
      inputPlaceholder: 'Nome da Categoria',
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      confirmButtonColor: '#28a745',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      inputValidator: (value) => !value && 'Você precisa digitar um nome para a categoria!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (item) {
            await updateCategoria(item.id, result.value);
          } else {
            await addCategoria(result.value);
          }
          await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Categoria salva com sucesso.', timer: 1500, showConfirmButton: false});
          fetchData(pagination?.current_page || 1);
        } catch (error) {
          if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível salvar a categoria.', 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: "Isso pode afetar turmas associadas!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, deletar!',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCategoria(id);
          await Swal.fire({icon: 'success', title: 'Deletado!', text: 'A categoria foi removida.', timer: 1500, showConfirmButton: false});
          fetchData(pagination?.current_page || 1);
        } catch (error) {
          if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível deletar a categoria.', 'error');
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
    <section className="categorias-container">
      <div className="categorias-header">
        <h1>Gerenciar Categorias</h1>
        <button className="action-button add-button" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus"></i> Adicionar Categoria
        </button>
      </div>

      <div className="table-wrapper">
        <table className="categorias-table">
          <thead>
            <tr>
              <th>Nome da Categoria</th>
              <th>Turmas Vinculadas</th>
              <th className="coluna-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="3" style={{textAlign: 'center', padding: '40px'}}>Carregando...</td></tr>
            ) : categorias.length > 0 ? (
              categorias.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.nome_categoria}</td>
                  {/* CLASSE ADICIONADA AQUI para a quebra de linha funcionar */}
                  <td className="coluna-turmas">
                    <div className="turmas-list">
                      {(cat.turmas && cat.turmas.length > 0) ? (
                        cat.turmas.map(turma => (
                          <span key={turma.id} className={`turma-badge ${getTurmaBadgeClass(turma.nome_turma)}`}>
                            {turma.nome_turma}
                          </span>
                        ))
                      ) : (
                        <span className="no-turma-badge">Nenhuma turma</span>
                      )}
                    </div>
                  </td>
                  <td className="coluna-acoes actions-cell">
                    <button className="action-button edit-button" title="Editar" onClick={() => handleOpenModal(cat)}>
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button className="action-button delete-button" title="Deletar" onClick={() => handleDelete(cat.id)}>
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" style={{textAlign: 'center', padding: '40px'}}>Nenhuma categoria encontrada.</td></tr>
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

      <div className="categorias-footer">
        <button className="action-button back-button" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Voltar
        </button>
      </div>
    </section>
  );
};

export default CategoriasPage;