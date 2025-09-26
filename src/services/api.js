import { API_BASE_URL } from '../config/apiConfig';

/**
 * Realiza o login do usuário.
 * @param {string} nif - O NIF do usuário.
 * @param {string} password - A senha do usuário.
 * @returns {Promise<object>} - A resposta da API com o token.
 */
export const loginUser = async (nif, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ nif: nif, password: password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao tentar fazer login.');
    }

    return data;
  } catch (error) {
    console.error('Falha no login:', error);
    throw error;
  }
};

/**
 * Busca os dados do usuário autenticado.
 * @param {string} token - O token de autenticação.
 * @returns {Promise<object>} - Os dados completos do usuário.
 */
export const getUserData = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar dados do usuário.');
    }

    return data;
  } catch (error) {
    console.error('Falha ao buscar dados do usuário:', error);
    throw error;
  }
};

/**
 * Desconecta o usuário da API.
 * @param {string} token - O token de autenticação do usuário.
 * @returns {Promise<object>} - A resposta de sucesso da API.
 */
export const logoutUser = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('API de logout falhou, mas o usuário será desconectado localmente.', data.message);
    }

    return data;
  } catch (error) {
    console.error('Falha na chamada de logout:', error);
    throw error;
  }
};



export const getProducao = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/controle_de_producao`, { // ENDEREÇO CORRIGIDO
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao buscar dados de produção.');
    return await response.json();
  } catch (error) { console.error("Erro em getProducao:", error); throw error; }
};

export const addProducao = async (itemData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/controle_de_producao`, { // ENDEREÇO CORRIGIDO
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao adicionar item.');
    }
    return await response.json();
  } catch (error) { console.error("Erro em addProducao:", error); throw error; }
};

export const updateProducao = async (id, itemData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/controle_de_producao/${id}`, { // ENDEREÇO CORRIGIDO
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao atualizar item.');
    }
    return await response.json();
  } catch (error) { console.error("Erro em updateProducao:", error); throw error; }
};

export const deleteProducao = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/controle_de_producao/${id}`, { // ENDEREÇO CORRIGIDO
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao deletar item.');
    return { success: true };
  } catch (error) { console.error("Erro em deleteProducao:", error); throw error; }
};


/**
 * Busca a lista de categorias, com suporte a paginação.
 * @param {string} token - O token de autenticação.
 * @param {number} page - O número da página a ser buscada.
 */
export const getCategorias = async (token, page = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias?page=${page}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao buscar categorias.');
    return await response.json();
  } catch (error) { console.error("Erro em getCategorias:", error); throw error; }
};

/**
 * Adiciona uma nova categoria.
 * @param {string} nomeCategoria - O nome da nova categoria.
 * @param {string} token - O token de autenticação.
 */
export const addCategoria = async (nomeCategoria, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ nome_categoria: nomeCategoria }),
    });
    if (!response.ok) throw new Error('Falha ao adicionar categoria.');
    return await response.json();
  } catch (error) { console.error("Erro em addCategoria:", error); throw error; }
};

/**
 * Atualiza uma categoria existente.
 * @param {number} id - O ID da categoria.
 * @param {string} nomeCategoria - O novo nome da categoria.
 * @param {string} token - O token de autenticação.
 */
export const updateCategoria = async (id, nomeCategoria, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ nome_categoria: nomeCategoria }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar categoria.');
    return await response.json();
  } catch (error) { console.error("Erro em updateCategoria:", error); throw error; }
};

/**
 * Deleta uma categoria.
 * @param {number} id - O ID da categoria.
 * @param {string} token - O token de autenticação.
 */
export const deleteCategoria = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao deletar categoria.');
    return { success: true };
  } catch (error) { console.error("Erro em deleteCategoria:", error); throw error; }
};


/**
 * Busca a lista de turmas, com suporte a paginação.
 * @param {string} token - O token de autenticação.
 * @param {number} page - O número da página a ser buscada.
 */
export const getTurmas = async (token, page = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/turmas?page=${page}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao buscar turmas.');
    return await response.json();
  } catch (error) { console.error("Erro em getTurmas:", error); throw error; }
};

/**
 * Adiciona uma nova turma.
 * @param {object} turmaData - Dados da turma { nome_turma, categorias_id }.
 * @param {string} token - O token de autenticação.
 */
export const addTurma = async (turmaData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/turmas`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(turmaData),
    });
    if (!response.ok) throw new Error('Falha ao adicionar turma.');
    return await response.json();
  } catch (error) { console.error("Erro em addTurma:", error); throw error; }
};

/**
 * Atualiza uma turma existente.
 * @param {number} id - O ID da turma.
 * @param {object} turmaData - Dados da turma { nome_turma, categorias_id }.
 * @param {string} token - O token de autenticação.
 */
export const updateTurma = async (id, turmaData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/turmas/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(turmaData),
    });
    if (!response.ok) throw new Error('Falha ao atualizar turma.');
    return await response.json();
  } catch (error) { console.error("Erro em updateTurma:", error); throw error; }
};

/**
 * Deleta uma turma.
 * @param {number} id - O ID da turma.
 * @param {string} token - O token de autenticação.
 */
export const deleteTurma = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/turmas/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao deletar turma.');
    return { success: true };
  } catch (error) { console.error("Erro em deleteTurma:", error); throw error; }
};


export const getUsers = async (token, page = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user?page=${page}`, { // Assumindo GET /api/users
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao buscar usuários.');
    return await response.json();
  } catch (error) { console.error("Erro em getUsers:", error); throw error; }
};

export const addUser = async (userData, token) => {
  try {
    // Usando a rota de registro para criar um novo usuário
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Falha ao adicionar usuário.');
    return await response.json();
  } catch (error) { console.error("Erro em addUser:", error); throw error; }
};

export const updateUser = async (id, userData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${id}`, { // Assumindo PUT /api/users/{id}
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Falha ao atualizar usuário.');
    return await response.json();
  } catch (error) { console.error("Erro em updateUser:", error); throw error; }
};

export const deleteUser = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${id}`, { // Assumindo DELETE /api/users/{id}
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao deletar usuário.');
    return { success: true };
  } catch (error) { console.error("Erro em deleteUser:", error); throw error; }
};

export const getNecessidades = async (token, page = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/necessidades?page=${page}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao buscar necessidades.');
    return await response.json();
  } catch (error) { console.error("Erro em getNecessidades:", error); throw error; }
};

export const addNecessidade = async (necessidade, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/necessidades`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ necessidade: necessidade }),
    });
    if (!response.ok) throw new Error('Falha ao adicionar necessidade.');
    return await response.json();
  } catch (error) { console.error("Erro em addNecessidade:", error); throw error; }
};

export const updateNecessidade = async (id, necessidade, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/necessidades/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ necessidade: necessidade }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar necessidade.');
    return await response.json();
  } catch (error) { console.error("Erro em updateNecessidade:", error); throw error; }
};

export const deleteNecessidade = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/necessidades/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao deletar necessidade.');
    return { success: true };
  } catch (error) { console.error("Erro em deleteNecessidade:", error); throw error; }
};


// ... (suas funções existentes) ...

// =========================================================
// FUNÇÕES CRUD PARA ALUNOS (COM UPLOAD DE ARQUIVO)
// =========================================================

export const getAlunos = async (token, page = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alunos?page=${page}`, { // Assumindo GET /api/alunos
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao buscar alunos.');
    return await response.json();
  } catch (error) { console.error("Erro em getAlunos:", error); throw error; }
};

// Adicionar Aluno com Foto
export const addAluno = async (alunoData, token) => {
  try {
    // 1. Criamos um FormData para enviar arquivos
    const formData = new FormData();
    // 2. Adicionamos cada campo ao formData
    Object.keys(alunoData).forEach(key => {
      formData.append(key, alunoData[key]);
    });

    const response = await fetch(`${API_BASE_URL}/alunos`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
        // NÃO definimos 'Content-Type', o navegador faz isso automaticamente para FormData
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Falha ao adicionar aluno.');
    return await response.json();
  } catch (error) { console.error("Erro em addAluno:", error); throw error; }
};

// Atualizar Aluno com Foto
export const updateAluno = async (id, alunoData, token) => {
  try {
    const formData = new FormData();
    Object.keys(alunoData).forEach(key => {
      formData.append(key, alunoData[key]);
    });
    formData.append('_method', 'PUT'); // Truque para enviar PUT com FormData

    const response = await fetch(`${API_BASE_URL}/alunos/${id}`, {
      method: 'POST', // Usamos POST para enviar FormData na atualização
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Falha ao atualizar aluno.');
    return await response.json();
  } catch (error) { console.error("Erro em updateAluno:", error); throw error; }
};

export const deleteAluno = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alunos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Falha ao deletar aluno.');
    return { success: true };
  } catch (error) { console.error("Erro em deleteAluno:", error); throw error; }
};