import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Calendar 
} from 'lucide-react';
import { storageService } from '../../services/storage';
import type { Item, Movimentacao, EmprestimoFerramenta } from '../../types';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'itens' | 'equipe' | 'relatorios') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [itens, setItens] = useState<Item[]>(() => storageService.getItens());
  const [emprestimos, setEmprestimos] = useState<EmprestimoFerramenta[]>(() => storageService.getEmprestimos());
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(() => storageService.getMovimentacoes());
  const [today] = useState(() => new Date());

  const loadData = () => {
    setItens(storageService.getItens());
    setEmprestimos(storageService.getEmprestimos());
    setMovimentacoes(storageService.getMovimentacoes());
  };

  useEffect(() => {
    const handleDataUpdate = () => loadData();
    window.addEventListener('obrastock_data_updated', handleDataUpdate);
    return () => window.removeEventListener('obrastock_data_updated', handleDataUpdate);
  }, []);

  // Cálculos de Indicadores
  const valorTotalEstoque = itens.reduce((acc, curr) => acc + (curr.estoqueAtual * curr.precoUnitario), 0);
  const itensCriticos = itens.filter(i => i.estoqueAtual <= i.estoqueMinimo);
  const ferramentasEmUso = emprestimos.filter(e => e.status === 'em_uso' || e.status === 'atrasado');
  const ferramentasAtrasadas = emprestimos.filter(e => e.status === 'atrasado');

  // Materiais mais consumidos (saídas)
  const consumoPorItem: Record<string, { nome: string; total: number; unidade: string; codigo: string }> = {};
  movimentacoes.filter(m => m.tipo === 'saida').forEach(m => {
    if (!consumoPorItem[m.itemId]) {
      consumoPorItem[m.itemId] = { nome: m.itemNome, total: 0, unidade: m.unidade, codigo: m.itemCodigo };
    }
    consumoPorItem[m.itemId].total += m.quantidade;
  });

  const rankingConsumo = Object.values(consumoPorItem)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner Informativo de Gestão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-850 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Painel Geral do Engenheiro / Gestor de Obra
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Visão consolidada de inventário, custos imobilizados e ferramentas em campo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Hoje: {today.toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Grid de 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor em Estoque */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Valor em R$ no Estoque
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">
            {valorTotalEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">{itens.length}</span> itens cadastrados no canteiro
          </p>
        </div>

        {/* Card 2: Ferramentas em Campo */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ferramentas em Campo
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">
            {ferramentasEmUso.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {ferramentasAtrasadas.length > 0 ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {ferramentasAtrasadas.length} com devolução atrasada!
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Todas dentro do prazo
              </span>
            )}
          </p>
        </div>

        {/* Card 3: Alertas de Estoque Mínimo */}
        <div className={`p-5 rounded-2xl border shadow-md ${
          itensCriticos.length > 0 
            ? 'bg-amber-950/20 border-amber-800/80' 
            : 'bg-slate-850 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Estoque Mínimo Crítico
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
            {itensCriticos.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Materiais que precisam de compra urgente
          </p>
        </div>

        {/* Card 4: Total de Movimentações */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Saídas Registradas
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">
            {movimentacoes.filter(m => m.tipo === 'saida').length}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Com registro e assinatura digital
          </p>
        </div>
      </div>

      {/* Grid: Alertas de Reposição + Ferramentas Pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela de Materiais em Estoque Crítico */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                Alerta de Reposição (Estoque Mínimo Atingido)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('itens')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Ver Catálogo
            </button>
          </div>

          {itensCriticos.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Todos os materiais estão acima do estoque de segurança!
            </div>
          ) : (
            <div className="space-y-2.5">
              {itensCriticos.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-900 rounded-xl border border-amber-900/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] text-amber-400 font-bold">{item.codigo}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">{item.localizacao}</span>
                    </div>
                    <p className="font-bold text-slate-200 truncate">{item.nome}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-rose-400 text-sm">
                      {item.estoqueAtual} / {item.estoqueMinimo} {item.unidade}
                    </p>
                    <span className="text-[10px] text-slate-500">Saldo Atual / Mínimo</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ferramentas e Equipamentos Pendentes de Devolução */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                Ferramentas Pendentes de Devolução ({ferramentasEmUso.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('relatorios')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Ver Histórico
            </button>
          </div>

          {ferramentasEmUso.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Nenhuma ferramenta emprestada no momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {ferramentasEmUso.map(emp => {
                const isAtrasado = emp.status === 'atrasado';
                return (
                  <div
                    key={emp.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isAtrasado
                        ? 'bg-rose-950/30 border-rose-800/80'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-slate-400">{emp.itemCodigo}</span>
                        {isAtrasado ? (
                          <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded">
                            Devolução Atrasada!
                          </span>
                        ) : (
                          <span className="text-[10px] text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded">
                            Em uso na obra
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-200 truncate">{emp.itemNome}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Em posse de: <b className="text-slate-300">{emp.funcionarioNome}</b> ({emp.funcionarioMatricula})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">
                        Retirado em
                      </span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {new Date(emp.dataRetirada).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Seção dos Mais Consumidos */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800">
        <h3 className="font-bold text-slate-100 text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Materiais Mais Consumidos na Obra
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {rankingConsumo.length === 0 ? (
            <p className="text-xs text-slate-500 col-span-full">Sem saídas registradas ainda.</p>
          ) : (
            rankingConsumo.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-amber-500 uppercase">
                  #{idx + 1} Mais Usado
                </span>
                <p className="font-bold text-slate-200 text-xs truncate mt-1">{item.nome}</p>
                <p className="text-lg font-black text-amber-400 mt-1">
                  {item.total} <span className="text-xs font-normal text-slate-400">{item.unidade}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
