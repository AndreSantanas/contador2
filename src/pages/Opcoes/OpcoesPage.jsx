import React from 'react';
import { useNavigate } from 'react-router-dom';
import './OpcoesPage.css'; // Importa o estilo renomeado

const botoesGerenciamento = [
  { texto: 'Gerenciar Alunos', icone: 'bi bi-person-badge-fill', rota: '/nutri/gerenciar/alunos' },
  { texto: 'Gerenciar Turmas', icone: 'bi bi-people-fill', rota: '/nutri/gerenciar/turmas' },
  { texto: 'Gerenciar Categorias', icone: 'bi bi-tags-fill', rota: '/nutri/gerenciar/categorias' },
  { texto: 'Gerenciar Usuários', icone: 'bi bi-person-video2', rota: '/nutri/gerenciar/usuarios' },
  { texto: 'Gerenciar NAI', icone: 'bi bi-person-check-fill', rota: '/nutri/gerenciar-nai' },
  {texto: 'Planejamento de Necessidades', icone: 'bi bi-card-checklist', rota: '/nutri/planejamento' },
];

const OpcoesPage = () => {
  const navigate = useNavigate();

  return (
    <section className="opcoes-container">
      <div className="management-buttons-section">
        <h1 className="management-title">Gerenciamento</h1> {/* Título Atualizado */}
        {botoesGerenciamento.map((botao, index) => (
          <button 
            key={index} 
            className="management-button" 
            onClick={() => navigate(botao.rota)}
          >
            <i className={botao.icone}></i>
            <span>{botao.texto}</span>
          </button>
        ))}
      </div>
       <button className="action-button back-button" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Voltar
        </button>
    </section>
  );
};

export default OpcoesPage;