import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Item, Funcionario } from '../../types';
import { storageService } from '../../services/storage';

interface EtiquetasPrintViewProps {
  type: 'itens' | 'funcionarios';
  onBack: () => void;
}

export const EtiquetasPrintView: React.FC<EtiquetasPrintViewProps> = ({ type, onBack }) => {
  const [itens] = useState<Item[]>(() => storageService.getItens());
  const [funcionarios] = useState<Funcionario[]>(() => storageService.getFuncionarios());
  const [qrCodesMap, setQrCodesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const listToGenerate = type === 'itens'
      ? itens.map(i => ({ id: i.id, payload: i.qrCode }))
      : funcionarios.map(f => ({ id: f.id, payload: f.qrCode }));

    const map: Record<string, string> = {};
    import('qrcode').then(({ default: QRCode }) => {
      Promise.all(
        listToGenerate.map(entry => 
          QRCode.toDataURL(entry.payload, { width: 200, margin: 1, errorCorrectionLevel: 'M' })
            .then(url => { map[entry.id] = url; })
        )
      ).then(() => {
        setQrCodesMap(map);
      });
    });
  }, [type, itens, funcionarios]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controle de Impressão */}
      <div className="flex items-center justify-between p-4 bg-slate-850 rounded-2xl border border-slate-800 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {type === 'itens' ? `${itens.length} etiquetas de prateleira` : `${funcionarios.length} crachás/capacete`}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            Imprimir Folha A4 Agora
          </button>
        </div>
      </div>

      {/* Grade de Etiquetas (A4 Grid Formatted) */}
      <div className="bg-white text-slate-950 p-6 sm:p-8 rounded-2xl shadow-xl print:shadow-none print:p-0 print:m-0">
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-6 no-print">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-900">
            {type === 'itens' ? 'Folha de Etiquetas para Prateleiras e Ferramentas' : 'Folha de Crachás e Etiquetas de Capacete'}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Canteiro de Obras • ObraStock • Imprima e recorte nas linhas demarcadas
          </p>
        </div>

        {/* ETIQUETAS DE ITENS */}
        {type === 'itens' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
            {itens.map(item => (
              <div
                key={item.id}
                className="border-2 border-dashed border-slate-400 p-3 rounded-xl flex flex-col items-center text-center bg-white break-inside-avoid page-break-inside-avoid"
              >
                <div className="w-full flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-600">
                    OBRASTOCK
                  </span>
                  <span className="font-mono text-[9px] font-bold bg-slate-100 px-1.5 py-0.2 rounded text-slate-900">
                    {item.codigo}
                  </span>
                </div>

                {qrCodesMap[item.id] ? (
                  <img src={qrCodesMap[item.id]} alt={item.nome} className="w-28 h-28 mx-auto" />
                ) : (
                  <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-[10px]">Carregando...</div>
                )}

                <p className="font-bold text-slate-900 text-xs mt-1.5 line-clamp-2 leading-tight">
                  {item.nome}
                </p>

                <div className="w-full flex items-center justify-between text-[10px] text-slate-600 mt-2 pt-1 border-t border-slate-200">
                  <span className="font-bold uppercase text-[9px]">
                    {item.categoria}
                  </span>
                  <span>Local: <b>{item.localizacao}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ETIQUETAS DE CRACHÁ / CAPACETE */}
        {type === 'funcionarios' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-4">
            {funcionarios.map(func => (
              <div
                key={func.id}
                className="border-2 border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center bg-white break-inside-avoid shadow-sm"
              >
                <div className="w-full flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                    CRACHÁ DE OBRA
                  </span>
                  <span className="font-mono text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {func.matricula}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full justify-center my-1">
                  <img
                    src={func.fotoUrl}
                    alt={func.nome}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-400"
                  />
                  {qrCodesMap[func.id] ? (
                    <img src={qrCodesMap[func.id]} alt={func.nome} className="w-20 h-20" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[9px]">Gerando...</div>
                  )}
                </div>

                <p className="font-black text-slate-900 text-sm mt-1">
                  {func.nome}
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {func.cargo}
                </p>
                <p className="text-[10px] text-slate-500">
                  Frente: {func.setor}
                </p>

                <div className="w-full text-center text-[8px] uppercase tracking-wider font-bold text-slate-400 border-t border-slate-200 mt-2.5 pt-1">
                  Autorizado para Retirada no Almoxarifado
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
