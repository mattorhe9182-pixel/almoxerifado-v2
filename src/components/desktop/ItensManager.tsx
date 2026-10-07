import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  QrCode, 
  Edit2, 
  Trash2, 
  Printer, 
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import type { Item, CategoriaItem } from '../../types';
import { storageService, soundEffects } from '../../services/storage';
import { QRCodeModal } from '../common/QRCodeModal';

interface ItensManagerProps {
  onPrintBatch: (type: 'itens' | 'funcionarios') => void;
}

export const ItensManager: React.FC<ItensManagerProps> = ({ onPrintBatch }) => {
  const [itens, setItens] = useState<Item[]>(() => storageService.getItens());
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | 'consumo' | 'ferramenta'>('todos');
  const [somenteAlertas, setSomenteAlertas] = useState(false);

  // Modal QR Code
  const [qrModalItem, setQrModalItem] = useState<Item | null>(null);

  // Modal Novo / Editar Item
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form State
  const [formCodigo, setFormCodigo] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaItem>('consumo');
  const [formUnidade, setFormUnidade] = useState('un');
  const [formEstoqueAtual, setFormEstoqueAtual] = useState(10);
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState(5);
  const [formPreco, setFormPreco] = useState(25.00);
  const [formLocalizacao, setFormLocalizacao] = useState('Prateleira A1');
  const [formDescricao, setFormDescricao] = useState('');

  const loadData = () => {
    setItens(storageService.getItens());
  };

  useEffect(() => {
    const handleDataUpdate = () => loadData();
    window.addEventListener('obrastock_data_updated', handleDataUpdate);
    return () => window.removeEventListener('obrastock_data_updated', handleDataUpdate);
  }, []);

  const handleOpenAdd = () => {
    const nextNum = itens.length + 1;
    setEditingItem(null);
    setFormCodigo(`MAT-${String(nextNum).padStart(3, '0')}`);
    setFormNome('');
    setFormCategoria('consumo');
    setFormUnidade('un');
    setFormEstoqueAtual(20);
    setFormEstoqueMinimo(5);
    setFormPreco(30.00);
    setFormLocalizacao('Prateleira Principal');
    setFormDescricao('');
    setModalFormOpen(true);
  };

  const handleOpenEdit = (it: Item) => {
    setEditingItem(it);
    setFormCodigo(it.codigo);
    setFormNome(it.nome);
    setFormCategoria(it.categoria);
    setFormUnidade(it.unidade);
    setFormEstoqueAtual(it.estoqueAtual);
    setFormEstoqueMinimo(it.estoqueMinimo);
    setFormPreco(it.precoUnitario);
    setFormLocalizacao(it.localizacao);
    setFormDescricao(it.descricao || '');
    setModalFormOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formCodigo.trim()) return;

    const itemSalvar: Item = {
      id: editingItem ? editingItem.id : 'item-' + Date.now(),
      codigo: formCodigo.trim().toUpperCase(),
      nome: formNome.trim(),
      categoria: formCategoria,
      unidade: formUnidade.trim(),
      estoqueAtual: Number(formEstoqueAtual) || 0,
      estoqueMinimo: Number(formEstoqueMinimo) || 0,
      precoUnitario: Number(formPreco) || 0,
      localizacao: formLocalizacao.trim(),
      qrCode: `ITEM:${formCodigo.trim().toUpperCase()}`,
      descricao: formDescricao.trim() || undefined
    };

    storageService.upsertItem(itemSalvar);
    soundEffects.playSuccess();
    setModalFormOpen(false);
    loadData();
  };

  const handleDeleteItem = (id: string, nome: string) => {
    if (confirm(`Excluir o item "${nome}" do cadastro?`)) {
      storageService.deleteItem(id);
      loadData();
    }
  };

  const filteredItens = itens.filter(item => {
    if (filtroCategoria !== 'todos' && item.categoria !== filtroCategoria) return false;
    if (somenteAlertas && item.estoqueAtual > item.estoqueMinimo) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.nome.toLowerCase().includes(term) ||
        item.codigo.toLowerCase().includes(term) ||
        item.localizacao.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Catálogo de Materiais & Ferramentas
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Cadastre os itens da obra e imprima etiquetas com QR Code para colar no canteiro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPrintBatch('itens')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
            title="Imprimir folha A4 com todos os QR Codes de prateleira"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Imprimir Folha de Etiquetas
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Novo Item
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, código, prateleira..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['todos', 'consumo', 'ferramenta'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filtroCategoria === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'todos' ? 'Todos os Itens' : cat === 'consumo' ? 'Consumo' : 'Ferramentas'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSomenteAlertas(!somenteAlertas)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              somenteAlertas
                ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Só Alertas de Mínimo
          </button>
        </div>
      </div>

      {/* Tabela de Itens */}
      <div className="bg-slate-850 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="p-3.5 font-bold">Código / QR</th>
                <th className="p-3.5 font-bold">Material / Ferramenta</th>
                <th className="p-3.5 font-bold">Tipo</th>
                <th className="p-3.5 font-bold">Localização</th>
                <th className="p-3.5 font-bold text-center">Estoque Atual</th>
                <th className="p-3.5 font-bold text-center">Mínimo</th>
                <th className="p-3.5 font-bold text-right">Preço Unit.</th>
                <th className="p-3.5 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredItens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhum item encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredItens.map(item => {
                  const isCritico = item.estoqueAtual <= item.estoqueMinimo;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Código e Botão do QR */}
                      <td className="p-3.5 whitespace-nowrap">
                        <button
                          onClick={() => setQrModalItem(item)}
                          className="flex items-center gap-2 group text-left"
                          title="Clique para ver / imprimir etiqueta QR Code"
                        >
                          <div className="p-1.5 bg-slate-900 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 rounded-lg border border-slate-700 transition-colors">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <span className="font-mono font-bold text-slate-200 group-hover:text-amber-400">
                            {item.codigo}
                          </span>
                        </button>
                      </td>

                      {/* Nome e Descrição */}
                      <td className="p-3.5">
                        <p className="font-bold text-slate-100">{item.nome}</p>
                        {item.descricao && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">{item.descricao}</p>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.categoria === 'consumo'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {item.categoria === 'consumo' ? 'Consumo' : 'Ferramenta'}
                        </span>
                      </td>

                      {/* Localização */}
                      <td className="p-3.5 text-slate-300 whitespace-nowrap">
                        {item.localizacao}
                      </td>

                      {/* Estoque Atual */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`font-bold font-mono text-sm ${
                          isCritico ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {item.estoqueAtual} {item.unidade}
                        </span>
                        {isCritico && (
                          <span className="block text-[9px] uppercase font-bold text-rose-400 tracking-wider">
                            Crítico
                          </span>
                        )}
                      </td>

                      {/* Estoque Mínimo */}
                      <td className="p-3.5 text-center font-mono text-slate-400 whitespace-nowrap">
                        {item.estoqueMinimo} {item.unidade}
                      </td>

                      {/* Preço Unitário */}
                      <td className="p-3.5 text-right font-mono text-slate-300 whitespace-nowrap">
                        {item.precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setQrModalItem(item)}
                            className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Ver QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.nome)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Excluir item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Item */}
      {modalFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {editingItem ? 'Editar Item do Estoque' : 'Cadastrar Novo Material ou Ferramenta'}
              </h3>
              <button onClick={() => setModalFormOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Código do Item *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="Ex: MAT-008 ou FER-006"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Tipo / Categoria *
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as CategoriaItem)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="consumo">Consumo (Baixa Direta)</option>
                    <option value="ferramenta">Ferramenta / Equipamento (Empréstimo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nome Completo do Item *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Betoneira 400L ou Cimento CP-II 50kg"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Unidade
                  </label>
                  <input
                    type="text"
                    required
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    placeholder="un, saco, m³"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formEstoqueAtual}
                    onChange={(e) => setFormEstoqueAtual(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formEstoqueMinimo}
                    onChange={(e) => setFormEstoqueMinimo(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPreco}
                    onChange={(e) => setFormPreco(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Localização no Estoque
                  </label>
                  <input
                    type="text"
                    value={formLocalizacao}
                    onChange={(e) => setFormLocalizacao(e.target.value)}
                    placeholder="Ex: Prateleira B2, Baia 01"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Descrição / Especificações
                </label>
                <textarea
                  rows={2}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Detalhes técnicos, marca, modelo ou aplicação..."
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
                  <Check className="w-4 h-4" /> Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Individual do QR Code */}
      <QRCodeModal
        isOpen={!!qrModalItem}
        onClose={() => setQrModalItem(null)}
        data={qrModalItem ? {
          type: 'item',
          payload: qrModalItem.qrCode,
          item: qrModalItem
        } : null}
      />
    </div>
  );
};
