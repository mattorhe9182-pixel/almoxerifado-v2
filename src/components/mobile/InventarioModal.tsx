import React, { useState } from 'react';
import { 
  X, 
  ClipboardCheck, 
  Camera, 
  Check, 
  TrendingDown, 
  TrendingUp
} from 'lucide-react';
import type { Item } from '../../types';
import { storageService, soundEffects } from '../../services/storage';
import { QRScannerModal } from '../common/QRScannerModal';

interface InventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InventarioModal: React.FC<InventarioModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [item, setItem] = useState<Item | null>(null);
  const [qtdFisica, setQtdFisica] = useState<number>(0);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [motivoAjuste, setMotivoAjuste] = useState<string>('Contagem periódica de inventário de obra');
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScanItem = (code: string) => {
    const found = storageService.getItemByQrCode(code);
    if (found) {
      setItem(found);
      setQtdFisica(found.estoqueAtual);
      setSucessoMsg(null);
      soundEffects.playSuccess();
    } else {
      soundEffects.playWarning();
      alert(`Item "${code}" não localizado.`);
    }
  };

  const diferenca = item ? qtdFisica - item.estoqueAtual : 0;

  const handleAplicarAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    // Atualiza o estoque do item
    const itens = storageService.getItens();
    const target = itens.find(i => i.id === item.id);
    if (target) {
      target.estoqueAtual = qtdFisica;
      storageService.saveItens(itens);
    }

    // Registra movimentação de auditoria
    storageService.addMovimentacao({
      tipo: 'ajuste_inventario',
      itemId: item.id,
      itemCodigo: item.codigo,
      itemNome: item.nome,
      itemCategoria: item.categoria,
      quantidade: Math.abs(diferenca),
      unidade: item.unidade,
      observacao: `Auditoria física: de ${item.estoqueAtual} para ${qtdFisica} ${item.unidade} (${diferenca >= 0 ? '+' : ''}${diferenca}). ${motivoAjuste}`,
      dataHora: new Date().toISOString()
    });

    soundEffects.playSuccess();
    setSucessoMsg(`Estoque de "${item.nome}" atualizado para ${qtdFisica} ${item.unidade}!`);
    setItem(null);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Inventário & Auditoria Física
              </h3>
              <p className="text-xs text-slate-400">
                Conferência física na prateleira vs dados do sistema
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {sucessoMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {sucessoMsg}
            </div>
          )}

          {/* Selecionar ou Bipar Item */}
          {!item ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="w-full py-8 bg-slate-800 hover:bg-slate-750 border-2 border-dashed border-amber-500/60 text-slate-100 font-bold rounded-2xl flex flex-col items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-amber-400">Bipar Etiqueta na Prateleira</span>
                <span className="text-xs text-slate-400">Apontar câmera para o QR Code do item no estoque</span>
              </button>

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ou selecione manualmente:
                </label>
                <select
                  onChange={(e) => {
                    const it = storageService.getItemById(e.target.value);
                    if (it) {
                      setItem(it);
                      setQtdFisica(it.estoqueAtual);
                      setSucessoMsg(null);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  defaultValue=""
                >
                  <option value="" disabled>Escolha o item a auditar...</option>
                  {storageService.getItens().map(i => (
                    <option key={i.id} value={i.id}>
                      [{i.codigo}] {i.nome} - Sistema: {i.estoqueAtual} {i.unidade} ({i.localizacao})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAplicarAjuste} className="space-y-4">
              {/* Item Info */}
              <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded">
                    {item.codigo}
                  </span>
                  <span className="text-xs text-slate-400">
                    Local: <b className="text-slate-200">{item.localizacao}</b>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-1">{item.nome}</h4>
              </div>

              {/* Comparador Sistema vs Físico */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    No Sistema
                  </span>
                  <p className="text-2xl font-black text-slate-200 mt-1">
                    {item.estoqueAtual}
                  </p>
                  <span className="text-[11px] text-slate-500">{item.unidade}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/50 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Contagem Física
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={qtdFisica}
                    onChange={(e) => setQtdFisica(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-center text-2xl font-black bg-transparent text-amber-400 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">{item.unidade}</span>
                </div>
              </div>

              {/* Indicador de Diferença */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                diferenca === 0
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : diferenca < 0
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-blue-950/40 border-blue-800 text-blue-300'
              }`}>
                <div className="flex items-center gap-2">
                  {diferenca === 0 ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : diferenca < 0 ? (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  )}
                  <span>
                    {diferenca === 0 
                      ? 'Estoque 100% conferido (sem divergência)' 
                      : diferenca < 0 
                      ? `FALTA DE MATERIAL (${Math.abs(diferenca)} ${item.unidade})` 
                      : `SOBRA DE MATERIAL (+${diferenca} ${item.unidade})`}
                  </span>
                </div>
                <span className="font-mono text-sm">
                  {diferenca > 0 ? `+${diferenca}` : diferenca}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Justificativa do Ajuste
                </label>
                <input
                  type="text"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Trocar Item
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  Salvar Ajuste
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanItem}
        title="Bipar Prateleira para Auditoria"
        expectedType="item"
      />
    </div>
  );
};
