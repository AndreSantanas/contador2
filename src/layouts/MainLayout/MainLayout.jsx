import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { logoutUser, getUserData } from '../../services/api'; // Importa o getUserData

// Importa os SEUS componentes, com os caminhos corretos
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import InspetoraNav from '../../components/navigation/InspetoraNav/InspetoraNav';
import NutriNav from '../../components/navigation/NutriNav/NutriNav';

import './MainLayout.css';
import background from '../../assets/img/main.jpg';

const MainLayout = ({ userRole, children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [usuario, setUsuario] = useState('Carregando...'); // Começa com um estado de carregamento
    const [dataAtual, setDataAtual] = useState('');
    
    const navigate = useNavigate();
    const navRef = useRef(null);

    // Função que REALMENTE faz o logout
    const handleFinalLogout = async (showSuccess = true) => {
        try {
            // CORREÇÃO: logoutUser não precisa de argumento
            await logoutUser();
            if (showSuccess) {
                // Opcional: pode mostrar um alerta de sucesso
            }
        } catch (error) {
            console.error("Erro na API de logout, mas deslogando localmente.", error);
        } finally {
            localStorage.clear();
            navigate('/');
        }
    };

    // Efeito para buscar dados do usuário e data
    useEffect(() => {
        const fetchInitialData = async () => {
            // 1. Busca os dados do usuário (nome) da API, que é mais seguro
            try {
                const data = await getUserData();
                setUsuario(data.name);
            } catch (error) {
                console.error("Não foi possível buscar os dados do usuário. Forçando logout.", error);
                handleFinalLogout(false); // Desloga se não conseguir buscar os dados
            }

            // 2. Define a data atual
            const hoje = new Date();
            const dataFormatada = hoje.toLocaleDateString('pt-BR');
            setDataAtual(dataFormatada);
        };

        fetchInitialData();
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

    const confirmLogout = () => {
        setIsMenuOpen(false);
        Swal.fire({
            title: 'Você tem certeza?',
            text: "Você será desconectado do sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8B0000',
            cancelButtonColor: '#6c757d',
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