import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  Eye, 
  X,
  Printer
} from 'lucide-react';
import type { Movimentacao } from '../../types';
import { storageService } from '../../services/storage';

export const RelatoriosManager: React.FC = () => {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(() => storageService.getMovimentacoes());
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [viewSignatureModal, setViewSignatureModal] = useState<Movimentacao | null>(null);

  const loadData = () => {
    setMovimentacoes(storageService.getMovimentacoes());
  };

  useEffect(() => {
    const handleDataUpdate = () => loadData();
    window.addEventListener('obrastock_data_updated', handleDataUpdate);
    return () => window.removeEventListener('obrastock_data_updated', handleDataUpdate);
  }, []);

  const filteredMovs = movimentacoes.filter(m => {
    if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        m.itemNome.toLowerCase().includes(term) ||
        m.itemCodigo.toLowerCase().includes(term) ||
        (m.funcionarioNome && m.funcionarioNome.toLowerCase().includes(term)) ||
        (m.funcionarioMatricula && m.funcionarioMatricula.toLowerCase().includes(term)) ||
        (m.observacao && m.observacao.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Data/Hora', 'Tipo', 'Código', 'Material', 'Categoria', 'Quantidade', 'Unidade', 'Colaborador', 'Matrícula', 'Observação / NF', 'Assinatura Coletada'];
    const rows = filteredMovs.map(m => [
      `"${new Date(m.dataHora).toLocaleString('pt-BR')}"`,
      `"${m.tipo.toUpperCase()}"`,
      `"${m.itemCodigo}"`,
      `"${m.itemNome}"`,
      `"${m.itemCategoria}"`,
      m.quantidade,
      `"${m.unidade}"`,
      `"${m.funcionarioNome || 'N/A'}"`,
      `"${m.funcionarioMatricula || 'N/A'}"`,
      `"${m.numeroNotaFiscal || m.observacao || ''}"`,
      m.assinaturaBase64 ? '"SIM"' : '"NÃO"'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_almoxarifado_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Relatórios & Histórico de Movimentações
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Rastreabilidade completa: quem retirou, o que pegou, quando e com assinatura digital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Imprimir Relatório
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            Exportar Planilha Excel / CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por colaborador, material, NF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'saida', label: 'Saídas' },
            { id: 'entrada', label: 'Entradas' },
            { id: 'devolucao', label: 'Devoluções' },
            { id: 'ajuste_inventario', label: 'Ajustes' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroTipo(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filtroTipo === f.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className="bg-slate-850 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="p-3.5 font-bold">Data & Hora</th>
                <th className="p-3.5 font-bold">Tipo</th>
                <th className="p-3.5 font-bold">Material / Ferramenta</th>
                <th className="p-3.5 font-bold text-center">Quantidade</th>
                <th className="p-3.5 font-bold">Responsável / Solicitante</th>
                <th className="p-3.5 font-bold">Detalhes / Aplicação</th>
                <th className="p-3.5 font-bold text-center">Assinatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMovs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma movimentação registrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMovs.map(mov => {
                  const isSaida = mov.tipo === 'saida';
                  const isEntrada = mov.tipo === 'entrada';
                  const isDevolucao = mov.tipo === 'devolucao';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Data / Hora */}
                      <td className="p-3.5 whitespace-nowrap text-slate-300 font-mono">
                        {new Date(mov.dataHora).toLocaleDateString('pt-BR')} {' '}
                        <span className="text-slate-500">
                          {new Date(mov.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase flex items-center gap-1 w-fit ${
                          isSaida 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : isEntrada 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : isDevolucao
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {isSaida && <ArrowUpRight className="w-3 h-3" />}
                          {isEntrada && <ArrowDownRight className="w-3 h-3" />}
                          {isDevolucao && <RotateCcw className="w-3 h-3" />}
                          {mov.tipo}
                        </span>
                      </td>

                      {/* Material */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800">
                            {mov.itemCodigo}
                          </span>
                          <span className="font-bold text-slate-200">
                            {mov.itemNome}
                          </span>
                        </div>
                      </td>

                      {/* Quantidade */}
                      <td className="p-3.5 text-center whitespace-nowrap font-mono font-bold">
                        <span className={isSaida ? 'text-amber-400' : 'text-emerald-400'}>
                          {isSaida ? '-' : '+'}{mov.quantidade} {mov.unidade}
                        </span>
                      </td>

                      {/* Solicitante */}
                      <td className="p-3.5 whitespace-nowrap">
                        {mov.funcionarioNome ? (
                          <div>
                            <p className="font-bold text-slate-200">{mov.funcionarioNome}</p>
                            <p className="text-[10px] font-mono text-slate-400">{mov.funcionarioMatricula}</p>
                          </div>
                        ) : mov.numeroNotaFiscal ? (
                          <span className="text-slate-400 italic">NF-e: {mov.numeroNotaFiscal}</span>
                        ) : (
                          <span className="text-slate-500 italic">Almoxarifado</span>
                        )}
                      </td>

                      {/* Observações */}
                      <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate">
                        {mov.observacao || '-'}
                      </td>

                      {/* Assinatura Digital */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {mov.assinaturaBase64 ? (
                          <button
                            onClick={() => setViewSignatureModal(mov)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold text-[10px] transition-colors"
                            title="Ver assinatura digital coletada"
                          >
                            <Eye className="w-3 h-3" />
                            Ver Assinatura
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600">Sem assinatura</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualização de Assinatura */}
      {viewSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  Comprovante & Assinatura Digital
                </h3>
                <p className="text-xs text-slate-400">
                  {viewSignatureModal.funcionarioNome} ({viewSignatureModal.funcionarioMatricula})
                </p>
              </div>
              <button
                onClick={() => setViewSignatureModal(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1 bg-slate-850 p-3 rounded-xl border border-slate-800">
              <p>Item: <b>{viewSignatureModal.itemNome}</b> ({viewSignatureModal.quantidade} {viewSignatureModal.unidade})</p>
              <p>Data: <b>{new Date(viewSignatureModal.dataHora).toLocaleString('pt-BR')}</b></p>
              {viewSignatureModal.observacao && <p>Obs: {viewSignatureModal.observacao}</p>}
            </div>

            <div className="p-4 bg-white rounded-xl shadow-inner border border-slate-300 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                Assinatura Coletada na Tela do Celular
              </p>
              {viewSignatureModal.assinaturaBase64 ? (
                <img 
                  src={viewSignatureModal.assinaturaBase64} 
                  alt="Assinatura Digital" 
                  className="max-h-28 mx-auto"
                />
              ) : (
                <p className="text-xs text-slate-400">Sem imagem de assinatura</p>
              )}
            </div>

            <button
              onClick={() => setViewSignatureModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
