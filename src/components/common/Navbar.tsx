import React, { useEffect, useState } from 'react';
import { 
  HardHat, 
  Smartphone, 
  LayoutDashboard, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { storageService, soundEffects } from '../../services/storage';

interface NavbarProps {
  currentView: 'mobile' | 'desktop';
  onViewChange: (view: 'mobile' | 'desktop') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  const [isOffline, setIsOffline] = useState(() => storageService.isOffline());
  const [pendingCount, setPendingCount] = useState(() => storageService.getPendingSyncCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundEffects.isSoundEnabled());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleDataUpdate = () => {
      setIsOffline(storageService.isOffline());
      setPendingCount(storageService.getPendingSyncCount());
    };
    const handleNetworkChange = handleDataUpdate;
    const handleOnline = handleDataUpdate;
    const handleOffline = handleDataUpdate;

    window.addEventListener('obrastock_data_updated', handleDataUpdate);
    window.addEventListener('obrastock_network_changed', handleNetworkChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('obrastock_data_updated', handleDataUpdate);
      window.removeEventListener('obrastock_network_changed', handleNetworkChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggleOfflineSimulation = () => {
    const nextState = !storageService.isOfflineSimulated();
    storageService.setOfflineSimulated(nextState);
    setIsOffline(nextState);
  };

  const handleSync = () => {
    if (isOffline) {
      alert('Não é possível sincronizar enquanto estiver Offline! Desative o Modo Offline primeiro.');
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      const res = storageService.syncOfflineData();
      setIsSyncing(false);
      setPendingCount(0);
      setSyncFeedback(`${res.sincronizados} registros sincronizados com sucesso!`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }, 600);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundEffects.setSoundEnabled(next);
    setSoundEnabled(next);
    if (next) soundEffects.playBeep();
  };

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de exemplo da obra (materiais, ferramentas, equipe)?')) {
      storageService.resetToInitialData();
      setIsOffline(storageService.isOffline());
      setPendingCount(storageService.getPendingSyncCount());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-lg no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Marca */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <HardHat className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-100 text-base sm:text-lg tracking-tight">
                Obra<span className="text-amber-400">Stock</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-block">
                Almoxarifado
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              Controle de Materiais, Ferramentas e QR Code
            </p>
          </div>
        </div>

        {/* Alternador de Visão (Mobile vs Painel Gestor) */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => onViewChange('mobile')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'mobile'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Interface otimizada para o celular ou tablet do Almoxarife"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden xs:inline">Terminal</span> Almoxarife
          </button>
          <button
            onClick={() => onViewChange('desktop')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'desktop'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Painel completo para o Gestor / Engenheiro no computador"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden xs:inline">Painel</span> Gestor
          </button>
        </div>

        {/* Ferramentas: Modo Offline, Sincronização, Som */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Botão de Toggle Offline para Testes de Obra */}
          <button
            onClick={handleToggleOfflineSimulation}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-semibold transition-colors ${
              isOffline
                ? 'bg-rose-950/60 border-rose-700 text-rose-300 hover:bg-rose-900/60'
                : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/40'
            }`}
            title={isOffline ? 'Clique para voltar ao modo Online' : 'Clique para simular perda de sinal no canteiro de obras'}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">Modo Obra</span> <span>Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Online</span>
              </>
            )}
          </button>

          {/* Indicador de Fila de Sincronização */}
          {pendingCount > 0 && (
            <button
              onClick={handleSync}
              disabled={isOffline || isSyncing}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isOffline
                  ? 'bg-amber-950/40 border-amber-800/40 text-amber-300 opacity-80 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md animate-pulse cursor-pointer'
              }`}
              title={isOffline ? 'Conecte-se para sincronizar os dados locais' : 'Clique para sincronizar com o servidor'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-bold">{pendingCount}</span>
              <span className="hidden sm:inline">pendente{pendingCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Toggle de Som do Leitor */}
          <button
            onClick={handleToggleSound}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
            title={soundEnabled ? 'Silenciar bips' : 'Ativar bips do leitor'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Resetar dados de exemplo */}
          <button
            onClick={handleResetData}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors hidden lg:block"
            title="Restaurar dados de teste"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner de Feedback de Sincronização */}
      {syncFeedback && (
        <div className="bg-emerald-500 text-slate-950 text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top">
          <CheckCircle className="w-4 h-4" />
          {syncFeedback}
        </div>
      )}

      {/* Aviso quando em modo offline com pendências */}
      {isOffline && pendingCount > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-[11px] py-1 px-4 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Você está gravando dados offline localmente no dispositivo. As saídas serão sincronizadas quando reconectar.</span>
        </div>
      )}
    </header>
  );
};
