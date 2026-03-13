'use client';
import React, { useState } from 'react';

export default function AuditorPage() {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); 

  const startAudit = async () => {
    setLoading(true);
    setStep(2);
    setError(null);
    try {
      const response = await fetch('/api/audit', { method: 'POST' });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setTimeout(() => {
        setReport(data);
        setStep(3);
        setLoading(false);
      }, 2000);
    } catch (e) {
      setStep(1);
      setLoading(false);
      setError('Falha na conexão com as APIs.');
    }
  };

  const handleActivate = () => {
    setRedirecting(true);
    alert('🎉 Interesse registrado! Entraremos em contato para configurar seu checkout real.');
    setRedirecting(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '600px', width: '90%', textAlign: 'center' }}>
        {error && <div style={{ background: '#411', padding: '1rem', marginBottom: '2rem' }}>{error}</div>}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Pare de dar lucro para o Google.</h1>
            <button onClick={startAudit} style={{ padding: '1rem 2rem', fontSize: '1.2rem', cursor: 'pointer', backgroundColor: '#fff', color: '#000', borderRadius: '8px' }}>Iniciar Auditoria Gratuita</button>
          </div>
        )}
        {step === 2 && <div><h2>Analisando histórico de 90 dias...</h2></div>}
        {step === 3 && report && (
          <div style={{ border: '1px solid #333', padding: '3rem', borderRadius: '20px', textAlign: 'left' }}>
            <h2 style={{ color: '#f55', fontSize: '2rem' }}>Hemorragia: $1.432,00</h2>
            <button onClick={handleActivate} disabled={redirecting} style={{ width: '100%', padding: '1.2rem', marginTop: '2rem', background: '#1db954', color: '#000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '10px' }}>
              {redirecting ? 'Processando...' : 'Ativar Proteção de Lucro (30 dias grátis)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
