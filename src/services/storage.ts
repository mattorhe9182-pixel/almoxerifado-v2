import type { Item, Funcionario, Movimentacao, EmprestimoFerramenta } from '../types/index.ts';
import { INITIAL_ITENS, INITIAL_FUNCIONARIOS, INITIAL_EMPRESTIMOS, INITIAL_MOVIMENTACOES } from '../data/mockData';

const STORAGE_KEYS = {
  ITENS: 'obrastock_itens_v1',
  FUNCIONARIOS: 'obrastock_funcionarios_v1',
  MOVIMENTACOES: 'obrastock_movimentacoes_v1',
  EMPRESTIMOS: 'obrastock_emprestimos_v1',
  OFFLINE_SIMULATED: 'obrastock_offline_simulated_v1',
  SOUND_ENABLED: 'obrastock_sound_enabled_v1',
  LAST_SYNC_TS: 'obrastock_last_sync_ts_v1',
};

// Web Audio API Sound Effects
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundEffects = {
  isSoundEnabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false';
  },

  setSoundEnabled(enabled: boolean) {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
  },

  playBeep() {
    if (!this.isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio might be blocked by browser policy until user interaction
    }
  },

  playSuccess() {
    if (!this.isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.setValueAtTime(880.00, now + 0.12);

      osc2.frequency.setValueAtTime(740, now);
      osc2.frequency.setValueAtTime(1174, now + 0.12);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);
      osc2.start(now);
      osc2.stop(now + 0.35);
    } catch {
      // Fallback
    }
  },

  playWarning() {
    if (!this.isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Fallback
    }
  }
};

let lastKnownServerTimestamp: string = '';
let isPollingStarted = false;

// Storage API com Sincronização em Tempo Real (Local + Backend Central)
export const storageService = {
  // Inicialização e Heartbeat para Tempo Real
  initRealtimeSync() {
    if (isPollingStarted || typeof window === 'undefined') return;
    isPollingStarted = true;

    // 1. Puxa dados do servidor central na inicialização
    this.pullRemoteData();

    // 2. Heartbeat de sincronização em tempo real (verifica a cada 2.5 segundos)
    setInterval(async () => {
      if (this.isOffline()) return;

      try {
        const res = await fetch('/api/version');
        if (res.ok) {
          const { lastUpdated } = await res.json();
          if (lastUpdated && lastUpdated !== lastKnownServerTimestamp) {
            // Há novidades no servidor central feitas por outro dispositivo (ex: celular)!
            await this.pullRemoteData();
          }
        }
      } catch {
        // Servidor temporariamente inatingível, continua com cache local
      }
    }, 2500);
  },

  async pullRemoteData(): Promise<boolean> {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) return false;

      const data = await res.json();
      if (data.itens && data.funcionarios) {
        lastKnownServerTimestamp = data.lastUpdated || '';
        localStorage.setItem(STORAGE_KEYS.ITENS, JSON.stringify(data.itens));
        localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(data.funcionarios));
        localStorage.setItem(STORAGE_KEYS.MOVIMENTACOES, JSON.stringify(data.movimentacoes || []));
        localStorage.setItem(STORAGE_KEYS.EMPRESTIMOS, JSON.stringify(data.emprestimos || []));
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TS, lastKnownServerTimestamp);
        window.dispatchEvent(new CustomEvent('obrastock_data_updated'));
        return true;
      }
    } catch (err) {
      console.warn('Operando com cache local (servidor desconectado):', err);
    }
    return false;
  },

  // Itens
  getItens(): Item[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ITENS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ITENS, JSON.stringify(INITIAL_ITENS));
      return INITIAL_ITENS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ITENS;
    }
  },

  saveItens(itens: Item[]) {
    localStorage.setItem(STORAGE_KEYS.ITENS, JSON.stringify(itens));
    window.dispatchEvent(new CustomEvent('obrastock_data_updated'));
  },

  getItemById(id: string): Item | undefined {
    return this.getItens().find(i => i.id === id);
  },

  getItemByQrCode(code: string): Item | undefined {
    if (!code) return undefined;
    const clean = code.trim().toLowerCase();
    return this.getItens().find(i => {
      const qr = i.qrCode.toLowerCase();
      const cod = i.codigo.toLowerCase();
      return (
        qr === clean || 
        cod === clean ||
        clean === `item:${cod}` ||
        clean.includes(cod) ||
        clean.includes(qr) ||
        i.id.toLowerCase() === clean
      );
    });
  },

  upsertItem(item: Item) {
    const itens = this.getItens();
    const idx = itens.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      itens[idx] = item;
    } else {
      itens.unshift(item);
    }
    this.saveItens(itens);

    // Envia para o servidor central se online
    if (!this.isOffline()) {
      fetch('/api/itens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      }).then(r => r.json()).then(res => {
        if (res.lastUpdated) lastKnownServerTimestamp = res.lastUpdated;
      }).catch(() => {});
    }
  },

  deleteItem(id: string) {
    const itens = this.getItens().filter(i => i.id !== id);
    this.saveItens(itens);

    if (!this.isOffline()) {
      fetch(`/api/itens/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(res => {
          if (res.lastUpdated) lastKnownServerTimestamp = res.lastUpdated;
        }).catch(() => {});
    }
  },

  // Funcionários
  getFuncionarios(): Funcionario[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FUNCIONARIOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(INITIAL_FUNCIONARIOS));
      return INITIAL_FUNCIONARIOS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_FUNCIONARIOS;
    }
  },

  saveFuncionarios(funcs: Funcionario[]) {
    localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(funcs));
    window.dispatchEvent(new CustomEvent('obrastock_data_updated'));
  },

  getFuncionarioById(id: string): Funcionario | undefined {
    return this.getFuncionarios().find(f => f.id === id);
  },

  getFuncionarioByQrCode(code: string): Funcionario | undefined {
    if (!code) return undefined;
    const clean = code.trim().toLowerCase();
    return this.getFuncionarios().find(f => {
      const qr = f.qrCode.toLowerCase();
      const mat = f.matricula.toLowerCase();
      const nome = f.nome.toLowerCase();
      return (
        qr === clean || 
        mat === clean ||
        clean === `func:${mat}` ||
        clean.includes(mat) ||
        clean.includes(qr) ||
        clean === nome ||
        f.id.toLowerCase() === clean
      );
    });
  },

  upsertFuncionario(func: Funcionario) {
    const funcs = this.getFuncionarios();
    const idx = funcs.findIndex(f => f.id === func.id);
    if (idx >= 0) {
      funcs[idx] = func;
    } else {
      funcs.unshift(func);
    }
    this.saveFuncionarios(funcs);

    if (!this.isOffline()) {
      fetch('/api/funcionarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(func),
      }).then(r => r.json()).then(res => {
        if (res.lastUpdated) lastKnownServerTimestamp = res.lastUpdated;
      }).catch(() => {});
    }
  },

  deleteFuncionario(id: string) {
    const funcs = this.getFuncionarios().filter(f => f.id !== id);
    this.saveFuncionarios(funcs);

    if (!this.isOffline()) {
      fetch(`/api/funcionarios/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(res => {
          if (res.lastUpdated) lastKnownServerTimestamp = res.lastUpdated;
        }).catch(() => {});
    }
  },

  // Movimentações
  getMovimentacoes(): Movimentacao[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVIMENTACOES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MOVIMENTACOES, JSON.stringify(INITIAL_MOVIMENTACOES));
      return INITIAL_MOVIMENTACOES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MOVIMENTACOES;
    }
  },

  saveMovimentacoes(movs: Movimentacao[]) {
    localStorage.setItem(STORAGE_KEYS.MOVIMENTACOES, JSON.stringify(movs));
    window.dispatchEvent(new CustomEvent('obrastock_data_updated'));
  },

  addMovimentacao(mov: Omit<Movimentacao, 'id' | 'sincronizado'>): Movimentacao {
    const isOffline = this.isOffline();
    const novaMov: Movimentacao = {
      ...mov,
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      sincronizado: !isOffline,
    };

    const movs = this.getMovimentacoes();
    movs.unshift(novaMov);
    this.saveMovimentacoes(movs);

    // Ajusta o estoque do item localmente
    const itens = this.getItens();
    const item = itens.find(i => i.id === mov.itemId);
    if (item) {
      if (mov.tipo === 'saida') {
        item.estoqueAtual = Math.max(0, item.estoqueAtual - mov.quantidade);
      } else if (mov.tipo === 'entrada' || mov.tipo === 'devolucao') {
        item.estoqueAtual = item.estoqueAtual + mov.quantidade;
      }
      this.saveItens(itens);
    }

    // Se estiver online, sincroniza imediatamente com o servidor central no PC
    if (!isOffline) {
      fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaMov),
      }).then(r => r.json()).then(res => {
        if (res.lastUpdated) lastKnownServerTimestamp = res.lastUpdated;
      }).catch(err => {
        console.warn('Falha na sincronização online, mantendo na fila offline:', err);
        novaMov.sincronizado = false;
        this.saveMovimentacoes(movs);
      });
    }

    return novaMov;
  },

  // Empréstimos de Ferramentas
  getEmprestimos(): EmprestimoFerramenta[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPRESTIMOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EMPRESTIMOS, JSON.stringify(INITIAL_EMPRESTIMOS));
      return INITIAL_EMPRESTIMOS;
    }
    try {
      const list: EmprestimoFerramenta[] = JSON.parse(raw);
      const now = new Date();
      return list.map(emp => {
        if (emp.status === 'em_uso' && emp.previsaoDevolucao && new Date(emp.previsaoDevolucao) < now) {
          return { ...emp, status: 'atrasado' };
        }
        return emp;
      });
    } catch {
      return INITIAL_EMPRESTIMOS;
    }
  },

  saveEmprestimos(emps: EmprestimoFerramenta[]) {
    localStorage.setItem(STORAGE_KEYS.EMPRESTIMOS, JSON.stringify(emps));
    window.dispatchEvent(new CustomEvent('obrastock_data_updated'));
  },

  addEmprestimo(emp: Omit<EmprestimoFerramenta, 'id' | 'sincronizado'>): EmprestimoFerramenta {
    const isOffline = this.isOffline();
    const novoEmp: EmprestimoFerramenta = {
      ...emp,
      id: 'emp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      sincronizado: !isOffline,
    };
    const list = this.getEmprestimos();
    list.unshift(novoEmp);
    this.saveEmprestimos(list);

    if (!isOffline) {
      fetch('/api/emprestimos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoEmp),
      }).then(r => r.json()).then(res => {
        if (res.lastUpdated) lastKnownServerTimestamp = res.lastUpdated;
      }).catch(() => {
        novoEmp.sincronizado = false;
        this.saveEmprestimos(list);
      });
    }

    return novoEmp;
  },

  devolverEmprestimo(emprestimoId: string, assinaturaBase64?: string): boolean {
    const list = this.getEmprestimos();
    const emp = list.find(e => e.id === emprestimoId);
    if (!emp) return false;

    emp.status = 'devolvido';
    emp.dataDevolucao = new Date().toISOString();
    if (assinaturaBase64) {
      emp.assinaturaDevolucaoBase64 = assinaturaBase64;
    }
    this.saveEmprestimos(list);

    // Registra movimentação de devolução para repor o estoque local
    this.addMovimentacao({
      tipo: 'devolucao',
      itemId: emp.itemId,
      itemCodigo: emp.itemCodigo,
      itemNome: emp.itemNome,
      itemCategoria: 'ferramenta',
      quantidade: emp.quantidade,
      unidade: 'un',
      funcionarioId: emp.funcionarioId,
      funcionarioNome: emp.funcionarioNome,
      funcionarioMatricula: emp.funcionarioMatricula,
      dataHora: new Date().toISOString(),
      observacao: 'Devolução de ferramenta emprestada',
      assinaturaBase64: assinaturaBase64
    });

    if (!this.isOffline()) {
      fetch('/api/emprestimos/devolver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emprestimoId, assinaturaBase64 }),
      }).then(r => r.json()).then(res => {
        if (res.lastUpdated) lastKnownServerTimestamp = res.lastUpdated;
      }).catch(() => {});
    }

    return true;
  },

  // Sincronização e Modo Offline
  isOfflineSimulated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.OFFLINE_SIMULATED) === 'true';
  },

  setOfflineSimulated(simulated: boolean) {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_SIMULATED, String(simulated));
    window.dispatchEvent(new CustomEvent('obrastock_network_changed'));
  },

  isOffline(): boolean {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true;
    }
    return this.isOfflineSimulated();
  },

  getPendingSyncCount(): number {
    const movs = this.getMovimentacoes().filter(m => !m.sincronizado).length;
    const emps = this.getEmprestimos().filter(e => !e.sincronizado).length;
    return movs + emps;
  },

  syncOfflineData(): { sincronizados: number } {
    const movs = this.getMovimentacoes();
    const pendentesMovs = movs.filter(m => !m.sincronizado);

    const emps = this.getEmprestimos();
    const pendentesEmps = emps.filter(e => !e.sincronizado);

    const totalCount = pendentesMovs.length + pendentesEmps.length;

    // Envia o lote pendente para o servidor central
    if (!this.isOffline() && totalCount > 0) {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movimentacoes: pendentesMovs,
          emprestimos: pendentesEmps
        }),
      }).then(r => r.json()).then(res => {
        if (res.lastUpdated) lastKnownServerTimestamp = res.lastUpdated;
        this.pullRemoteData();
      }).catch(err => {
        console.error('Erro ao enviar lote offline:', err);
      });
    }

    movs.forEach(m => { m.sincronizado = true; });
    this.saveMovimentacoes(movs);

    emps.forEach(e => { e.sincronizado = true; });
    this.saveEmprestimos(emps);

    soundEffects.playSuccess();
    return { sincronizados: totalCount };
  },

  resetToInitialData() {
    localStorage.setItem(STORAGE_KEYS.ITENS, JSON.stringify(INITIAL_ITENS));
    localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(INITIAL_FUNCIONARIOS));
    localStorage.setItem(STORAGE_KEYS.EMPRESTIMOS, JSON.stringify(INITIAL_EMPRESTIMOS));
    localStorage.setItem(STORAGE_KEYS.MOVIMENTACOES, JSON.stringify(INITIAL_MOVIMENTACOES));
    window.dispatchEvent(new CustomEvent('obrastock_data_updated'));

    if (!this.isOffline()) {
      fetch('/api/reset', { method: 'POST' })
        .then(r => r.json())
        .then(res => {
          if (res.lastUpdated) lastKnownServerTimestamp = res.lastUpdated;
        }).catch(() => {});
    }
  }
};
