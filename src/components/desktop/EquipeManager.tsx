import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  QrCode, 
  Edit2, 
  Trash2, 
  Printer, 
  X, 
  Check, 
  UserCheck 
} from 'lucide-react';
import type { Funcionario } from '../../types';
import { storageService, soundEffects } from '../../services/storage';
import { QRCodeModal } from '../common/QRCodeModal';

interface EquipeManagerProps {
  onPrintBatch: (type: 'itens' | 'funcionarios') => void;
}

export const EquipeManager: React.FC<EquipeManagerProps> = ({ onPrintBatch }) => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => storageService.getFuncionarios());
  const [searchTerm, setSearchTerm] = useState('');
  const [qrModalFunc, setQrModalFunc] = useState<Funcionario | null>(null);

  // Form State
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState<Funcionario | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formMatricula, setFormMatricula] = useState('');
  const [formCargo, setFormCargo] = useState('Pedreiro Especializado');
  const [formSetor, setFormSetor] = useState('Alvenaria');
  const [formTelefone, setFormTelefone] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');

  const loadData = () => {
    setFuncionarios(storageService.getFuncionarios());
  };

  useEffect(() => {
    const handleDataUpdate = () => loadData();
    window.addEventListener('obrastock_data_updated', handleDataUpdate);
    return () => window.removeEventListener('obrastock_data_updated', handleDataUpdate);
  }, []);

  const handleOpenAdd = () => {
    const nextNum = 100 + funcionarios.length + 1;
    setEditingFunc(null);
    setFormMatricula(`OBR-${nextNum}`);
    setFormNome('');
    setFormCargo('Ajudante Geral');
    setFormSetor('Canteiro Geral');
    setFormTelefone('(11) 98000-0000');
    setFormFotoUrl(`https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face`);
    setModalFormOpen(true);
  };

  const handleOpenEdit = (f: Funcionario) => {
    setEditingFunc(f);
    setFormMatricula(f.matricula);
    setFormNome(f.nome);
    setFormCargo(f.cargo);
    setFormSetor(f.setor);
    setFormTelefone(f.telefone || '');
    setFormFotoUrl(f.fotoUrl);
    setModalFormOpen(true);
  };

  const handleSaveFunc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formMatricula.trim()) return;

    const funcSalvar: Funcionario = {
      id: editingFunc ? editingFunc.id : 'func-' + Date.now(),
      matricula: formMatricula.trim().toUpperCase(),
      nome: formNome.trim(),
      cargo: formCargo.trim(),
      setor: formSetor.trim(),
      telefone: formTelefone.trim() || undefined,
      fotoUrl: formFotoUrl.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      qrCode: `FUNC:${formMatricula.trim().toUpperCase()}`,
      ativo: true
    };

    storageService.upsertFuncionario(funcSalvar);
    soundEffects.playSuccess();
    setModalFormOpen(false);
    loadData();
  };

  const handleDeleteFunc = (id: string, nome: string) => {
    if (confirm(`Remover o colaborador "${nome}" do cadastro da obra?`)) {
      storageService.deleteFuncionario(id);
      loadData();
    }
  };

  const filteredFuncionarios = funcionarios.filter(f => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        f.nome.toLowerCase().includes(term) ||
        f.matricula.toLowerCase().includes(term) ||
        f.cargo.toLowerCase().includes(term) ||
        f.setor.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Cadastro de Equipe & Crachás
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Funcionários autorizados a retirar materiais e ferramentas no almoxarifado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPrintBatch('funcionarios')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
            title="Imprimir folha de crachás e etiquetas de capacete"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Imprimir Crachás em Lote
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Novo Colaborador
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, matrícula, cargo ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
          Total: <b className="text-slate-200">{filteredFuncionarios.length}</b> colaboradores
        </span>
      </div>

      {/* Grid de Cards de Funcionários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFuncionarios.map(func => (
          <div
            key={func.id}
            className="p-4 bg-slate-850 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-md"
          >
            <div className="flex items-start gap-3.5">
              <img
                src={func.fotoUrl}
                alt={func.nome}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] bg-slate-900 text-amber-400 px-2 py-0.5 rounded font-bold border border-slate-800">
                    {func.matricula}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Ativo
                  </span>
                </div>
                <h4 className="font-bold text-slate-100 text-sm mt-1 truncate">
                  {func.nome}
                </h4>
                <p className="text-xs text-slate-400">
                  {func.cargo}
                </p>
                <p className="text-[11px] text-slate-500">
                  Setor: {func.setor}
                </p>
              </div>
            </div>

            {/* Ações do Card */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => setQrModalFunc(func)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 transition-colors"
                title="Ver QR Code do Crachá / Capacete"
              >
                <QrCode className="w-3.5 h-3.5" />
                Crachá QR
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(func)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Editar dados"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteFunc(func.id, func.nome)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Excluir funcionário"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Formulário Funcionário */}
      {modalFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {editingFunc ? 'Editar Colaborador' : 'Cadastrar Colaborador na Obra'}
              </h3>
              <button onClick={() => setModalFormOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFunc} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Matrícula do Crachá *
                </label>
                <input
                  type="text"
                  required
                  value={formMatricula}
                  onChange={(e) => setFormMatricula(e.target.value)}
                  placeholder="Ex: OBR-106"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Sebastião Alves da Silva"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Função / Cargo
                  </label>
                  <input
                    type="text"
                    required
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="Ex: Pedreiro, Eletricista"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Frente de Trabalho / Setor
                  </label>
                  <input
                    type="text"
                    value={formSetor}
                    onChange={(e) => setFormSetor(e.target.value)}
                    placeholder="Ex: Fundação, Acabamento"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  URL da Foto de Identificação
                </label>
                <input
                  type="text"
                  value={formFotoUrl}
                  onChange={(e) => setFormFotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalFormOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" /> Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      <QRCodeModal
        isOpen={!!qrModalFunc}
        onClose={() => setQrModalFunc(null)}
        data={qrModalFunc ? {
          type: 'funcionario',
          payload: qrModalFunc.qrCode,
          funcionario: qrModalFunc
        } : null}
      />
    </div>
  );
};
