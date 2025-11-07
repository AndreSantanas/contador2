import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importações
import LoginPage from './pages/Login/LoginPage';
import MainLayout from './layouts/MainLayout/MainLayout';
import InicioPage from './pages/Inicio/InicioPage';
import DashboardNutri from './pages/DashboardNutri/DashboardNutri';
import ControleProducaoPage from './pages/ControleProducao/ControleProducaoPage';
import OpcoesPage from './pages/Opcoes/OpcoesPage';
import CategoriasPage from './pages/GerenciarCategorias/CategoriasPage';
import TurmasPage from './pages/GerenciarTurmas/TurmasPage';
import UsuariosPage from './pages/GerenciarUsuarios/UsuariosPage';
import NecessidadesPage from './pages/GerenciarNecessidades/NecessidadesPage';
import AlunosPage from './pages/GerenciarAlunos/AlunosPage';
import CronogramaPage from './pages/Cronograma/CronogramaPage';
import PlanejamentoPage from './pages/Planejamento/PlanejamentoPage';
import NaiPage from './pages/GerenciarNai/NaiPage';
import ContagemPage from './pages/Inspetora/ContagemPage';

// ================== ADIÇÃO 1: Importar a nova página ==================
import ContagemGeralPage from './pages/ContagemGeral/ContagemGeralPage';
// ======================================================================

const roleMap = { '1': 'inspetora', '2': 'nutri' };

const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('authToken');
  const userLevel = localStorage.getItem('userLevel');
  const userRole = roleMap[userLevel];
  if (!token || userRole !== requiredRole) {
    return <Navigate to="/" />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const userLevel = localStorage.getItem('userLevel');
  if (token && userLevel) {
    const redirectMap = { 
      '1': '/inspetora/inicio',
      '2': '/nutri/dashboard',
    };
    const redirectTo = redirectMap[userLevel] || '/';
    return <Navigate to={redirectTo} />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ROTA PÚBLICA */}
        <Route path="/" element={ <PublicRoute><LoginPage /></PublicRoute> } />
        
        {/* ROTAS DA INSPETORA */}
        <Route path="/inspetora/inicio" element={ <PrivateRoute requiredRole="inspetora"><MainLayout userRole="inspetora"><InicioPage userRole="inspetora" /></MainLayout></PrivateRoute> } />
        <Route path="/nova-contagem" element={ <PrivateRoute requiredRole="inspetora"><MainLayout userRole="inspetora"><ContagemPage /></MainLayout></PrivateRoute> } />
        
        {/* ROTAS DA NUTRICIONISTA */}
        <Route path="/nutri/dashboard" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><DashboardNutri /></MainLayout></PrivateRoute> } />
        
        {/* ================== ADIÇÃO 2: Adicionar a nova rota ================== */}
        <Route path="/nutri/relatorio-geral" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><ContagemGeralPage /></MainLayout></PrivateRoute> } />
        {/* ====================================================================== */}
        
        <Route path="/nutri/inicio" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><InicioPage userRole="nutri" /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/controle-producao" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><ControleProducaoPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><OpcoesPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/categorias" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><CategoriasPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/turmas" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><TurmasPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/usuarios" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><UsuariosPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/necessidades" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><NecessidadesPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/alunos" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><AlunosPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/cronograma" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><CronogramaPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/planejamento" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><PlanejamentoPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar-nai" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><NaiPage /></MainLayout></PrivateRoute> } />
      </Routes>
    </Router>
  );
}

export default App;