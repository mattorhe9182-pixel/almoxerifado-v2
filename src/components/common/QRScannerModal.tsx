import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Zap, AlertTriangle, Search, UserCheck, Package } from 'lucide-react';
import { soundEffects, storageService } from '../../services/storage';
import type { Item, Funcionario } from '../../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  expectedType?: 'funcionario' | 'item' | 'qualquer';
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Apontar Câmera para o QR Code',
  expectedType = 'qualquer'
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'simulador'>('camera');
  const [searchSimulador, setSearchSimulador] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const hasScannedRef = useRef<boolean>(false);

  // Armazena referências estáveis para callbacks
  const onScanSuccessRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onCloseRef.current = onClose;
  }, [onScanSuccess, onClose]);

  // Dados para o simulador
  const [mockFuncionarios, setMockFuncionarios] = useState<Funcionario[]>([]);
  const [mockItens, setMockItens] = useState<Item[]>([]);

  useEffect(() => {
    if (isOpen) {
      setMockFuncionarios(storageService.getFuncionarios());
      setMockItens(storageService.getItens());
      hasScannedRef.current = false;
      isStoppingRef.current = false;
    }
  }, [isOpen]);

  // Função segura para desligar a câmera sem quebrar o DOM
  const safeStopScanner = async (): Promise<void> => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        const state = scanner.getState();
        // State 2: SCANNING, State 3: PAUSED
        if (state === 2 || state === 3) {
          await scanner.stop();
        }
        try {
          scanner.clear();
        } catch {
          // Ignora se o elemento container já foi limpo
        }
      } catch (err) {
        console.warn('Alerta silencioso ao parar scanner:', err);
      }
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (isOpen && activeTab === 'camera') {
      const containerId = 'qr-reader-container';
      setCameraError(null);
      hasScannedRef.current = false;

      const timer = setTimeout(async () => {
        if (isCancelled) return;

        try {
          const container = document.getElementById(containerId);
          if (!container) return;

          // Limpa qualquer instância anterior
          await safeStopScanner();
          if (isCancelled) return;

          isStoppingRef.current = false;
          const html5QrCode = new Html5Qrcode(containerId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.EAN_13
            ],
            verbose: false
          });
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 240, height: 240 },
              aspectRatio: 1.0,
            },
            async (decodedText: string) => {
              // Evita múltiplos bipes no mesmo frame
              if (hasScannedRef.current || isCancelled) return;
              hasScannedRef.current = true;

              soundEffects.playBeep();

              // Primeiro desliga o hardware da câmera com segurança
              await safeStopScanner();

              // Depois notifica o componente pai e fecha
              if (!isCancelled) {
                onScanSuccessRef.current(decodedText);
                onCloseRef.current();
              }
            },
            () => {
              // Frame sem detecção
            }
          );
        } catch (err: unknown) {
          if (!isCancelled) {
            console.warn('Erro ao acessar câmera:', err);
            setCameraError(
              'Não foi possível iniciar a câmera neste navegador. Você pode usar a aba "Simulador Rápido" abaixo para testar instantaneamente.'
            );
            setActiveTab('simulador');
          }
        }
      }, 250);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        safeStopScanner().catch(() => {});
      };
    } else {
      safeStopScanner().catch(() => {});
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSimulateScan = (payload: string) => {
    soundEffects.playBeep();
    safeStopScanner().then(() => {
      onScanSuccess(payload);
      onClose();
    });
  };

  const handleManualClose = () => {
    safeStopScanner().then(() => {
      onClose();
    });
  };

  const filteredFuncionarios = mockFuncionarios.filter(f => 
    f.nome.toLowerCase().includes(searchSimulador.toLowerCase()) ||
    f.matricula.toLowerCase().includes(searchSimulador.toLowerCase()) ||
    f.cargo.toLowerCase().includes(searchSimulador.toLowerCase())
  );

  const filteredItens = mockItens.filter(i => 
    i.nome.toLowerCase().includes(searchSimulador.toLowerCase()) ||
    i.codigo.toLowerCase().includes(searchSimulador.toLowerCase()) ||
    i.localizacao.toLowerCase().includes(searchSimulador.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
                {title}
              </h3>
              <p className="text-xs text-slate-400">
                {expectedType === 'funcionario' 
                  ? 'Bipar o crachá ou capacete do colaborador' 
                  : expectedType === 'item' 
                  ? 'Bipar o código do material ou ferramenta' 
                  : 'Bipar qualquer QR Code da obra'}
              </p>
            </div>
          </div>
          <button
            onClick={handleManualClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Câmera Real / Simulador */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'camera'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Câmera do Aparelho
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulador')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'simulador'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Simulador Rápido (Bip Virtual)
          </button>
        </div>

        {/* Conteúdo da Câmera */}
        {activeTab === 'camera' && (
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950 flex-1 min-h-[340px]">
            {cameraError ? (
              <div className="text-center p-6 bg-slate-900 rounded-xl border border-rose-900/40 max-w-sm">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-200 mb-1">Câmera indisponível</h4>
                <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
                <button
                  onClick={() => setActiveTab('simulador')}
                  className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors"
                >
                  Usar Simulador de Bip
                </button>
              </div>
            ) : (
              <div className="relative w-full max-w-xs aspect-square bg-black rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-inner flex items-center justify-center">
                <div id="qr-reader-container" className="w-full h-full" />
                
                {/* Linha Laser animada de escaneamento */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500/90 shadow-[0_0_12px_#ef4444] animate-pulse pointer-events-none" />
                
                {/* Guias dos cantos do leitor */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-400 pointer-events-none" />
              </div>
            )}
            <p className="text-xs text-slate-400 mt-4 text-center">
              Posicione o QR Code centralizado dentro da área indicada
            </p>
          </div>
        )}

        {/* Conteúdo do Simulador Rápido */}
        {activeTab === 'simulador' && (
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou cargo..."
                value={searchSimulador}
                onChange={(e) => setSearchSimulador(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1 max-h-[380px]">
              {/* Seção de Funcionários */}
              {(expectedType === 'funcionario' || expectedType === 'qualquer') && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                    Bipar Crachá de Funcionário ({filteredFuncionarios.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {filteredFuncionarios.map(func => (
                      <button
                        key={func.id}
                        onClick={() => handleSimulateScan(func.qrCode)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 hover:border-amber-500/60 transition-all text-left group"
                      >
                        <img 
                          src={func.fotoUrl} 
                          alt={func.nome} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-600 group-hover:border-amber-400" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-amber-300">
                            {func.nome}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {func.cargo} • <span className="font-mono text-slate-300">{func.matricula}</span>
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                          Bipar
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção de Materiais e Ferramentas */}
              {(expectedType === 'item' || expectedType === 'qualquer') && (
                <div className="mt-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    Bipar Etiqueta de Material / Ferramenta ({filteredItens.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {filteredItens.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSimulateScan(item.qrCode)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 hover:border-amber-500/60 transition-all text-left group"
                      >
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                              {item.codigo}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              item.categoria === 'consumo' 
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              {item.categoria === 'consumo' ? 'Consumo' : 'Ferramenta'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-200 truncate mt-1 group-hover:text-amber-300">
                            {item.nome}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Estoque: <b className="text-slate-200">{item.estoqueAtual} {item.unidade}</b> • {item.localizacao}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors whitespace-nowrap">
                          Bipar
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
