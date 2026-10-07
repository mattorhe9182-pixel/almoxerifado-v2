# 🏗️ ObraStock - Sistema Inteligente de Almoxarifado para Obras

Sistema completo para controle de materiais, ferramentas, leitura de QR Code, assinatura digital e modo offline desenvolvido especialmente para a rotina de canteiros de obras.

---

## 🚀 Como Executar o Projeto

No terminal do seu computador (na pasta do projeto):

```bash
# Iniciar o servidor de desenvolvimento
npm run dev
```

Abra o link informado no navegador (geralmente `http://localhost:5173`).

---

## 📱 Módulos Implementados

### 1. Terminal Mobile do Almoxarife (Foco Celular / Tablet)
- **Fluxo de Saída em 4 Etapas:**
  1. **Identificar Solicitante:** Bip de QR Code do crachá/capacete (exibe foto, matrícula e alerta de ferramentas pendentes).
  2. **Bipar Material:** Leitura do QR Code da prateleira/ferramenta com distinção automática entre **Consumo** e **Ferramenta**.
  3. **Informar Quantidade:** Teclado numérico e botões rápidos (+5, +10, +50, Máximo) sem necessidade de leituras repetidas.
  4. **Assinatura Digital & Conclusão:** Canvas touch onde o trabalhador assina com o dedo na tela, gerando comprovação jurídica da retirada.
- **Entrada / Recebimento de Cargas:** Cadastro rápido de notas fiscais e incremento de estoque.
- **Devolução de Ferramentas:** Lista de ferramentas em uso com alertas visuais de atraso e conferência por assinatura.
- **Auditoria / Inventário:** Bip de prateleiras comparando o saldo físico com o sistema para identificar faltas ou sobras.
- **Simulador de Bip Integrado:** Permite testar todos os fluxos mesmo sem câmera ou sem etiquetas impressas.

### 2. Painel do Gestor / Engenheiro (Computador)
- **Dashboard Executivo:** R$ total imobilizado em estoque, total de ferramentas em campo, alertas de atraso e ranking dos mais consumidos.
- **Catálogo de Materiais:** Cadastro completo com alertas de estoque mínimo e gerador de QR Code individual.
- **Gestão de Equipe:** Cadastro de operários com foto, cargo, setor e geração de crachás QR Code.
- **Central de Impressão de Etiquetas:** Folhas prontas formatadas em A4 para prateleiras e crachás de capacete.
- **Relatórios:** Histórico de movimentações com visualização das assinaturas digitais coletadas e exportação para Excel/CSV.

### 3. Motor Offline-First & Sons Industriais
- **Modo Offline:** Armazenamento local com fila de sincronização quando a obra não possui conexão Wi-Fi ou sinal 4G.
- **Simulador de Offline:** Botão no topo para testar como o app se comporta em subsolos sem sinal.
- **Efeitos Sonoros (Web Audio API):** Bip agudo clássico de leitores ópticos industriais ao ler QR Codes e confirmação sonora.

---

## 🛠️ Tecnologias Utilizadas
- **React 19 + TypeScript**
- **Vite**
- **Tailwind CSS**
- **HTML5 Canvas** (Assinatura digital de alta resolução)
- **html5-qrcode** (Scanner via câmera traseira do celular)
- **qrcode** (Gerador de QR Code em alta definição)
- **Web Audio API** (Sons de bip e sucesso)
- **Lucide Icons**
