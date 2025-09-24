import React from 'react';
import '../InspetoraNav/InspetoraNav.css';

// 1. Recebe a nova propriedade 'onCloseMenu'
const NutriNav = ({ isOpen, usuario, dataSelecionada, onLogout, onCloseMenu }) => {
  const menuClasses = isOpen ? 'menu-lateral aberto' : 'menu-lateral';

  return (
    <div className={menuClasses}>
      <div className="nome-usuario-container"><span>{usuario}</span></div>
      <hr />
      <div className="nome-usuario-container"><span>{dataSelecionada}</span></div>
      <hr />
      <ul className="opcoes">
        {/* 2. Adicionado onClick={onCloseMenu} em cada link */}
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-house"></i>&nbsp;&nbsp;Início</a></li>
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-list-check"></i>&nbsp;&nbsp;Ver Contagens</a></li>
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-graph-up"></i>&nbsp;&nbsp;Demanda Alimentar</a></li>
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-file-earmark-text"></i>&nbsp;&nbsp;Relatório Personalizado</a></li>
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-journal"></i>&nbsp;&nbsp;Cardápio</a></li>
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-chat-left-dots"></i>&nbsp;&nbsp;Chat</a></li>
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-people-fill"></i>&nbsp;&nbsp;Gerenciar Turmas</a></li>
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-tags-fill"></i>&nbsp;&nbsp;Gerenciar Categorias</a></li>
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-calendar-week-fill"></i>&nbsp;&nbsp;Cronograma</a></li>
        <li onClick={onCloseMenu}><a href="#"><i className="bi bi-person-circle"></i>&nbsp;&nbsp;Perfil</a></li>
      </ul>

      {/* O botão de sair agora chama a função que abre o modal */}
      <div className="sair" onClick={onLogout}>
        Sair
      </div>
    </div>
  );
};

export default NutriNav;