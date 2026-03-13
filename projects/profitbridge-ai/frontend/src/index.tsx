import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

const ROICalculator = () => {
  const [adSpend, setAdSpend] = useState(10000);
  const [roas, setRoas] = useState(4.5);
  const [outOfStock, setOutOfStock] = useState(15);
  const [margin, setMargin] = useState(30);
  const [softwareCost] = useState(297);
  const [email, setEmail] = useState('');

  const [results, setResults] = useState({
    wastedSpend: 0,
    lostProfit: 0,
    totalLeak: 0,
    roi: 0
  });

  useEffect(() => {
    const wastedSpend = adSpend * (outOfStock / 100);
    const lostRevenue = wastedSpend * roas;
    const lostProfit = lostRevenue * (margin / 100);
    const totalLeak = wastedSpend + lostProfit;
    const roi = totalLeak / softwareCost;

    setResults({ wastedSpend, lostProfit, totalLeak, roi });
  }, [adSpend, roas, outOfStock, margin, softwareCost]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleCapture = async () => {
    if(!email) return alert('Por favor, insira seu e-mail');
    try {
      const res = await fetch('http://89.167.83.218:4040/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, adSpend, roas, outOfStock, margin })
      });
      if(res.ok) alert('Relatório enviado para seu e-mail!');
    } catch (e) {
      alert('Erro ao conectar com o servidor.');
    }
  };

  return (
    <div style={{
      fontFamily: 'sans-serif',
      maxWidth: '600px',
      margin: '40px auto',
      padding: '32px',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      backgroundColor: '#fff',
      color: '#1a202c'
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#2d3748' }}>
        Quanto dinheiro você está jogando fora hoje?
      </h2>
      <p style={{ color: '#718096', marginBottom: '24px' }}>
        Calcule o vazamento de lucro causado por anúncios de produtos sem estoque.
      </p>

      <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            Investimento Mensal em Ads
          </label>
          <input 
            type="number" 
            value={adSpend} 
            onChange={(e) => setAdSpend(Number(e.target.value))}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              ROAS Médio
            </label>
            <input 
              type="number" 
              step="0.1"
              value={roas} 
              onChange={(e) => setRoas(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              % Ruptura de Estoque
            </label>
            <input 
              type="number" 
              value={outOfStock} 
              onChange={(e) => setOutOfStock(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            Margem de Lucro Líquida (%)
          </label>
          <input 
            type="number" 
            value={margin} 
            onChange={(e) => setMargin(Number(e.target.value))}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#f7fafc', 
        padding: '24px', 
        borderRadius: '12px',
        border: '1px solid #edf2f7'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', color: '#4a5568' }}>Vazamento de Lucro Mensal:</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e53e3e' }}>
            {formatCurrency(results.totalLeak)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#718096' }}>Gasto Inútil em Ads:</span>
            <div style={{ fontWeight: '600' }}>{formatCurrency(results.wastedSpend)}</div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#718096' }}>Lucro não Realizado:</span>
            <div style={{ fontWeight: '600' }}>{formatCurrency(results.lostProfit)}</div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input 
            type="email" 
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          onClick={handleCapture}
          style={{
            width: '100%',
            backgroundColor: '#3182ce',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
          RECUPERAR MEU LUCRO AGORA
        </button>
        <p style={{ fontSize: '11px', textAlign: 'center', marginTop: '12px', color: '#a0aec0' }}>
          Garantia 3x: Economize 3x o valor da ferramenta ou seu dinheiro de volta.
        </p>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<ROICalculator />);
