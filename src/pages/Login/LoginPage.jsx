import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { loginUser, getUserData } from '../../services/api';
import { showTermsModal, showPrivacyModal } from '../../utils/modals';
import './LoginPage.css';
import logo from '../../assets/img/code.png';

const LoginPage = () => {
  const [nif, setNif] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const navigateBasedOnLevel = (level) => {
    switch (String(level)) {
      case '1': navigate('/inspetora/inicio'); break;
      case '2': navigate('/nutri/inicio'); break;
      default:
        Swal.fire({
          icon: 'error',
          title: 'Acesso Negado',
          text: 'Seu nível de usuário não tem uma página de destino configurada.',
        });
        localStorage.clear();
        break;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginResponse = await loginUser(nif, password);
      const token = loginResponse.token;
      localStorage.setItem('authToken', token);

      const userData = await getUserData(token);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('userLevel', userData.nivel_user);
      
      setIsLoading(false);
      
      // =========================================================
      // SWEETALERT DE SUCESSO PERSONALIZADO
      // =========================================================
      await Swal.fire({
        // icon: 'success', // Ícone removido
        title: 'Bem-vindo(a)!', // Novo título
        text: userData.name, // Apenas o nome do usuário
        timer: 1500,
        showConfirmButton: false,
        allowOutsideClick: false
      });

      navigateBasedOnLevel(userData.nivel_user);

    } catch (err) {
      setIsLoading(false);
      setError(err.message);
      
      // =========================================================
      // SWEETALERT DE ERRO PERSONALIZADO
      // =========================================================
      Swal.fire({
        // icon: 'error', // Ícone removido
        title: 'Oops... Falha no Login',
        text: err.message || 'NIF ou senha inválidos. Verifique seus dados.',
        confirmButtonText: 'Tentar Novamente', // Novo texto do botão
        confirmButtonColor: '#d33', // Botão vermelho
      });
    }
  };

  return (
    <div className="login-background">
      <div className="box">
        <div className="logo-container">
          <img src={logo} alt="Logo Menu Solutions" />
        </div>
        
        <form onSubmit={handleSubmit}>
          <h2>Login</h2>
          <div className="inputBox">
            <input 
              type="text" 
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              required 
            />
            <span>NIF</span>
            <i></i>
          </div>

          <div className="inputBox">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <span>Senha</span>
            <i></i>
          </div>

          <input 
            type="submit" 
            value={isLoading ? 'Entrando...' : 'Entrar'} 
            disabled={isLoading}
          />

          <div className="terms-container">
            <p>
              Ao continuar, você concorda com nossos{' '}
              <span className="link-style" onClick={showTermsModal}>Termos de Uso</span> e{' '}
              <span className="link-style" onClick={showPrivacyModal}>Política de Privacidade</span>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;