import type { Item, Funcionario, Movimentacao, EmprestimoFerramenta } from '../types/index.ts';

export const INITIAL_ITENS: Item[] = [
  // MATERIAIS DE CONSUMO
  {
    id: 'mat-1',
    codigo: 'MAT-001',
    nome: 'Cimento Portland CP-II E-32 50kg',
    categoria: 'consumo',
    unidade: 'saco',
    estoqueAtual: 18,
    estoqueMinimo: 30, // Alerta: estoque crítico!
    precoUnitario: 38.50,
    localizacao: 'Palete 01 - Galpão Principal',
    qrCode: 'ITEM:MAT-001',
    descricao: 'Cimento para alvenaria e concreto estrutural'
  },
  {
    id: 'mat-2',
    codigo: 'MAT-002',
    nome: 'Areia Média Lavada',
    categoria: 'consumo',
    unidade: 'm³',
    estoqueAtual: 14,
    estoqueMinimo: 10,
    precoUnitario: 95.00,
    localizacao: 'Baia 02 - Pátio Aberto',
    qrCode: 'ITEM:MAT-002',
    descricao: 'Areia para reboco e assentamento de tijolos'
  },
  {
    id: 'mat-3',
    codigo: 'MAT-003',
    nome: 'Barra de Aço CA-50 10.0mm (3/8") 12m',
    categoria: 'consumo',
    unidade: 'barra',
    estoqueAtual: 45,
    estoqueMinimo: 50, // Alerta leve
    precoUnitario: 42.90,
    localizacao: 'Cavalete 04 - Armação',
    qrCode: 'ITEM:MAT-003',
    descricao: 'Vergalhão nervurado para armadura de vigas e colunas'
  },
  {
    id: 'mat-4',
    codigo: 'MAT-004',
    nome: 'Prego Polido com Cabeça 18x27 (2.1/2 x 10)',
    categoria: 'consumo',
    unidade: 'kg',
    estoqueAtual: 8,
    estoqueMinimo: 15, // Alerta crítico
    precoUnitario: 18.20,
    localizacao: 'Prateleira B - Gaveteiro 03',
    qrCode: 'ITEM:MAT-004',
    descricao: 'Prego para formas de madeira e caixaria'
  },
  {
    id: 'mat-5',
    codigo: 'MAT-005',
    nome: 'Disco de Corte Diamantado 110mm',
    categoria: 'consumo',
    unidade: 'un',
    estoqueAtual: 12,
    estoqueMinimo: 5,
    precoUnitario: 24.90,
    localizacao: 'Armário Aço 01 - Prateleira 2',
    qrCode: 'ITEM:MAT-005',
    descricao: 'Para corte a seco de alvenaria e cerâmica'
  },
  {
    id: 'mat-6',
    codigo: 'MAT-006',
    nome: 'Argamassa Colante AC-III Cinza 20kg',
    categoria: 'consumo',
    unidade: 'saco',
    estoqueAtual: 35,
    estoqueMinimo: 20,
    precoUnitario: 31.00,
    localizacao: 'Palete 03 - Galpão Principal',
    qrCode: 'ITEM:MAT-006',
    descricao: 'Argamassa de alta aderência para porcelanato e fachadas'
  },
  {
    id: 'mat-7',
    codigo: 'MAT-007',
    nome: 'Tubo de PVC Esgoto 100mm x 6m',
    categoria: 'consumo',
    unidade: 'vara',
    estoqueAtual: 22,
    estoqueMinimo: 10,
    precoUnitario: 68.00,
    localizacao: 'Rack de Tubos - Setor Hidráulico',
    qrCode: 'ITEM:MAT-007',
    descricao: 'Tubo para rede de esgoto sanitário primário'
  },

  // FERRAMENTAS E EQUIPAMENTOS (RETORNO / EMPRÉSTIMO)
  {
    id: 'fer-1',
    codigo: 'FER-001',
    nome: 'Furadeira de Impacto Bosch GSB 16 RE 750W',
    categoria: 'ferramenta',
    unidade: 'un',
    estoqueAtual: 3,
    estoqueMinimo: 1,
    precoUnitario: 520.00,
    localizacao: 'Armário Ferramentas 01 - Nicho F1',
    qrCode: 'ITEM:FER-001',
    marcaModelo: 'Bosch Professional',
    numeroSerie: 'BSH-750-9921',
    descricao: 'Furadeira industrial 1/2 pol com controle de velocidade'
  },
  {
    id: 'fer-2',
    codigo: 'FER-002',
    nome: 'Serra Mármore Makita 4100NH3ZX2 1450W',
    categoria: 'ferramenta',
    unidade: 'un',
    estoqueAtual: 1,
    estoqueMinimo: 1,
    precoUnitario: 489.00,
    localizacao: 'Armário Ferramentas 01 - Nicho F2',
    qrCode: 'ITEM:FER-002',
    marcaModelo: 'Makita',
    numeroSerie: 'MKT-4100-3301',
    descricao: 'Serra de corte para pedras, alvenaria e concreto'
  },
  {
    id: 'fer-3',
    codigo: 'FER-003',
    nome: 'Nível a Laser Bosch GLL 2-12 G Linhas Verdes',
    categoria: 'ferramenta',
    unidade: 'un',
    estoqueAtual: 2,
    estoqueMinimo: 1,
    precoUnitario: 650.00,
    localizacao: 'Maleta Protetora - Estante Técnica',
    qrCode: 'ITEM:FER-003',
    marcaModelo: 'Bosch Laser',
    numeroSerie: 'BSH-LASER-4402',
    descricao: 'Nível de linhas cruzadas verdes de alta visibilidade'
  },
  {
    id: 'fer-4',
    codigo: 'FER-004',
    nome: 'Martelete Perfurador DeWalt D25133K 800W',
    categoria: 'ferramenta',
    unidade: 'un',
    estoqueAtual: 0, // Todos emprestados!
    estoqueMinimo: 1,
    precoUnitario: 890.00,
    localizacao: 'Armário Ferramentas 02 - Nicho M1',
    qrCode: 'ITEM:FER-004',
    marcaModelo: 'DeWalt SDS Plus',
    numeroSerie: 'DWT-2513-8812',
    descricao: 'Martelete perfurador rompedor com maleta'
  },
  {
    id: 'fer-5',
    codigo: 'FER-005',
    nome: 'Betoneira 400 Litros Monofásica 2CV',
    categoria: 'ferramenta',
    unidade: 'un',
    estoqueAtual: 2,
    estoqueMinimo: 1,
    precoUnitario: 4500.00,
    localizacao: 'Pátio de Mistura - Área 01',
    qrCode: 'ITEM:FER-005',
    marcaModelo: 'Fischer Pro',
    numeroSerie: 'FSC-BET-2023-01',
    descricao: 'Betoneira reforçada para produção de concreto in-loco'
  }
];

export const INITIAL_FUNCIONARIOS: Funcionario[] = [
  {
    id: 'func-1',
    matricula: 'OBR-101',
    nome: 'Antônio Ferreira (Mestre Antônio)',
    cargo: 'Mestre de Obras',
    setor: 'Coordenação Geral',
    qrCode: 'FUNC:OBR-101',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    telefone: '(11) 98765-4321',
    ativo: true
  },
  {
    id: 'func-2',
    matricula: 'OBR-102',
    nome: 'Carlos Eduardo Santos',
    cargo: 'Pedreiro Especializado',
    setor: 'Alvenaria e Revestimento',
    qrCode: 'FUNC:OBR-102',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    telefone: '(11) 97123-4567',
    ativo: true
  },
  {
    id: 'func-3',
    matricula: 'OBR-103',
    nome: 'José Valdir Ribeiro',
    cargo: 'Eletricista Predial',
    setor: 'Instalações Elétricas',
    qrCode: 'FUNC:OBR-103',
    fotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    telefone: '(11) 99876-1234',
    ativo: true
  },
  {
    id: 'func-4',
    matricula: 'OBR-104',
    nome: 'Marcos Vinicius Lima',
    cargo: 'Encanador / Bombeiro Hidráulico',
    setor: 'Hidráulica e Esgoto',
    qrCode: 'FUNC:OBR-104',
    fotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    telefone: '(11) 96543-9876',
    ativo: true
  },
  {
    id: 'func-5',
    matricula: 'OBR-105',
    nome: 'Reginaldo de Souza',
    cargo: 'Ajudante Geral',
    setor: 'Logística e Preparo',
    qrCode: 'FUNC:OBR-105',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    telefone: '(11) 95432-1098',
    ativo: true
  }
];

export const INITIAL_EMPRESTIMOS: EmprestimoFerramenta[] = [
  {
    id: 'emp-1',
    itemId: 'fer-4',
    itemCodigo: 'FER-004',
    itemNome: 'Martelete Perfurador DeWalt D25133K 800W',
    funcionarioId: 'func-2',
    funcionarioNome: 'Carlos Eduardo Santos',
    funcionarioMatricula: 'OBR-102',
    quantidade: 1,
    dataRetirada: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    previsaoDevolucao: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'atrasado',
    sincronizado: true
  },
  {
    id: 'emp-2',
    itemId: 'fer-2',
    itemCodigo: 'FER-002',
    itemNome: 'Serra Mármore Makita 4100NH3ZX2 1450W',
    funcionarioId: 'func-4',
    funcionarioNome: 'Marcos Vinicius Lima',
    funcionarioMatricula: 'OBR-104',
    quantidade: 1,
    dataRetirada: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    previsaoDevolucao: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    status: 'em_uso',
    sincronizado: true
  }
];

export const INITIAL_MOVIMENTACOES: Movimentacao[] = [
  {
    id: 'mov-1',
    tipo: 'saida',
    itemId: 'mat-1',
    itemCodigo: 'MAT-001',
    itemNome: 'Cimento Portland CP-II E-32 50kg',
    itemCategoria: 'consumo',
    quantidade: 12,
    unidade: 'saco',
    funcionarioId: 'func-2',
    funcionarioNome: 'Carlos Eduardo Santos',
    funcionarioMatricula: 'OBR-102',
    dataHora: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    observacao: 'Para concretagem da viga V-12 do 2º pavimento',
    sincronizado: true
  },
  {
    id: 'mov-2',
    tipo: 'saida',
    itemId: 'fer-4',
    itemCodigo: 'FER-004',
    itemNome: 'Martelete Perfurador DeWalt D25133K 800W',
    itemCategoria: 'ferramenta',
    quantidade: 1,
    unidade: 'un',
    funcionarioId: 'func-2',
    funcionarioNome: 'Carlos Eduardo Santos',
    funcionarioMatricula: 'OBR-102',
    dataHora: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    observacao: 'Romper viga de transição',
    sincronizado: true
  },
  {
    id: 'mov-3',
    tipo: 'entrada',
    itemId: 'mat-6',
    itemCodigo: 'MAT-006',
    itemNome: 'Argamassa Colante AC-III Cinza 20kg',
    itemCategoria: 'consumo',
    quantidade: 25,
    unidade: 'saco',
    numeroNotaFiscal: 'NF-e 88291 / Votorantim',
    dataHora: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    observacao: 'Entrega programada lote 04',
    sincronizado: true
  }
];

