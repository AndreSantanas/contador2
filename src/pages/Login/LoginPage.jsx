import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Continua sendo necessário para o redirect PÓS-LOGIN
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

  // Esta função continua aqui, pois é usada pelo handleSubmit para redirecionar APÓS o login ser bem-sucedido.
  const navigateBasedOnLevel = (level) => {
    switch (level) {
      case '0': navigate('/inspetora/dashboard'); break;
      case '1': navigate('/nutri/dashboard'); break;
      case '2': navigate('/admin/dashboard'); break;
      default:
        setError('Nível de usuário desconhecido.');
        localStorage.clear();
        break;
    }
  };

  // O hook useEffect FOI REMOVIDO DAQUI. O PublicRoute agora faz esse trabalho.

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
      
      // Redireciona o usuário após o sucesso do login
      navigateBasedOnLevel(userData.nivel_user);

    } catch (err) {
      setError(err.message || 'NIF ou senha inválidos. Tente novamente.');
      setIsLoading(false);
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

          {error && <p className="error-message">{error}</p>}

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