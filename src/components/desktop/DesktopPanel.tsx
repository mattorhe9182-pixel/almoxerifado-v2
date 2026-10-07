import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { ItensManager } from './ItensManager';
import { EquipeManager } from './EquipeManager';
import { RelatoriosManager } from './RelatoriosManager';
import { EtiquetasPrintView } from './EtiquetasPrintView';

export const DesktopPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'itens' | 'equipe' | 'relatorios' | 'print_batch'>('dashboard');
  const [printBatchType, setPrintBatchType] = useState<'itens' | 'funcionarios'>('itens');

  const handlePrintBatch = (type: 'itens' | 'funcionarios') => {
    setPrintBatchType(type);
    setActiveTab('print_batch');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Sub-menu de Navegação do Painel Administrativo */}
      {activeTab !== 'print_batch' && (
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto no-print">
          {[
            { id: 'dashboard', label: 'Dashboard & Alertas', icon: LayoutDashboard },
            { id: 'itens', label: 'Materiais & Ferramentas', icon: Package },
            { id: 'equipe', label: 'Equipe & Crachás', icon: Users },
            { id: 'relatorios', label: 'Relatórios & Assinaturas', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Conteúdo da Aba */}
      <div>
        {activeTab === 'dashboard' && (
          <AdminDashboard
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'itens' && (
          <ItensManager onPrintBatch={handlePrintBatch} />
        )}

        {activeTab === 'equipe' && (
          <EquipeManager onPrintBatch={handlePrintBatch} />
        )}

        {activeTab === 'relatorios' && (
          <RelatoriosManager />
        )}

        {activeTab === 'print_batch' && (
          <EtiquetasPrintView
            type={printBatchType}
            onBack={() => setActiveTab('itens')}
          />
        )}
      </div>
    </div>
  );
};
