export type CategoriaItem = 'consumo' | 'ferramenta';

export interface Item {
  id: string;
  codigo: string;          // Ex: MAT-001, FER-002
  nome: string;            // Ex: Saco de Cimento CP-II 50kg, Furadeira de Impacto Bosch
  categoria: CategoriaItem;
  unidade: string;         // un, saco, kg, m, m², m³, rolo, barra
  estoqueAtual: number;
  estoqueMinimo: number;   // Gatilho de alerta
  precoUnitario: number;   // R$ para cálculo do valor em estoque
  localizacao: string;     // Ex: Prateleira A-02, Box C, Galpão de Máquinas
  qrCode: string;          // Payload do QR Code (ex: ITEM:MAT-001)
  descricao?: string;
  marcaModelo?: string;
  numeroSerie?: string;    // Específico para ferramentas
}

export interface Funcionario {
  id: string;
  matricula: string;       // Ex: FUNC-1042
  nome: string;            // Ex: Carlos Eduardo Santos
  cargo: string;           // Ex: Mestre de Obras, Pedreiro, Eletricista, Encanador
  setor: string;           // Ex: Fundação, Alvenaria, Elétrica, Acabamento
  qrCode: string;          // Payload do QR Code (ex: FUNC:FUNC-1042)
  fotoUrl: string;
  telefone?: string;
  ativo: boolean;
}

export type TipoMovimentacao = 'saida' | 'entrada' | 'devolucao' | 'ajuste_inventario';

export interface Movimentacao {
  id: string;
  tipo: TipoMovimentacao;
  itemId: string;
  itemNome: string;
  itemCodigo: string;
  itemCategoria: CategoriaItem;
  quantidade: number;
  unidade: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  funcionarioMatricula?: string;
  dataHora: string;             // ISO 8601
  observacao?: string;
  numeroNotaFiscal?: string;    // Para entradas
  assinaturaBase64?: string;    // Assinatura digital do funcionário
  sincronizado: boolean;        // Indicador de sincronização offline
}

export type StatusEmprestimo = 'em_uso' | 'devolvido' | 'atrasado';

export interface EmprestimoFerramenta {
  id: string;
  itemId: string;
  itemCodigo: string;
  itemNome: string;
  funcionarioId: string;
  funcionarioNome: string;
  funcionarioMatricula: string;
  quantidade: number;
  dataRetirada: string;
  previsaoDevolucao: string;
  dataDevolucao?: string;
  status: StatusEmprestimo;
  assinaturaRetiradaBase64?: string;
  assinaturaDevolucaoBase64?: string;
  sincronizado: boolean;
}

export interface AuditoriaInventario {
  id: string;
  itemId: string;
  itemNome: string;
  itemCodigo: string;
  quantidadeSistema: number;
  quantidadeFisica: number;
  diferenca: number;
  dataHora: string;
  responsavelNome: string;
}

export interface AppNotification {
  id: string;
  tipo: 'alerta_estoque' | 'ferramenta_atrasada' | 'sucesso' | 'info';
  titulo: string;
  mensagem: string;
  dataHora: string;
  lida: boolean;
  linkTab?: string;
}

