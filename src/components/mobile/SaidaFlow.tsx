import React, { useState } from 'react';
import { 
  ArrowLeft, 
  UserCheck, 
  Package, 
  Hash, 
  PenTool, 
  Camera, 
  AlertTriangle, 
  Clock, 
  ShieldAlert,
  Plus,
  Minus,
  Check
} from 'lucide-react';
import type { Funcionario, Item } from '../../types';
import { storageService, soundEffects } from '../../services/storage';
import { QRScannerModal } from '../common/QRScannerModal';
import { SignaturePad } from '../common/SignaturePad';

interface SaidaFlowProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const SaidaFlow: React.FC<SaidaFlowProps> = ({ onBack, onSuccess }) => {
  const [today] = useState(() => new Date());

  // Passos: 1 = Solicitante, 2 = Material, 3 = Quantidade, 4 = Assinatura & Conclusão
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Dados da saída
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacao, setObservacao] = useState<string>('');
  const [diasPrevisaoDevolucao, setDiasPrevisaoDevolucao] = useState<number>(1);
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string | null>(null);

  // Modais de escaneamento
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [scannerTarget, setScannerTarget] = useState<'funcionario' | 'item'>('funcionario');

  // Validações e Alertas
  const [erroQuantidade, setErroQuantidade] = useState<string | null>(null);
  const [alertaMsg, setAlertaMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificação de ferramentas pendentes do funcionário
  const emprestimosAtivosFuncionario = funcionario 
    ? storageService.getEmprestimos().filter(e => e.funcionarioId === funcionario.id && (e.status === 'em_uso' || e.status === 'atrasado'))
    : [];

  // Handler ao bipar funcionário
  const handleScanFuncionario = (code: string) => {
    setAlertaMsg(null);
    const found = storageService.getFuncionarioByQrCode(code);
    if (found) {
      setFuncionario(found);
      soundEffects.playSuccess();
      setStep(2); // Avança automaticamente para bipar material
    } else {
      soundEffects.playWarning();
      setAlertaMsg(`Colaborador com código "${code}" não foi localizado no cadastro.`);
    }
  };

  // Handler ao bipar material
  const handleScanItem = (code: string) => {
    setAlertaMsg(null);
    const found = storageService.getItemByQrCode(code);
    if (found) {
      if (found.estoqueAtual <= 0) {
        soundEffects.playWarning();
        setAlertaMsg(`ATENÇÃO: O item "${found.nome}" está com ESTOQUE ZERADO no sistema!`);
      }
      setItem(found);
      setQuantidade(1);
      soundEffects.playSuccess();
      setStep(3); // Avança para quantidade
    } else {
      soundEffects.playWarning();
      setAlertaMsg(`Material com código "${code}" não foi localizado no cadastro.`);
    }
  };

  // Ajustes de quantidade
  const handleQtdChange = (val: number) => {
    if (!item) return;
    const novaQtd = Math.max(1, val);
    if (novaQtd > item.estoqueAtual) {
      setErroQuantidade(`Estoque insuficiente! Disponível no almoxarifado: ${item.estoqueAtual} ${item.unidade}`);
    } else {
      setErroQuantidade(null);
    }
    setQuantidade(novaQtd);
  };

  const addQtd = (delta: number) => {
    handleQtdChange(quantidade + delta);
  };

  // Finalização da Saída
  const handleFinalizar = () => {
    if (!funcionario || !item) return;

    if (quantidade <= 0 || quantidade > item.estoqueAtual) {
      soundEffects.playWarning();
      alert('Quantidade inválida para saída de estoque.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Registra a movimentação geral de saída
      storageService.addMovimentacao({
        tipo: 'saida',
        itemId: item.id,
        itemCodigo: item.codigo,
        itemNome: item.nome,
        itemCategoria: item.categoria,
        quantidade: quantidade,
        unidade: item.unidade,
        funcionarioId: funcionario.id,
        funcionarioNome: funcionario.nome,
        funcionarioMatricula: funcionario.matricula,
        dataHora: new Date().toISOString(),
        observacao: observacao.trim() || undefined,
        assinaturaBase64: assinaturaDataUrl || undefined,
      });

      // 2. Se for FERRAMENTA, cria o empréstimo pendente de retorno!
      if (item.categoria === 'ferramenta') {
        const previsao = new Date();
        previsao.setDate(previsao.getDate() + diasPrevisaoDevolucao);

        storageService.addEmprestimo({
          itemId: item.id,
          itemCodigo: item.codigo,
          itemNome: item.nome,
          funcionarioId: funcionario.id,
          funcionarioNome: funcionario.nome,
          funcionarioMatricula: funcionario.matricula,
          quantidade: quantidade,
          dataRetirada: new Date().toISOString(),
          previsaoDevolucao: previsao.toISOString(),
          status: 'em_uso',
          assinaturaRetiradaBase64: assinaturaDataUrl || undefined,
        });
      }

      soundEffects.playSuccess();
      onSuccess();
    } catch (err) {
      console.error(err);
      soundEffects.playWarning();
      alert('Erro ao registrar a saída.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Topo / Progresso do Fluxo */}
      <div className="bg-slate-850 border-b border-slate-800 p-4 sticky top-16 z-20 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar Saída
          </button>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Passo {step} de 4
          </span>
        </div>

        {/* Indicadores de Passo */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className={`h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-amber-500' : 'bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-amber-500' : 'bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-colors ${step >= 4 ? 'bg-amber-500' : 'bg-slate-800'}`} />
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {alertaMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-xs font-semibold text-rose-300 rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1">{alertaMsg}</span>
            <button onClick={() => setAlertaMsg(null)} className="text-rose-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 1: IDENTIFICAR O SOLICITANTE                       */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                <UserCheck className="w-4 h-4" /> Passo 1
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Identificar o Solicitante
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Aponte o leitor para o QR Code no crachá ou capacete do colaborador.
              </p>
            </div>

            {/* Botão de Bipar com Câmera */}
            <button
              onClick={() => {
                setScannerTarget('funcionario');
                setScannerOpen(true);
              }}
              className="w-full py-8 sm:py-12 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 flex flex-col items-center justify-center gap-3 transition-transform active:scale-[0.98] group"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-950/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-9 h-9 stroke-[2.2]" />
              </div>
              <div className="text-center">
                <span className="text-lg sm:text-xl block">Bipar Crachá / Capacete</span>
                <span className="text-xs text-slate-950/80 font-semibold block mt-0.5">
                  Clique para abrir a câmera ou simulador de bip
                </span>
              </div>
            </button>

            {/* Ou seleção direta da lista da obra */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Ou selecione rapidamente o trabalhador:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {storageService.getFuncionarios().map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFuncionario(f);
                      soundEffects.playBeep();
                      setStep(2);
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-amber-500/70 text-left transition-all group"
                  >
                    <img 
                      src={f.fotoUrl} 
                      alt={f.nome} 
                      className="w-11 h-11 rounded-full object-cover border-2 border-slate-600 group-hover:border-amber-400 shrink-0" 
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-200 truncate group-hover:text-amber-300">
                        {f.nome}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {f.cargo} • <span className="font-mono text-slate-300">{f.matricula}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 2: BIPAR O MATERIAL OU FERRAMENTA                  */}
        {/* ======================================================== */}
        {step === 2 && funcionario && (
          <div className="space-y-4">
            {/* Cartão do Solicitante Confirmado */}
            <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={funcionario.fotoUrl} 
                  alt={funcionario.nome} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shrink-0" 
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Solicitante Confirmado
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {funcionario.matricula}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-100 truncate mt-0.5">
                    {funcionario.nome}
                  </p>
                  <p className="text-xs text-slate-400">
                    {funcionario.cargo} • {funcionario.setor}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline p-2"
              >
                Trocar
              </button>
            </div>

            {/* Alerta se o funcionário já tiver ferramentas atrasadas */}
            {emprestimosAtivosFuncionario.length > 0 && (
              <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/60 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200">
                  <span className="font-bold">Atenção almoxarife:</span> Este colaborador possui{' '}
                  <b className="text-amber-300">{emprestimosAtivosFuncionario.length} ferramenta(s)</b> pendente(s) de devolução no momento.
                </div>
              </div>
            )}

            <div className="text-center sm:text-left pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                <Package className="w-4 h-4" /> Passo 2
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Bipar o Material ou Ferramenta
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Aponte o leitor para o QR Code colado na prateleira, saco ou equipamento.
              </p>
            </div>

            {/* Botão de Bipar Material com Câmera */}
            <button
              onClick={() => {
                setScannerTarget('item');
                setScannerOpen(true);
              }}
              className="w-full py-8 sm:py-10 bg-slate-800 hover:bg-slate-750 border-2 border-dashed border-amber-500/60 text-slate-100 font-bold rounded-2xl flex flex-col items-center justify-center gap-3 transition-transform active:scale-[0.98] group"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div className="text-center">
                <span className="text-base sm:text-lg block text-amber-300">Bipar Etiqueta do Material</span>
                <span className="text-xs text-slate-400 font-normal block mt-0.5">
                  Reconhece automaticamente consumo ou ferramenta
                </span>
              </div>
            </button>

            {/* Ou selecionar item da lista */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Ou selecione da lista de estoque:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {storageService.getItens().map(it => (
                  <button
                    key={it.id}
                    onClick={() => {
                      setItem(it);
                      setQuantidade(1);
                      soundEffects.playBeep();
                      setStep(3);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-amber-500/70 text-left transition-all group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                          {it.codigo}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          it.categoria === 'consumo' ? 'bg-blue-900/60 text-blue-300' : 'bg-amber-900/60 text-amber-300'
                        }`}>
                          {it.categoria === 'consumo' ? 'Consumo' : 'Ferramenta'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 truncate group-hover:text-amber-300">
                        {it.nome}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Estoque: <b className="text-slate-100">{it.estoqueAtual} {it.unidade}</b> • {it.localizacao}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 3: INFORMAR A QUANTIDADE (SEM REPETIÇÃO DE BIP)    */}
        {/* ======================================================== */}
        {step === 3 && item && funcionario && (
          <div className="space-y-4">
            {/* Header com resumo do item selecionado */}
            <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
                  {item.codigo}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  item.categoria === 'consumo' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {item.categoria === 'consumo' ? '📦 Material de Consumo' : '🔧 Ferramenta / Retorno'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-2">
                {item.nome}
              </h3>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700/60">
                <span>Localização: <b className="text-slate-200">{item.localizacao}</b></span>
                <span>Estoque Atual: <b className="text-emerald-400">{item.estoqueAtual} {item.unidade}</b></span>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                <Hash className="w-4 h-4" /> Passo 3
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Informar Quantidade de Saída
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Digite a quantidade que está saindo sem precisar bipar repetidas vezes.
              </p>
            </div>

            {/* Controle Grande de Quantidade com Botões de Toque */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => addQtd(-1)}
                  disabled={quantidade <= 1}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-100 flex items-center justify-center text-2xl font-bold transition-transform active:scale-95"
                >
                  <Minus className="w-7 h-7" />
                </button>

                <div className="flex-1 max-w-[200px]">
                  <input
                    type="number"
                    min="1"
                    max={item.estoqueAtual}
                    value={quantidade}
                    onChange={(e) => handleQtdChange(parseInt(e.target.value) || 0)}
                    className="w-full text-center text-4xl sm:text-5xl font-black bg-transparent text-amber-400 focus:outline-none"
                  />
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mt-1">
                    {item.unidade}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => addQtd(1)}
                  disabled={quantidade >= item.estoqueAtual}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-100 flex items-center justify-center text-2xl font-bold transition-transform active:scale-95"
                >
                  <Plus className="w-7 h-7" />
                </button>
              </div>

              {/* Botões rápidos de quantidade (+5, +10, +50, etc) */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                {[5, 10, 20, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQtdChange(quantidade + val)}
                    disabled={quantidade + val > item.estoqueAtual}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    +{val} {item.unidade}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleQtdChange(item.estoqueAtual)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-400 border border-amber-500/30 transition-colors"
                >
                  Máximo ({item.estoqueAtual})
                </button>
              </div>

              {erroQuantidade && (
                <div className="mt-4 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  {erroQuantidade}
                </div>
              )}
            </div>

            {/* Se for FERRAMENTA, perguntar prazo de devolução */}
            {item.categoria === 'ferramenta' && (
              <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  Previsão de Devolução (Empréstimo de Equipamento)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { dias: 1, label: 'Hoje / 1 Dia' },
                    { dias: 3, label: '3 Dias' },
                    { dias: 7, label: '1 Semana' }
                  ].map(p => (
                    <button
                      key={p.dias}
                      type="button"
                      onClick={() => setDiasPrevisaoDevolucao(p.dias)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        diasPrevisaoDevolucao === p.dias
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Observações da saída */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Local de Aplicação / Observação (Opcional)
              </label>
              <input
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Concretagem viga V-14, 3º pavimento, frente de trabalho B"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={quantidade <= 0 || quantidade > item.estoqueAtual}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-amber-500/20"
              >
                Avançar para Assinatura
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 4: ASSINATURA DIGITAL E CONCLUSÃO                 */}
        {/* ======================================================== */}
        {step === 4 && item && funcionario && (
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                <PenTool className="w-4 h-4" /> Passo 4
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Assinatura e Conclusão
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Colha a assinatura com o dedo do colaborador para garantir a responsabilidade legal da retirada.
              </p>
            </div>

            {/* Resumo completo do Termo de Retirada */}
            <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <div className="flex items-center gap-2">
                  <img src={funcionario.fotoUrl} alt={funcionario.nome} className="w-8 h-8 rounded-full object-cover border border-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">{funcionario.nome}</p>
                    <p className="text-[10px] text-slate-400">{funcionario.cargo} • Matrícula: {funcionario.matricula}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2 py-1 rounded">
                  {today.toLocaleDateString('pt-BR')} {today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Material / Ferramenta:</span>
                <span className="font-bold text-slate-200">{item.nome}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Quantidade Liberada:</span>
                <span className="font-extrabold text-amber-400 text-sm">
                  {quantidade} {item.unidade}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Regime:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  item.categoria === 'consumo' ? 'bg-blue-900/60 text-blue-300' : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {item.categoria === 'consumo' ? 'Baixa Definitiva (Consumo)' : `Empréstimo (Devolução em ${diasPrevisaoDevolucao} dias)`}
                </span>
              </div>

              {observacao && (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span className="font-semibold text-slate-300">Obs:</span> {observacao}
                </div>
              )}
            </div>

            {/* Canvas de Assinatura */}
            <SignaturePad
              onSignatureChange={(url) => setAssinaturaDataUrl(url)}
              title="Assinatura do Colaborador na Tela"
              subtitle={`Peça para ${funcionario.nome.split(' ')[0]} assinar no quadro abaixo:`}
            />

            {/* Botão de Finalizar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleFinalizar}
                disabled={isSubmitting}
                className="flex-2 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98]"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                {isSubmitting ? 'Gravando...' : 'Confirmar e Liberar Material'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal do Scanner de QR Code */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(code) => {
          if (scannerTarget === 'funcionario') {
            handleScanFuncionario(code);
          } else {
            handleScanItem(code);
          }
        }}
        title={scannerTarget === 'funcionario' ? 'Bipar Crachá / Capacete' : 'Bipar Etiqueta do Material'}
        expectedType={scannerTarget}
      />
    </div>
  );
};
