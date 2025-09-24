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