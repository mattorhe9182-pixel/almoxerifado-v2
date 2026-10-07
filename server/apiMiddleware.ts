import fs from 'fs';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';
import { INITIAL_ITENS, INITIAL_FUNCIONARIOS, INITIAL_EMPRESTIMOS, INITIAL_MOVIMENTACOES } from '../src/data/mockData.ts';
import type { Item, Funcionario, Movimentacao, EmprestimoFerramenta } from '../src/types/index.ts';

interface DatabaseSchema {
  version: number;
  lastUpdated: string;
  itens: Item[];
  funcionarios: Funcionario[];
  movimentacoes: Movimentacao[];
  emprestimos: EmprestimoFerramenta[];
}

const DB_DIR = path.resolve(process.cwd(), 'server_db');
const DB_FILE = path.join(DB_DIR, 'database.json');

function ensureDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      itens: INITIAL_ITENS,
      funcionarios: INITIAL_FUNCIONARIOS,
      movimentacoes: INITIAL_MOVIMENTACOES,
      emprestimos: INITIAL_EMPRESTIMOS,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler banco de dados local, recriando inicial:', err);
    const fallback: DatabaseSchema = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      itens: INITIAL_ITENS,
      funcionarios: INITIAL_FUNCIONARIOS,
      movimentacoes: INITIAL_MOVIMENTACOES,
      emprestimos: INITIAL_EMPRESTIMOS,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveDatabase(data: DatabaseSchema) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', (err: any) => reject(err));
  });
}

function sendJson(res: any, data: any, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data));
}

export function obrastockApiPlugin(): Plugin {
  return {
    name: 'obrastock-api-plugin',
    configureServer(server: ViteDevServer) {
      ensureDatabase();

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // CORS preflight
        if (req.method === 'OPTIONS' && url.startsWith('/api')) {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end();
          return;
        }

        if (!url.startsWith('/api')) {
          return next();
        }

        try {
          const db = ensureDatabase();

          // 1. GET /api/data - Retorna o banco completo
          if (url === '/api/data' && req.method === 'GET') {
            return sendJson(res, db);
          }

          // 2. GET /api/version - Checagem leve de atualização para polling (tempo real)
          if (url === '/api/version' && req.method === 'GET') {
            return sendJson(res, { lastUpdated: db.lastUpdated });
          }

          // 3. POST /api/movimentacoes - Registra saída/entrada/devolução e atualiza estoque
          if (url === '/api/movimentacoes' && req.method === 'POST') {
            const body = await readBody(req);
            const novaMov: Movimentacao = {
              ...body,
              id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              dataHora: body.dataHora || new Date().toISOString(),
              sincronizado: true
            };

            db.movimentacoes.unshift(novaMov);

            // Ajusta o estoque do item correspondente
            const item = db.itens.find(i => i.id === body.itemId);
            if (item) {
              if (body.tipo === 'saida') {
                item.estoqueAtual = Math.max(0, item.estoqueAtual - body.quantidade);
              } else if (body.tipo === 'entrada' || body.tipo === 'devolucao') {
                item.estoqueAtual = item.estoqueAtual + body.quantidade;
              } else if (body.tipo === 'ajuste_inventario' && typeof body.quantidadeFisica === 'number') {
                item.estoqueAtual = body.quantidadeFisica;
              }
            }

            saveDatabase(db);
            return sendJson(res, { movimentacao: novaMov, item, lastUpdated: db.lastUpdated });
          }

          // 4. POST /api/emprestimos - Cria empréstimo de ferramenta
          if (url === '/api/emprestimos' && req.method === 'POST') {
            const body = await readBody(req);
            const novoEmp: EmprestimoFerramenta = {
              ...body,
              id: 'emp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              dataRetirada: body.dataRetirada || new Date().toISOString(),
              status: body.status || 'em_uso',
              sincronizado: true
            };

            db.emprestimos.unshift(novoEmp);
            saveDatabase(db);
            return sendJson(res, { emprestimo: novoEmp, lastUpdated: db.lastUpdated });
          }

          // 5. POST /api/emprestimos/devolver - Baixa de ferramenta e reposição no estoque
          if (url === '/api/emprestimos/devolver' && req.method === 'POST') {
            const body = await readBody(req);
            const emp = db.emprestimos.find(e => e.id === body.emprestimoId);
            if (!emp) {
              return sendJson(res, { error: 'Empréstimo não encontrado' }, 404);
            }

            emp.status = 'devolvido';
            emp.dataDevolucao = new Date().toISOString();
            if (body.assinaturaBase64) {
              emp.assinaturaDevolucaoBase64 = body.assinaturaBase64;
            }

            // Repõe o estoque da ferramenta
            const item = db.itens.find(i => i.id === emp.itemId);
            if (item) {
              item.estoqueAtual += emp.quantidade;
            }

            // Registra a movimentação de devolução
            const movDev: Movimentacao = {
              id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
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
              observacao: 'Devolução de ferramenta',
              assinaturaBase64: body.assinaturaBase64,
              sincronizado: true
            };
            db.movimentacoes.unshift(movDev);

            saveDatabase(db);
            return sendJson(res, { success: true, lastUpdated: db.lastUpdated });
          }

          // 6. POST /api/itens - Cadastrar ou atualizar item
          if (url === '/api/itens' && req.method === 'POST') {
            const item = await readBody(req);
            const idx = db.itens.findIndex(i => i.id === item.id);
            if (idx >= 0) {
              db.itens[idx] = item;
            } else {
              db.itens.unshift(item);
            }
            saveDatabase(db);
            return sendJson(res, { item, lastUpdated: db.lastUpdated });
          }

          // 7. DELETE /api/itens/:id
          if (url.startsWith('/api/itens/') && req.method === 'DELETE') {
            const id = url.replace('/api/itens/', '');
            db.itens = db.itens.filter(i => i.id !== id);
            saveDatabase(db);
            return sendJson(res, { success: true, lastUpdated: db.lastUpdated });
          }

          // 8. POST /api/funcionarios - Cadastrar ou atualizar colaborador
          if (url === '/api/funcionarios' && req.method === 'POST') {
            const func = await readBody(req);
            const idx = db.funcionarios.findIndex(f => f.id === func.id);
            if (idx >= 0) {
              db.funcionarios[idx] = func;
            } else {
              db.funcionarios.unshift(func);
            }
            saveDatabase(db);
            return sendJson(res, { funcionario: func, lastUpdated: db.lastUpdated });
          }

          // 9. DELETE /api/funcionarios/:id
          if (url.startsWith('/api/funcionarios/') && req.method === 'DELETE') {
            const id = url.replace('/api/funcionarios/', '');
            db.funcionarios = db.funcionarios.filter(f => f.id !== id);
            saveDatabase(db);
            return sendJson(res, { success: true, lastUpdated: db.lastUpdated });
          }

          // 10. POST /api/sync - Sincronização em lote da fila offline do celular
          if (url === '/api/sync' && req.method === 'POST') {
            const batch = await readBody(req);
            let syncedCount = 0;

            if (Array.isArray(batch.movimentacoes)) {
              for (const mov of batch.movimentacoes) {
                const exists = db.movimentacoes.some(m => m.id === mov.id);
                if (!exists) {
                  db.movimentacoes.unshift({ ...mov, sincronizado: true });
                  const it = db.itens.find(i => i.id === mov.itemId);
                  if (it) {
                    if (mov.tipo === 'saida') it.estoqueAtual = Math.max(0, it.estoqueAtual - mov.quantidade);
                    else if (mov.tipo === 'entrada' || mov.tipo === 'devolucao') it.estoqueAtual += mov.quantidade;
                  }
                  syncedCount++;
                }
              }
            }

            if (Array.isArray(batch.emprestimos)) {
              for (const emp of batch.emprestimos) {
                const exists = db.emprestimos.some(e => e.id === emp.id);
                if (!exists) {
                  db.emprestimos.unshift({ ...emp, sincronizado: true });
                  syncedCount++;
                }
              }
            }

            saveDatabase(db);
            return sendJson(res, { sincronizados: syncedCount, lastUpdated: db.lastUpdated });
          }

          // 11. POST /api/reset - Restaurar dados de fábrica
          if (url === '/api/reset' && req.method === 'POST') {
            db.itens = INITIAL_ITENS;
            db.funcionarios = INITIAL_FUNCIONARIOS;
            db.movimentacoes = INITIAL_MOVIMENTACOES;
            db.emprestimos = INITIAL_EMPRESTIMOS;
            saveDatabase(db);
            return sendJson(res, { success: true, lastUpdated: db.lastUpdated });
          }

          return sendJson(res, { error: 'Endpoint não encontrado' }, 404);
        } catch (error: any) {
          console.error('Erro na API ObraStock:', error);
          return sendJson(res, { error: error.message || 'Erro interno do servidor' }, 500);
        }
      });
    }
  };
}
