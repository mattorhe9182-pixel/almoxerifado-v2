import React, { useEffect, useState, useRef } from 'react';
import { X, Printer, Download, QrCode as QrIcon } from 'lucide-react';
import type { Item, Funcionario } from '../../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    type: 'item' | 'funcionario';
    payload: string;
    item?: Item;
    funcionario?: Funcionario;
  } | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, data }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data?.payload) return;

    let isMounted = true;

    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(data.payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      }).then(url => {
        if (isMounted) setQrUrl(url);
      }).catch(err => {
        console.error('Erro gerando QR Code:', err);
      });
    }).catch(err => {
      console.error('Erro carregando biblioteca QR Code:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [data]);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    const filename = data.type === 'item' 
      ? `qrcode-${data.item?.codigo || 'item'}.png` 
      : `qrcode-${data.funcionario?.matricula || 'cracha'}.png`;
    a.download = filename;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                {data.type === 'item' ? 'Etiqueta de Material / Ferramenta' : 'Etiqueta de Crachá / Capacete'}
              </h3>
              <p className="text-xs text-slate-400">
                {data.type === 'item' ? 'Pronto para colar na prateleira ou ferramenta' : 'Pronto para crachá do colaborador'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card de Impressão / Visualização */}
        <div className="p-6 flex flex-col items-center">
          <div 
            ref={printRef}
            className="w-full bg-white text-slate-950 p-5 rounded-xl shadow-lg border-2 border-dashed border-slate-300 flex flex-col items-center text-center"
          >
            {/* Header da Etiqueta */}
            <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <span className="text-[10px] font-black tracking-widest uppercase text-amber-600">
                OBRASTOCK • ALMOXARIFADO
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                {data.type === 'item' ? data.item?.codigo : data.funcionario?.matricula}
              </span>
            </div>

            {/* Imagem do QR Code */}
            {qrUrl ? (
              <div className="p-2 bg-white rounded-lg">
                <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg animate-pulse text-xs text-slate-400">
                Gerando código...
              </div>
            )}

            {/* Informações detalhadas da etiqueta */}
            {data.type === 'item' && data.item && (
              <div className="w-full mt-2">
                <p className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
                  {data.item.nome}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs font-medium text-slate-600">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    data.item.categoria === 'consumo' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {data.item.categoria === 'consumo' ? 'CONSUMO' : 'FERRAMENTA / RETORNO'}
                  </span>
                  <span>Local: <b>{data.item.localizacao}</b></span>
                </div>
              </div>
            )}

            {data.type === 'funcionario' && data.funcionario && (
              <div className="w-full mt-2">
                <p className="font-bold text-slate-900 text-base leading-tight">
                  {data.funcionario.nome}
                </p>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  {data.funcionario.cargo} • {data.funcionario.setor}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Crachá / Capacete Autorizado
                </p>
              </div>
            )}

            <div className="w-full border-t border-slate-200 mt-3 pt-1 text-[9px] text-slate-500 font-mono">
              PAYLOAD: {data.payload}
            </div>
          </div>
        </div>

        {/* Ações de Impressão e Download */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar Imagem PNG
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            Imprimir Etiqueta
          </button>
        </div>
      </div>
    </div>
  );
};
