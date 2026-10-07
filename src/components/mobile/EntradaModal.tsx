import React, { useState } from 'react';
import { X, ArrowDownRight, Camera, Check } from 'lucide-react';
import type { Item } from '../../types';
import { storageService, soundEffects } from '../../services/storage';
import { QRScannerModal } from '../common/QRScannerModal';

interface EntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EntradaModal: React.FC<EntradaModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [item, setItem] = useState<Item | null>(null);
  const [quantidade, setQuantidade] = useState<number>(10);
  const [numeroNF, setNumeroNF] = useState<string>('');
  const [fornecedor, setFornecedor] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);

  if (!isOpen) return null;

  const handleScanItem = (code: string) => {
    const found = storageService.getItemByQrCode(code);
    if (found) {
      setItem(found);
      soundEffects.playSuccess();
    } else {
      soundEffects.playWarning();
      alert(`Item "${code}" não encontrado.`);
    }
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) {
      alert('Selecione ou bipe o material.');
      return;
    }
    if (quantidade <= 0) {
      alert('Quantidade inválida.');
      return;
    }

    storageService.addMovimentacao({
      tipo: 'entrada',
      itemId: item.id,
      itemCodigo: item.codigo,
      itemNome: item.nome,
      itemCategoria: item.categoria,
      quantidade: quantidade,
      unidade: item.unidade,
      numeroNotaFiscal: numeroNF.trim() || undefined,
      observacao: fornecedor.trim() ? `Fornecedor: ${fornecedor.trim()}` : undefined,
      dataHora: new Date().toISOString(),
    });

    soundEffects.playSuccess();
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Recebimento de Carga (Entrada)
              </h3>
              <p className="text-xs text-slate-400">
                Lançar chegada de materiais e notas fiscais
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="p-5 space-y-4">
          {/* Material Selecionado ou Botão de Bipar */}
          {item ? (
            <div className="p-3.5 bg-slate-800/90 rounded-xl border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded">
                  {item.codigo}
                </span>
                <p className="text-sm font-bold text-slate-100 mt-1">{item.nome}</p>
                <p className="text-xs text-slate-400">
                  Estoque atual: <b className="text-emerald-400">{item.estoqueAtual} {item.unidade}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setItem(null)}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Trocar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Selecionar ou Bipar o Material
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Bipar QR Code
                </button>
              </div>
              <select
                onChange={(e) => {
                  const it = storageService.getItemById(e.target.value);
                  if (it) setItem(it);
                }}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                defaultValue=""
              >
                <option value="" disabled>Ou escolha na lista de materiais...</option>
                {storageService.getItens().map(i => (
                  <option key={i.id} value={i.id}>
                    [{i.codigo}] {i.nome} (Atual: {i.estoqueAtual} {i.unidade})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantidade Recebida */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              2. Quantidade Recebida
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 0))}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs uppercase font-bold text-slate-400 px-3 py-2.5 bg-slate-800 rounded-xl">
                {item ? item.unidade : 'un'}
              </span>
            </div>
          </div>

          {/* Dados Fiscais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Número da NF-e (Opcional)
              </label>
              <input
                type="text"
                value={numeroNF}
                onChange={(e) => setNumeroNF(e.target.value)}
                placeholder="Ex: NF 10429 / Série 1"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Fornecedor / Transportadora
              </label>
              <input
                type="text"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Ex: Votorantim Cimentos"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!item}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" /> Confirmar Entrada
            </button>
          </div>
        </form>
      </div>

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanItem}
        title="Bipar Etiqueta do Material"
        expectedType="item"
      />
    </div>
  );
};
