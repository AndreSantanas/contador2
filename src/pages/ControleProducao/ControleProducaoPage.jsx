import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getProducao, addProducao, updateProducao, deleteProducao } from '../../services/api';
import './ControleProducaoPage.css';
import logo from '../../assets/img/logo.png'; 

const ControleProducaoPage = () => {
  const [producao, setProducao] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/');
        return;
      }
      const data = await getProducao(token);
      setProducao(data.data || []);
    } catch (error) {
      Swal.fire('Erro!', 'Não foi possível carregar os dados de produção.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    Swal.fire({
      title: item ? 'Editar Item' : 'Adicionar Novo Item',
      width: '700px',
      html: `
        <input id="swal-nome" class="swal2-input" placeholder="Nome do Alimento" value="${item ? item.nome_alimento : ''}">
        <input id="swal-data" type="date" class="swal2-input" value="${item ? item.data_alimento : new Date().toISOString().split('T')[0]}">
        <input id="swal-quantidade" type="number" step="0.01" class="swal2-input" placeholder="Quantidade (ex: 10.50)" value="${item ? item.quantidade_alimento : ''}">
        <input id="swal-medida" class="swal2-input" placeholder="Medida (kg, g, L)" value="${item ? item.medida_alimento : ''}">
        <input id="swal-pessoas" type="number" class="swal2-input" placeholder="Pessoas" value="${item ? item.pessoas_alimento : ''}">
        <input id="swal-sobra" type="number" step="0.01" class="swal2-input" placeholder="Sobra Limpa (ex: 1.25)" value="${item ? item.sobra_limpa_alimento : ''}">
        <input id="swal-desperdicio" type="number" step="0.01" class="swal2-input" placeholder="Desperdício (ex: 0.50)" value="${item ? item.desperdicio_alimento : ''}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      confirmButtonColor: '#28a745',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const nome = document.getElementById('swal-nome').value;
        const quantidadeStr = document.getElementById('swal-quantidade').value;
        const sobraStr = document.getElementById('swal-sobra').value;
        const desperdicioStr = document.getElementById('swal-desperdicio').value;
        const pessoasStr = document.getElementById('swal-pessoas').value;

        if (!nome) {
          Swal.showValidationMessage(`O nome do alimento é obrigatório.`);
          return false;
        }

        const quantidadeNum = parseFloat(quantidadeStr) || 0;
        const sobraNum = parseFloat(sobraStr) || 0;
        const desperdicioNum = parseFloat(desperdicioStr) || 0;
        const pessoas = parseInt(pessoasStr) || 0;

        return {
          nome_alimento: nome,
          data_alimento: document.getElementById('swal-data').value,
          quantidade_alimento: quantidadeNum.toFixed(2),
          medida_alimento: document.getElementById('swal-medida').value,
          pessoas_alimento: pessoas,
          sobra_limpa_alimento: sobraNum.toFixed(2),
          desperdicio_alimento: desperdicioNum.toFixed(2),
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const token = localStorage.getItem('authToken');
        try {
          if (item && item.id) {
            await updateProducao(item.id, result.value, token);
          } else {
            await addProducao(result.value, token);
          }
          Swal.fire('Sucesso!', 'Operação realizada com sucesso!', 'success');
          fetchData();
        } catch (error) {
          Swal.fire('Erro!', error.message || 'Não foi possível salvar o item.', 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: "Você não poderá reverter esta ação!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, deletar!',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('authToken');
          await deleteProducao(id, token);
          Swal.fire('Deletado!', 'O item foi removido.', 'success');
          fetchData();
        } catch (error) {
          Swal.fire('Erro!', 'Não foi possível deletar o item.', 'error');
        }
      }
    });
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const today = new Date().toLocaleDateString('pt-BR');

    const tableData = producao.filter(item => 
      item && typeof item.nome_alimento === 'string' && item.nome_alimento.toLowerCase().includes(searchTerm.toLowerCase())
    ).map(item => [
      item.nome_alimento,
      new Date(item.data_alimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
      item.quantidade_alimento,
      item.medida_alimento,
      item.pessoas_alimento,
      item.sobra_limpa_alimento,
      item.desperdicio_alimento,
    ]);

    autoTable(doc, {
      head: [['Nome', 'Data', 'Qtd.', 'Medida', 'Pessoas', 'Sobra', 'Desperdício']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: {
        fillColor: [139, 0, 0], // #8B0000
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      didDrawPage: function (data) {
        // CABEÇALHO PERFEITO: Título à Esquerda, Logo à Direita
        const margin = 15;
        const logoWidth = 40;
        const logoHeight = 10;
        
        // Posição Y central para ambos os elementos
        const verticalCenter = 20;

        // Título do Relatório (à esquerda)
        doc.setFontSize(20);
        doc.setTextColor(51, 51, 51);
        doc.setFont('helvetica', 'bold');
        doc.text('Controle de Produção e Consumo', margin, verticalCenter, { baseline: 'bottom' });
        
        // Logo (à direita)
        const logoX = pageWidth - margin - logoWidth;
        const logoY = verticalCenter - logoHeight; // Calcula a posição Y da logo
        doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
        
        // Linha divisória
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, verticalCenter + 5, pageWidth - margin, verticalCenter + 5);


        // RODAPÉ PROFISSIONAL E LIMPO (VERSÃO FINAL)
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');

        doc.text('Menu Solutions', margin, pageHeight - 10);
        doc.text(`Emitido em: ${today}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      },
    });

    doc.save(`Controle_Producao_${today.replace(/\//g, '-')}.pdf`);
  };

  const filteredData = producao.filter(item => 
    item && typeof item.nome_alimento === 'string' && item.nome_alimento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="producao-container">
      <div className="producao-header">
        <input
          type="text"
          className="search-input"
          placeholder="Digite o nome do alimento para buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="action-button download-button" onClick={handleDownloadPdf}>
          <i className="bi bi-file-earmark-arrow-down-fill"></i> Baixar Relatório
        </button>
      </div>
      <div className="table-wrapper">
        <table className="producao-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Data</th>
              <th>Quantidade</th>
              <th>Medida</th>
              <th>Pessoas</th>
              <th>Sobra Limpa</th>
              <th>Desperdício</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center' }}>Carregando dados...</td></tr>
            ) : filteredData.length > 0 ? (
              filteredData.map(item => (
                <tr key={item.id}>
                  <td>{item.nome_alimento}</td>
                  <td>{new Date(item.data_alimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td>{item.quantidade_alimento}</td>
                  <td>{item.medida_alimento}</td>
                  <td>{item.pessoas_alimento}</td>
                  <td>{item.sobra_limpa_alimento}</td>
                  <td>{item.desperdicio_alimento}</td>
                  <td className="actions-cell">
                    <button className="action-button edit-button" title="Editar" onClick={() => handleOpenModal(item)}>
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button className="action-button delete-button" title="Deletar" onClick={() => handleDelete(item.id)}>
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" style={{ textAlign: 'center' }}>Nenhum item encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="producao-footer">
        <button className="action-button back-button" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Voltar
        </button>
        <button className="action-button add-button" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus"></i> Adicionar Novo Item
        </button>
      </div>
    </section>
  );
};

export default ControleProducaoPage;