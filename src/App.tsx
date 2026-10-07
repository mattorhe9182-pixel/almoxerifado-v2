import { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { MobileTerminal } from './components/mobile/MobileTerminal';
import { DesktopPanel } from './components/desktop/DesktopPanel';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { storageService } from './services/storage';
import { HardHat } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    storageService.initRealtimeSync();
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
        {/* Barra de Navegação Superior */}
        <Navbar
          currentView={currentView}
          onViewChange={(view) => setCurrentView(view)}
        />

        {/* Área Principal de Trabalho */}
        <main className="flex-1 pb-10">
          {currentView === 'mobile' ? (
            <div className="py-2">
              <MobileTerminal />
            </div>
          ) : (
            <DesktopPanel />
          )}
        </main>

        {/* Rodapé do Sistema */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-400">
                ObraStock • Sistema de Gestão de Almoxarifado para Obras
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              QR Code • Assinatura Digital • Offline-First • Controle de Ferramentas & Consumo
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
