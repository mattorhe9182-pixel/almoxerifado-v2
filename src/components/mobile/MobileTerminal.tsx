import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  ClipboardCheck, 
  Camera, 
  AlertTriangle, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { storageService, soundEffects } from '../../services/storage';
import type { Item, Funcionario, Movimentacao, EmprestimoFerramenta } from '../../types';
import { SaidaFlow } from './SaidaFlow';
import { EntradaModal } from './EntradaModal';
import { DevolucaoModal } from './DevolucaoModal';
import { InventarioModal } from './InventarioModal';
import { QRScannerModal } from '../common/QRScannerModal';
import { QRCodeModal } from '../common/QRCodeModal';

export const MobileTerminal: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<'home' | 'saida'>('home');
  const [modalEntrada, setModalEntrada] = useState(false);
  const [modalDevolucao, setModalDevolucao] = useState(false);
  const [modalInventario, setModalInventario] = useState(false);
  const [modalScannerGeral, setModalScannerGeral] = useState(false);

  // Modal para exibir detalhes do que foi bipado no scanner geral
  const [quickInspectData, setQuickInspectData] = useState<{
    type: 'item' | 'funcionario';
    payload: string;
    item?: Item;
    funcionario?: Funcionario;
  } | null>(null);

  // Dados reativos
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(() => storageService.getMovimentacoes().slice(0, 6));
  const [emprestimos, setEmprestimos] = useState<EmprestimoFerramenta[]>(() =>
    storageService.getEmprestimos().filter(e => e.status === 'em_uso' || e.status === 'atrasado')
  );
  const [itensCriticos, setItensCriticos] = useState<Item[]>(() =>
    storageService.getItens().filter(i => i.estoqueAtual <= i.estoqueMinimo)
  );

  const reloadData = () => {
    const movs = storageService.getMovimentacoes();
    setMovimentacoes(movs.slice(0, 6));

    const emps = storageService.getEmprestimos().filter(e => e.status === 'em_uso' || e.status === 'atrasado');
    setEmprestimos(emps);

    const criticos = storageService.getItens().filter(i => i.estoqueAtual <= i.estoqueMinimo);
    setItensCriticos(criticos);
  };

  useEffect(() => {
    const handleDataUpdate = () => reloadData();
    window.addEventListener('obrastock_data_updated', handleDataUpdate);
    return () => window.removeEventListener('obrastock_data_updated', handleDataUpdate);
  }, []);

  const atrasadosCount = emprestimos.filter(e => e.status === 'atrasado').length;

  const handleQuickScan = (code: string) => {
    const it = storageService.getItemByQrCode(code);
    if (it) {
      setQuickInspectData({
        type: 'item',
        payload: it.qrCode,
        item: it
      });
      return;
    }
    const func = storageService.getFuncionarioByQrCode(code);
    if (func) {
      setQuickInspectData({
        type: 'funcionario',
        payload: func.qrCode,
        funcionario: func
      });
      return;
    }
    alert(`Código "${code}" lido com sucesso, porém não está cadastrado.`);
  };

  if (activeFlow === 'saida') {
    return (
      <SaidaFlow
        onBack={() => setActiveFlow('home')}
        onSuccess={() => {
          setActiveFlow('home');
          reloadData();
        }}
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 space-y-4 sm:space-y-5 animate-in fade-in pb-16">
      
      {/* Alertas Críticos da Obra (Estoque ou Ferramentas Atrasadas) */}
      {(atrasadosCount > 0 || itensCriticos.length > 0) && (
        <div className="space-y-2">
          {atrasadosCount > 0 && (
            <div 
              onClick={() => setModalDevolucao(true)}
              className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-rose-950/60 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-200">
                    {atrasadosCount} Ferramenta{atrasadosCount > 1 ? 's' : ''} com devolução atrasada!
                  </h4>
                  <p className="text-[11px] text-rose-300/80">
                    Clique para ver os colaboradores e cobrar a devolução.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </div>
          )}

          {itensCriticos.length > 0 && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-200">
                    {itensCriticos.length} Material(is) em Estoque Crítico
                  </h4>
                  <p className="text-[11px] text-amber-300/80">
                    Abaixo do estoque mínimo (ex: {itensCriticos[0]?.nome}).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grade de 4 Grandes Botões de Ação do Almoxarife */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* BOTÃO PRINCIPAL: NOVA SAÍDA */}
        <button
          onClick={() => {
            soundEffects.playBeep();
            setActiveFlow('saida');
          }}
          className="sm:col-span-2 p-5 sm:p-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-between transition-transform active:scale-[0.98] group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-950/15 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-8 h-8 stroke-[2.8]" />
            </div>
            <div className="text-left">
              <span className="text-xl sm:text-2xl font-black block tracking-tight">
                NOVA SAÍDA
              </span>
              <span className="text-xs font-bold text-slate-950/80 block mt-0.5">
                Bipar Crachá ➜ Bipar Material ➜ Assinar
              </span>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 stroke-[3] group-hover:translate-x-1 transition-transform" />
        </button>

        {/* RECEBIMENTO / ENTRADA */}
        <button
          onClick={() => {
            soundEffects.playBeep();
            setModalEntrada(true);
          }}
          className="p-4 sm:p-5 bg-slate-800 hover:bg-slate-750 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl shadow-lg flex items-center gap-3.5 transition-transform active:scale-[0.98] text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ArrowDownRight className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-100 block">
              Entrada / NF
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Receber caminhão de entrega
            </span>
          </div>
        </button>

        {/* DEVOLUÇÃO DE FERRAMENTAS */}
        <button
          onClick={() => {
            soundEffects.playBeep();
            setModalDevolucao(true);
          }}
          className="p-4 sm:p-5 bg-slate-800 hover:bg-slate-750 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl shadow-lg flex items-center justify-between transition-transform active:scale-[0.98] text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <RotateCcw className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-100 block">
                Devolução
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Retorno de ferramentas
              </span>
            </div>
          </div>
          {emprestimos.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {emprestimos.length}
            </span>
          )}
        </button>

        {/* INVENTÁRIO / AUDITORIA */}
        <button
          onClick={() => {
            soundEffects.playBeep();
            setModalInventario(true);
          }}
          className="sm:col-span-2 p-3.5 sm:p-4 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-2xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-700/60 text-slate-300 group-hover:text-amber-400 transition-colors">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-slate-200 block">
                Auditoria de Estoque / Inventário
              </span>
              <span className="text-xs text-slate-400 block">
                Bipar prateleiras e bater contagem física vs sistema
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
        </button>
      </div>

      {/* Botão de Consulta Rápida por Bip */}
      <button
        onClick={() => setModalScannerGeral(true)}
        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-amber-500/50 text-xs font-semibold text-slate-400 hover:text-amber-300 flex items-center justify-center gap-2 transition-colors"
      >
        <Camera className="w-4 h-4" />
        <span>Bipar para Consultar Qualquer Código (Sem Movimentar)</span>
      </button>

      {/* Últimas Movimentações na Porta do Almoxarifado */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Últimas Movimentações
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Tempo Real</span>
        </div>

        <div className="space-y-1.5">
          {movimentacoes.length === 0 ? (
            <div className="p-6 bg-slate-850 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
              Nenhuma movimentação registrada até o momento.
            </div>
          ) : (
            movimentacoes.map(m => {
              const isSaida = m.tipo === 'saida';
              const isEntrada = m.tipo === 'entrada';
              return (
                <div
                  key={m.id}
                  className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isSaida 
                        ? 'bg-amber-500/10 text-amber-400' 
                        : isEntrada 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {isSaida ? <ArrowUpRight className="w-4 h-4" /> : isEntrada ? <ArrowDownRight className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-200 truncate">
                        {m.itemNome}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {m.funcionarioNome ? m.funcionarioNome : 'Recebimento de Carga'}
                        {m.funcionarioMatricula && ` (${m.funcionarioMatricula})`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono font-bold block ${
                      isSaida ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {isSaida ? '-' : '+'}{m.quantidade} {m.unidade}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(m.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modais de Fluxo */}
      <EntradaModal
        isOpen={modalEntrada}
        onClose={() => setModalEntrada(false)}
        onSuccess={reloadData}
      />

      <DevolucaoModal
        isOpen={modalDevolucao}
        onClose={() => setModalDevolucao(false)}
        onSuccess={reloadData}
      />

      <InventarioModal
        isOpen={modalInventario}
        onClose={() => setModalInventario(false)}
        onSuccess={reloadData}
      />

      <QRScannerModal
        isOpen={modalScannerGeral}
        onClose={() => setModalScannerGeral(false)}
        onScanSuccess={handleQuickScan}
        title="Consulta Rápida de QR Code"
        expectedType="qualquer"
      />

      <QRCodeModal
        isOpen={!!quickInspectData}
        onClose={() => setQuickInspectData(null)}
        data={quickInspectData}
      />
    </div>
  );
};
