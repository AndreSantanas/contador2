import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Função Central de Fetch: Lida com token, erros, JSON e FormData.
 */
const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Accept': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} - ${response.statusText}` }));
            throw new Error(errorData.message || 'Ocorreu um erro na requisição.');
        }

        if (response.status === 204) return { success: true }; // No Content
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        }
        return { success: true };
    } catch (error) {
        // Lida com erros de rede (ex: servidor offline)
        console.error('API Fetch Error:', error);
        throw error;
    }
};

// --- UPLOAD ---
export const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/upload', { method: 'POST', body: formData });
};

// --- AUTENTICAÇÃO ---
export const loginUser = (nif, password) => apiFetch('/login', { method: 'POST', body: { nif, password } });
export const getUserData = () => apiFetch('/user');
export const logoutUser = () => apiFetch('/logout', { method: 'POST' });

// --- PRODUÇÃO ---
export const getProducao = () => apiFetch('/controle_de_producao');
export const addProducao = (data) => apiFetch('/controle_de_producao', { method: 'POST', body: data });
export const updateProducao = (id, data) => apiFetch(`/controle_de_producao/${id}`, { method: 'PUT', body: data });
export const deleteProducao = (id) => apiFetch(`/controle_de_producao/${id}`, { method: 'DELETE' });

// --- CATEGORIAS ---
export const getCategorias = (page = 1) => apiFetch(`/categorias?page=${page}`);
export const addCategoria = (nome_categoria) => apiFetch('/categorias', { method: 'POST', body: { nome_categoria } });
export const updateCategoria = (id, nome_categoria) => apiFetch(`/categorias/${id}`, { method: 'PUT', body: { nome_categoria } });
export const deleteCategoria = (id) => apiFetch(`/categorias/${id}`, { method: 'DELETE' });

// --- TURMAS ---
export const getTurmas = (page = 1, limit = 100) => apiFetch(`/turmas?page=${page}&limit=${limit}`);
export const addTurma = (data) => apiFetch('/turmas', { method: 'POST', body: data });
export const updateTurma = (id, data) => apiFetch(`/turmas/${id}`, { method: 'PUT', body: data });
export const deleteTurma = (id) => apiFetch(`/turmas/${id}`, { method: 'DELETE' });

// --- NECESSIDADES ---
export const getNecessidades = (page = 1, limit = 100) => apiFetch(`/necessidades?page=${page}&limit=${limit}`);
export const getNecessidadeComAlunos = (id) => apiFetch(`/necessidades/${id}`);
export const addNecessidade = (nome) => apiFetch('/necessidades', { method: 'POST', body: { necessidade: nome } });
export const updateNecessidade = (id, necessidade) => apiFetch(`/necessidades/${id}`, { method: 'PUT', body: { necessidade } });
export const deleteNecessidade = (id) => apiFetch(`/necessidades/${id}`, { method: 'DELETE' });

// --- ALUNOS ---
export const getAlunos = (page = 1, limit = 1000) => apiFetch(`/alunos?page=${page}&limit=${limit}`);
export const addAluno = (data) => apiFetch('/alunos', { method: 'POST', body: data });
export const updateAluno = (id, data) => apiFetch(`/alunos/${id}`, { method: 'PUT', body: data });
export const deleteAluno = (id) => apiFetch(`/alunos/${id}`, { method: 'DELETE' });

// --- ASSOCIAÇÕES ---
export const associarNecessidadesAoAluno = (alunoId, necessidadesIds) => {
  return apiFetch(`/alunos/${alunoId}/necessidades`, { method: 'POST', body: { necessidades: necessidadesIds } });
};
export const desassociarAlunoDaNecessidade = (necessidadeId, alunoId) => {
  return apiFetch(`/necessidade/${necessidadeId}/alunos`, { method: 'DELETE', body: { alunos: [alunoId] } });
};

// --- CRONOGRAMA ---
export const getCronograma = () => apiFetch('/cronogramas');
export const agendarRelacaoNosDias = (relacaoId, dias) => apiFetch(`/alunos/${relacaoId}/dias`, { method: 'POST', body: { dias } });
export const removerAgendamentoDoDia = (relacaoId, diaId) => apiFetch(`/alunos/${relacaoId}/dias`, { method: 'DELETE', body: { dias: [diaId] } });




// --- FUNÇÕES DE CONTAGEM (Versão Final) ---
export const getContagensDeHoje = () => {
  const hoje = new Date().toISOString().slice(0, 10);
  return apiFetch(`/contagens?data=${hoje}`);
};
export const addContagem = (data) => apiFetch('/contagens', { method: 'POST', body: data });
export const updateContagem = (id, data) => apiFetch(`/contagens/${id}`, { method: 'PUT', body: data });

export const getAlunosContagemNes = (contagemId) => apiFetch(`/contagem-nes/${contagemId}`);

export const addAlunoNaContagemNes = (alunoHasNecessidadeId) => {
  return apiFetch(`/contagem-nes`, {
      method: 'POST',
      body: { alunos_has_necessidades_id: alunoHasNecessidadeId }
  });
};

// CORREÇÃO DE SINTAXE APLICADA AQUI 👇
export const removeAlunoDaContagemNes = (contagemNesId) => {
  return apiFetch(`/contagem-nes/${contagemNesId}`, {
      method: 'DELETE'
  });
};



export const getDiasDaRelacao = (relacaoId) => apiFetch(`/alunos/${relacaoId}/dias`);