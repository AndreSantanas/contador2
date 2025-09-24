import React from 'react';
import './Header.css';

import setas from '../../../assets/img/setas.png';
import logo from '../../../assets/img/menu.png';

const Header = ({ onMenuClick, onLogoClick, userRole, isMenuOpen }) => {
  // A classe 'girar' é adicionada condicionalmente aqui
  const iconeClasses = `bi bi-list ${isMenuOpen ? 'girar' : ''}`;

  return (
    <header className="header">
      <div className="header-left"></div>
      <img src={setas} alt="Setas" className="setas" />
      <div className="header-right"></div>
      <img 
        src={logo} 
        alt="Logo" 
        className="logo" 
        style={{ cursor: 'pointer' }} 
        onClick={onLogoClick} 
      />
      <button className="menu-hamburguer" onClick={onMenuClick}>
        {/* A variável com as classes dinâmicas é usada aqui */}
        <i id="iconeMenu" className={iconeClasses}></i>
      </button>

      {userRole === 'inspetora' && (
        <div className="notificacao">
          <span id="notificacao-badge" style={{ display: 'none' }}></span>
        </div>
      )}
    </header>
  );
};

export default Header;