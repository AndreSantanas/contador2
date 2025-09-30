import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Função Central de Fetch: Lida com token, erro 401, JSON e FormData em um só lugar.
 * @param {string} endpoint - O endpoint da API (ex: '/alunos').
 * @param {object} options - As opções do fetch (method, body, etc.).
 * @returns {Promise<object>} - A resposta da API em formato JSON.
 */
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Lógica inteligente: só configura como JSON se o body NÃO for FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  // Lida com sessão expirada (erro 401)
  if (response.status === 401) {
    localStorage.clear();
    await Swal.fire({
      title: 'Sessão Expirada',
      text: 'Por favor, faça o login novamente.',
      icon: 'warning',
      confirmButtonColor: '#8B0000',
    });
    window.location.href = '/';
    throw new Error('Sessão expirada.');
  }

  // Lida com outros erros
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro de comunicação com o servidor.' }));
    throw new Error(errorData.message || 'Ocorreu um erro na requisição.');
  }

  // Retorna JSON ou um objeto de sucesso para respostas sem corpo
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    if (response.status === 204) return { success: true }; // Ex: para DELETE
    return response.json();
  }
  return { success: true };
};

// --- FUNÇÕES DE AUTENTICAÇÃO ---
export const loginUser = (nif, password) => apiFetch('/login', { method: 'POST', body: { nif, password } });
export const getUserData = () => apiFetch('/user');
export const logoutUser = () => apiFetch('/logout', { method: 'POST' });

// --- FUNÇÕES DE PRODUÇÃO ---
export const getProducao = () => apiFetch('/controle_de_producao');
export const addProducao = (data) => apiFetch('/controle_de_producao', { method: 'POST', body: data });
export const updateProducao = (id, data) => apiFetch(`/controle_de_producao/${id}`, { method: 'PUT', body: data });
export const deleteProducao = (id) => apiFetch(`/controle_de_producao/${id}`, { method: 'DELETE' });

// --- FUNÇÕES DE CATEGORIAS ---
export const getCategorias = (page = 1) => apiFetch(`/categorias?page=${page}`);
export const addCategoria = (nome_categoria) => apiFetch('/categorias', { method: 'POST', body: { nome_categoria } });
export const updateCategoria = (id, nome_categoria) => apiFetch(`/categorias/${id}`, { method: 'PUT', body: { nome_categoria } });
export const deleteCategoria = (id) => apiFetch(`/categorias/${id}`, { method: 'DELETE' });

// --- FUNÇÕES DE TURMAS ---
export const getTurmas = (page = 1) => apiFetch(`/turmas?page=${page}`);
export const addTurma = (data) => apiFetch('/turmas', { method: 'POST', body: data });
export const updateTurma = (id, data) => apiFetch(`/turmas/${id}`, { method: 'PUT', body: data });
export const deleteTurma = (id) => apiFetch(`/turmas/${id}`, { method: 'DELETE' });

// --- FUNÇÕES DE NECESSIDADES ---
export const getNecessidades = (page = 1, limit = 100) => apiFetch(`/necessidades?page=${page}&limit=${limit}`);
export const getNecessidadeComAlunos = (id) => apiFetch(`/necessidades/${id}`);
export const addNecessidade = (necessidade) => apiFetch('/necessidades', { method: 'POST', body: { necessidade } });
export const updateNecessidade = (id, necessidade) => apiFetch(`/necessidades/${id}`, { method: 'PUT', body: { necessidade } });
export const deleteNecessidade = (id) => apiFetch(`/necessidades/${id}`, { method: 'DELETE' });

// --- FUNÇÕES DE ALUNOS ---
export const getAlunos = (page = 1, limit = 500) => apiFetch(`/alunos?page=${page}&limit=${limit}`);
export const deleteAluno = (id) => apiFetch(`/alunos/${id}`, { method: 'DELETE' });
export const associarNecessidadesAoAluno = (alunoId, necessidades) => apiFetch(`/alunos/${alunoId}/necessidades`, { method: 'POST', body: { necessidades } });

// Versões para dados simples (JSON), usadas pela página 'Gerenciar Alunos'
export const addAluno = (data) => apiFetch('/alunos', { method: 'POST', body: data });
export const updateAluno = (id, data) => apiFetch(`/alunos/${id}`, { method: 'PUT', body: data });

// Versões para dados com FOTO (FormData), usadas pela página 'NAI'
export const addAlunoComFoto = (alunoData) => {
    const formData = new FormData();
    for (const key in alunoData) {
        if (alunoData[key] !== null && alunoData[key] !== undefined) {
            formData.append(key, alunoData[key]);
        }
    }
    // Usa a apiFetch, que agora sabe lidar com FormData
    return apiFetch('/alunos', { method: 'POST', body: formData });
};

export const updateAlunoComFoto = (id, alunoData) => {
    const formData = new FormData();
    for (const key in alunoData) {
        if (alunoData[key] !== null && alunoData[key] !== undefined) {
            formData.append(key, alunoData[key]);
        }
    }
    formData.append('_method', 'PUT'); // Truque do Laravel para PUT com FormData
    // Usa POST no método, mas o Laravel interpreta como PUT por causa do _method
    return apiFetch(`/alunos/${id}`, { method: 'POST', body: formData });
};

// --- FUNÇÕES DE CRONOGRAMA ---
export const getCronograma = () => apiFetch('/cronogramas');
export const getDias = async () => {
    return Promise.resolve([
        { id: 1, dia: 'Segunda' }, { id: 2, dia: 'Terca' }, { id: 3, dia: 'Quarta' },
        { id: 4, dia: 'Quinta' }, { id: 5, dia: 'Sexta' }
    ]);
};
export const agendarRelacaoNosDias = (relacaoId, dias) => apiFetch(`/alunos/${relacaoId}/dias`, { method: 'POST', body: { dias } });