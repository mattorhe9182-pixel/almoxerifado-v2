import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  Camera, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Wrench,
  Search
} from 'lucide-react';
import type { EmprestimoFerramenta, Funcionario } from '../../types';
import { storageService, soundEffects } from '../../services/storage';
import { QRScannerModal } from '../common/QRScannerModal';
import { SignaturePad } from '../common/SignaturePad';

interface DevolucaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DevolucaoModal: React.FC<DevolucaoModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [emprestimos, setEmprestimos] = useState<EmprestimoFerramenta[]>(() =>
    storageService.getEmprestimos().filter(e => e.status === 'em_uso' || e.status === 'atrasado')
  );
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<EmprestimoFerramenta | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = () => {
    const list = storageService.getEmprestimos().filter(e => e.status === 'em_uso' || e.status === 'atrasado');
    setEmprestimos(list);
  };

  if (!isOpen) return null;

  const visibleEmprestimos = selectedFuncionario
    ? emprestimos.filter(emp => emp.funcionarioId === selectedFuncionario.id)
    : emprestimos;

  const handleScanFuncionario = (code: string) => {
    const found = storageService.getFuncionarioByQrCode(code);
    if (found) {
      setSelectedFuncionario(found);
      soundEffects.playSuccess();
    } else {
      soundEffects.playWarning();
      alert(`Funcionário "${code}" não encontrado.`);
    }
  };

  const filteredEmprestimos = visibleEmprestimos.filter(emp => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        emp.itemNome.toLowerCase().includes(term) ||
        emp.funcionarioNome.toLowerCase().includes(term) ||
        emp.itemCodigo.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleConfirmarDevolucao = () => {
    if (!selectedEmprestimo) return;

    const ok = storageService.devolverEmprestimo(selectedEmprestimo.id, assinaturaDataUrl || undefined);
    if (ok) {
      soundEffects.playSuccess();
      onSuccess();
      setSelectedEmprestimo(null);
      loadData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Devolução de Ferramentas / Equipamentos
              </h3>
              <p className="text-xs text-slate-400">
                Baixar empréstimo e retornar ferramenta ao estoque disponível
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtro por Bip de Crachá ou Busca */}
        {!selectedEmprestimo && (
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                <Camera className="w-3.5 h-3.5" /> Bipar Crachá
              </button>
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por ferramenta ou funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {selectedFuncionario && (
              <div className="flex items-center justify-between p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs">
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Filtrado por: <b>{selectedFuncionario.nome}</b>
                </span>
                <button
                  onClick={() => setSelectedFuncionario(null)}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Limpar Filtro
                </button>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {/* Confirmação de Devolução com Assinatura */}
          {selectedEmprestimo ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-slate-800 rounded-xl border border-amber-500/40">
                <div className="flex items-center justify-between text-xs text-amber-400 font-mono mb-1">
                  <span>{selectedEmprestimo.itemCodigo}</span>
                  <span className="uppercase font-bold">{selectedEmprestimo.status}</span>
                </div>
                <h4 className="text-base font-bold text-slate-100">{selectedEmprestimo.itemNome}</h4>
                <div className="text-xs text-slate-300 mt-2 space-y-1">
                  <p>Colaborador: <b>{selectedEmprestimo.funcionarioNome}</b> ({selectedEmprestimo.funcionarioMatricula})</p>
                  <p>Retirado em: <b>{new Date(selectedEmprestimo.dataRetirada).toLocaleString('pt-BR')}</b></p>
                  <p>Quantidade: <b>{selectedEmprestimo.quantidade} un</b></p>
                </div>
              </div>

              {/* Coleta de Assinatura de Devolução */}
              <SignaturePad
                onSignatureChange={(url) => setAssinaturaDataUrl(url)}
                title="Assinatura da Devolução (Conferência do Almoxarife)"
                subtitle="O almoxarife ou o colaborador pode assinar confirmando o estado da ferramenta devolvida."
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmprestimo(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Voltar para Lista
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarDevolucao}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirmar Retorno
                </button>
              </div>
            </div>
          ) : (
            /* Lista de Ferramentas Pendentes */
            <div>
              {filteredEmprestimos.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Wrench className="w-12 h-12 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p className="text-sm font-semibold text-slate-300">Nenhuma ferramenta pendente no momento</p>
                  <p className="text-xs text-slate-500 mt-1">Todas as ferramentas retiradas foram devolvidas ao almoxarifado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Ferramentas em posse dos trabalhadores ({filteredEmprestimos.length}):
                  </p>
                  {filteredEmprestimos.map(emp => {
                    const isAtrasado = emp.status === 'atrasado';
                    return (
                      <div
                        key={emp.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isAtrasado
                            ? 'bg-rose-950/30 border-rose-800/80'
                            : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                              {emp.itemCodigo}
                            </span>
                            {isAtrasado ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" /> Atrasado
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" /> Em Uso
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-100 truncate">
                            {emp.itemNome}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Com: <b className="text-slate-200">{emp.funcionarioNome}</b> ({emp.funcionarioMatricula})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Retirado em: {new Date(emp.dataRetirada).toLocaleString('pt-BR')}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedEmprestimo(emp);
                            soundEffects.playBeep();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shrink-0 shadow-md shadow-amber-500/10"
                        >
                          Devolver
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanFuncionario}
        title="Bipar Crachá do Colaborador"
        expectedType="funcionario"
      />
    </div>
  );
};
