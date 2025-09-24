import React from 'react';
import { useNavigate } from 'react-router-dom';
import './InicioPage.css';

// Objeto de configuração para os botões. Fica mais fácil de gerenciar!
const botoesConfig = {
  inspetora: [
    { texto: 'Nova Contagem', icone: 'bi bi-plus-circle-fill', rota: '/nova-contagem' },
    { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/chat' },
    { texto: 'Cardápio', icone: 'bi bi-journal-text', rota: '/cardapio' },
    { texto: 'Perfil', icone: 'bi bi-person-fill', rota: '/perfil' },
  ],
  nutri: [
    { texto: 'Contagem Geral', icone: 'bi bi-list-check', rota: '/contagem-geral' },
    { texto: 'Controle de Produção', icone: 'bi bi-graph-up', rota: '/nutri/controle-producao' },
    { texto: 'Relatório Personalizado', icone: 'bi bi-file-earmark-text-fill', rota: '/relatorio-personalizado' },
    { texto: 'Cardápio', icone: 'bi bi-journal-text', rota: '/cardapio' },
    { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/chat' },
    { texto: 'Gerenciar', icone: 'bi bi-gear-fill', rota: '/gerenciar' },
    { texto: 'Cronograma', icone: 'bi bi-calendar-week-fill', rota: '/cronograma' },
    { texto: 'Perfil', icone: 'bi bi-person-fill', rota: '/perfil' },
  ]
};

// 1. O componente agora recebe a prop 'userRole'
const InicioPage = ({ userRole }) => {
  const navigate = useNavigate();

  // 2. Seleciona a lista de botões correta com base na userRole
  const botoesParaRenderizar = botoesConfig[userRole] || []; // Usa um array vazio como padrão

  return (
    <section className="inicio-container">
      {/* 3. Renderiza os botões dinamicamente com .map() */}
      <div className={`buttons-section ${userRole === 'nutri' ? 'nutri-grid' : ''}`}>
        {botoesParaRenderizar.map((botao, index) => (
          <button 
            key={index} 
            className="main-button" 
            onClick={() => navigate(botao.rota)}
          >
            <i className={botao.icone}></i> {botao.texto}
          </button>
        ))}
      </div>
    </section>
  );
};

export default InicioPage;