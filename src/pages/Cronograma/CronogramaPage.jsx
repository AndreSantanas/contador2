import React, { useState, useEffect } from 'react'; // <-- LINHA CORRIGIDA
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getCronograma } from '../../services/api';
import './CronogramaPage.css';

const CronogramaPage = () => {
  const [cronograma, setCronograma] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/'); return; }
      
      const cronogramaData = await getCronograma(token);
      setCronograma(cronogramaData.data || []);

    } catch (error) {
       if (error && !error.message.includes('Sessão expirada')) {
        Swal.fire('Erro!', 'Não foi possível carregar os dados do cronograma.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <section className="cronograma-container">
      <div className="cronograma-header">
        <h1>Cronograma Semanal</h1>
        <button className="action-button back-button" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Voltar
        </button>
      </div>
      {isLoading ? (
        <div className="loading-message">Carregando cronograma...</div>
      ) : (
        <div className="cronograma-board">
          {(cronograma || []).map((dia) => (
            <div key={dia.id} className="day-column">
              <h3 className="day-title">{dia.dia}</h3>
              <div className="cards-container">
                {(dia.alunos || []).map((aluno, index) => (
                  <div key={`${aluno.id}-${index}`} className="student-card">
                    <p className="student-name">{aluno.nome}</p>
                    <div className="necessidades-list">
                      {(aluno.necessidades || []).map((nec) => (
                        <span key={nec.id} className="necessidade-badge">
                          {nec.necessidade}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CronogramaPage;