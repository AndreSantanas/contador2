import React from 'react';
import { useNavigate } from 'react-router-dom';
import './InicioPage.css';

const botoesConfig = {
  inspetora: [
    { texto: 'Nova Contagem', icone: 'bi bi-plus-circle-fill', rota: '/nova-contagem' },
    { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/chat' },
    { texto: 'Cardápio', icone: 'bi bi-journal-text', rota: '/cardapio' },
    { texto: 'Perfil', icone: 'bi bi-person-fill', rota: '/perfil' },
  ],
  nutri: [
    { texto: 'Controle de Produção', icone: 'bi bi-graph-up', rota: '/nutri/controle-producao' },
    { texto: 'Contagem Geral', icone: 'bi bi-list-check', rota: '/contagem-geral' },
    { texto: 'Relatório Personalizado', icone: 'bi bi-file-earmark-text-fill', rota: '/relatorio-personalizado' },
    { texto: 'Cardápio', icone: 'bi bi-journal-text', rota: '/cardapio' },
    { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/chat' },
    { texto: 'Gerenciar', icone: 'bi bi-gear-fill', rota: '/nutri/gerenciar' },
    { texto: 'Cronograma', icone: 'bi bi-calendar-week-fill', rota: '/nutri/cronograma' },
    { texto: 'Perfil', icone: 'bi bi-person-fill', rota: '/perfil' },
  ]
};

const InicioPage = ({ userRole }) => {
  const navigate = useNavigate();

  const botoesParaRenderizar = botoesConfig[userRole] || [];

  return (
    <section className="inicio-container">
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