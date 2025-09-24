import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importe todas as suas páginas e layouts
import LoginPage from './pages/Login/LoginPage';
import MainLayout from './layouts/MainLayout/MainLayout';
import InicioPage from './pages/Inicio/InicioPage'; // Página genérica de início/ações
import DashboardNutri from './pages/DashboardNutri/DashboardNutri'; // Dashboard específico da Nutri
import ControleProducaoPage from './pages/ControleProducao/ControleProducaoPage'; // Página de Controle de Produção

// =========================================================
// Definições de Rota
// =========================================================

// Mapa de Níveis: traduz o número da API para um nome de cargo
const roleMap = { 
  '1': 'inspetora', // Nível 1 é Inspetora
  '2': 'nutri',     // Nível 2 é Nutricionista
  // Adicione outros níveis se necessário (ex: '3': 'admin')
};

/**
 * Componente de Rota Privada:
 * Protege rotas que só podem ser acessadas por usuários autenticados e com o cargo correto.
 */
const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('authToken');
  const userLevel = localStorage.getItem('userLevel');
  
  const userRole = roleMap[userLevel]; // Traduz o nível (ex: '1') para o cargo (ex: 'inspetora')

  // Se não houver token OU se o cargo do usuário for diferente do cargo exigido pela rota...
  if (!token || userRole !== requiredRole) {
    // ...envia o usuário de volta para a página de login.
    return <Navigate to="/" />;
  }

  // Se tudo estiver certo, renderiza a página solicitada.
  return children;
};

/**
 * Componente de Rota Pública:
 * Usado para páginas como a de login. Se o usuário já estiver logado,
 * ele é automaticamente redirecionado para sua página inicial.
 */
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const userLevel = localStorage.getItem('userLevel');

  // Se o usuário já tiver um token...
  if (token && userLevel) {
    // ...descubra para qual página ele deve ser redirecionado.
    const redirectMap = { 
      '1': '/inspetora/inicio',     // Inspetora vai para a página de início dela
      '2': '/nutri/dashboard',    // Nutri vai para o dashboard principal dela
    };
    const redirectTo = redirectMap[userLevel] || '/'; // Se o nível for desconhecido, volta para o login por segurança
    
    // Redirecione-o.
    return <Navigate to={redirectTo} />;
  }

  // Se não estiver logado, mostra a página pública (ex: login).
  return children;
};

// =========================================================
// Componente Principal da Aplicação
// =========================================================

function App() {
  return (
    <Router>
      <Routes>
        {/* ROTA PÚBLICA - LOGIN */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        
        {/* ========================================================= */}
        {/* ROTAS DA INSPETORA (Nível 1)                            */}
        {/* ========================================================= */}
        <Route 
          path="/inspetora/inicio" 
          element={
            <PrivateRoute requiredRole="inspetora">
              <MainLayout userRole="inspetora">
                <InicioPage userRole="inspetora" />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        {/* Adicione outras rotas da Inspetora aqui, se houver */}
        {/* Exemplo:
        <Route path="/inspetora/calendario" element={...} />
        */}

        {/* ========================================================= */}
        {/* ROTAS DA NUTRICIONISTA (Nível 2)                        */}
        {/* ========================================================= */}
        <Route 
          path="/nutri/dashboard" 
          element={
            <PrivateRoute requiredRole="nutri">
              <MainLayout userRole="nutri">
                <DashboardNutri />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/nutri/inicio" 
          element={
            <PrivateRoute requiredRole="nutri">
              <MainLayout userRole="nutri">
                <InicioPage userRole="nutri" />
              </MainLayout>
            </PrivateRoute>
          } 
        />

        {/* ROTA CORRIGIDA E DEDICADA para o Controle de Produção */}
        <Route 
          path="/nutri/controle-producao" 
          element={
            <PrivateRoute requiredRole="nutri">
              <MainLayout userRole="nutri">
                <ControleProducaoPage />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        {/* Adicione outras rotas da Nutricionista aqui */}
        {/* Exemplo:
        <Route path="/nutri/relatorios" element={...} />
        */}

      </Routes>
    </Router>
  );
}

export default App;