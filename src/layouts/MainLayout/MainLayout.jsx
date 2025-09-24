import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { logoutUser } from '../../services/api';
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import InspetoraNav from '../../components/navigation/InspetoraNav/InspetoraNav';
import NutriNav from '../../components/navigation/NutriNav/NutriNav';
import './MainLayout.css';
import background from '../../assets/img/main.jpg';

const MainLayout = ({ userRole, children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState('Usuário'); // Define um valor padrão seguro
  const [dataAtual, setDataAtual] = useState('');
  
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Efeito para buscar dados e data
  useEffect(() => {
    // =========================================================
    // CORREÇÃO APLICADA AQUI
    // =========================================================
    const nomeSalvo = localStorage.getItem('userName');
    
    // 1. Verificamos se o nome do usuário existe
    if (nomeSalvo) {
      setUsuario(nomeSalvo);
    } else {
      // 2. Se não existir, NÃO deslogamos mais. Apenas avisamos no console.
      // Isso impede o redirect que causa a tela branca.
      console.warn("Aviso: 'userName' não foi encontrado no localStorage. Usando nome padrão.");
    }

    // 3. Adicionamos uma verificação de segurança: se o TOKEN não existir, aí sim deslogamos.
    const token = localStorage.getItem('authToken');
    if (!token) {
        handleFinalLogout();
    }
    // =========================================================

    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR');
    setDataAtual(dataFormatada);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  // Efeito para fechar o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && navRef.current && !navRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogoClick = () => console.log("Navegar para a página inicial");

  // Função que REALMENTE faz o logout
  const handleFinalLogout = async () => {
    const token = localStorage.getItem('authToken');
    try {
      if (token) await logoutUser(token);
    } catch (error) {
      console.error("Erro na API de logout, mas deslogando localmente.");
    } finally {
      localStorage.clear();
      navigate('/');
    }
  };

  const confirmLogout = () => {
    setIsMenuOpen(false);
    Swal.fire({
      title: 'Você tem certeza?',
      text: "Você será desconectado do sistema.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, quero sair!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        handleFinalLogout();
      }
    });
  };

  return (
    <div className="app-container">
      <Header 
        onMenuClick={toggleMenu} 
        onLogoClick={handleLogoClick}
        userRole={userRole}
        isMenuOpen={isMenuOpen}
      />
      
      <div ref={navRef}>
        {userRole === 'inspetora' ? (
          <InspetoraNav
            isOpen={isMenuOpen}
            usuario={usuario}
            dataSelecionada={dataAtual}
            onLogout={confirmLogout}
            onCloseMenu={closeMenu}
          />
        ) : (
          <NutriNav
            isOpen={isMenuOpen}
            usuario={usuario}
            dataSelecionada={dataAtual}
            onLogout={confirmLogout}
            onCloseMenu={closeMenu}
          />
        )}
      </div>

      <main className="main-content" style={{ backgroundImage: `url(${background})` }}>
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;