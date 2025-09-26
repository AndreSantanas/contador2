import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getUsers, addUser, updateUser, deleteUser } from '../../services/api';
import './UsuariosPage.css';

// Mapa para traduzir o nível do usuário para um texto legível
const roleMap = { 
  '1': 'Inspetora',
  '2': 'Nutricionista',
};

const UsuariosPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async (page = 1) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/'); return; }
      const data = await getUsers(token, page);
      setUsers(data.data || []);
      setPagination(data.meta);
    } catch (error) {
      Swal.fire('Erro!', 'Não foi possível carregar os usuários.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user = null) => {
    const isEditing = user !== null;
    const optionsHtml = Object.entries(roleMap).map(([value, text]) => 
      `<option value="${value}" ${isEditing && user.nivel_user == value ? 'selected' : ''}>${text}</option>`
    ).join('');

    Swal.fire({
      title: isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário',
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Nome Completo" value="${isEditing ? user.name : ''}">
        <input id="swal-email" type="email" class="swal2-input" placeholder="E-mail" value="${isEditing ? user.email : ''}">
        <input id="swal-nif" class="swal2-input" placeholder="NIF" value="${isEditing ? user.nif : ''}">
        <select id="swal-nivel" class="swal2-select">
          <option value="">Selecione o Nível</option>
          ${optionsHtml}
        </select>
        ${!isEditing ? '<input id="swal-password" type="password" class="swal2-input" placeholder="Senha">' : ''}
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      confirmButtonColor: '#28a745',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const email = document.getElementById('swal-email').value;
        const nif = document.getElementById('swal-nif').value;
        const nivel_user = document.getElementById('swal-nivel').value;
        const password = !isEditing ? document.getElementById('swal-password').value : null;

        if (!name || !email || !nif || !nivel_user || (!isEditing && !password)) {
          Swal.showValidationMessage('Todos os campos são obrigatórios!');
          return false;
        }
        
        const userData = { name, email, nif, nivel_user };
        if (!isEditing) {
          userData.password = password;
        }
        return userData;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const token = localStorage.getItem('authToken');
        try {
          if (isEditing) {
            await updateUser(user.id, result.value, token);
          } else {
            await addUser(result.value, token);
          }
          Swal.fire('Sucesso!', 'Usuário salvo com sucesso!', 'success');
          fetchData(pagination?.current_page || 1);
        } catch (error) {
          Swal.fire('Erro!', 'Não foi possível salvar o usuário.', 'error');
        }
      }
    });
  };

  const handleDelete = (id) => { /* ... (mesma lógica de handleDelete das outras páginas) ... */ };
  const handlePageChange = (page) => page && fetchData(page);

  return (
    <section className="usuarios-container">
      <div className="usuarios-header">
        <h1>Gerenciar Usuários</h1>
        <button className="action-button add-button" onClick={() => handleOpenModal()}>
          <i className="bi bi-person-plus-fill"></i> Adicionar Usuário
        </button>
      </div>
      <div className="table-wrapper">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>NIF</th>
              <th>Nível</th>
              <th className="coluna-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>Carregando...</td></tr>
            ) : users.length > 0 ? (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.nif}</td>
                  <td>
                    <span className={`role-badge role-${user.nivel_user}`}>
                      {roleMap[user.nivel_user] || 'Desconhecido'}
                    </span>
                  </td>
                  <td className="coluna-acoes actions-cell">
                    <button className="action-button edit-button" title="Editar" onClick={() => handleOpenModal(user)}>
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button className="action-button delete-button" title="Deletar" onClick={() => handleDelete(user.id)}>
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>Nenhum usuário encontrado.</td></tr>
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
      <div className="usuarios-footer">
        <button className="action-button back-button" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Voltar
        </button>
      </div>
    </section>
  );
};

export default UsuariosPage;