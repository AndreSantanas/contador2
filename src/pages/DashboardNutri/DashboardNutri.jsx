import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardNutri.css'; // Vamos criar este arquivo de estilo

const DashboardNutri = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Nutricionista'; // Pega o nome do usuário

  return (
    <div className="dashboard-nutri-container">
      <div className="welcome-box">
        <i className="bi bi-clipboard2-pulse-fill welcome-icon"></i>
        <h1>Olá, {userName}!</h1>
        <p>Bem-vinda ao seu painel de controle. Aqui você tem acesso rápido a relatórios e ferramentas de gestão.</p>
        <button className="dashboard-button" onClick={() => navigate('/nutri/inicio')}>
          Acessar Menu de Ações
        </button>
      </div>
    </div>
  );
};

export default DashboardNutri;