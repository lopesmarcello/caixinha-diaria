# Desafio Cofrinho — Especificação Técnica

## Visão Geral

Webapp mobile-first para rastrear desafios de poupança diária. O usuário cria **caixinhas**: cada caixinha tem uma tabela de números (1 até N) e, a cada dia, sorteia um número disponível que representa o valor em R$ a ser depositado. O app acompanha o progresso e celebra a conclusão.

---

## Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Banco de dados:** SQLite via `better-sqlite3` (arquivo local `data/cofrinho.db`)
- **ORM/Query builder:** SQL direto com `better-sqlite3` (sem ORM, evitar complexidade)
- **Estilo:** Tailwind CSS (já configurado no projeto)
- **Estado client-side:** React state + SWR para revalidação

---

## Modelo de Dados

### Tabela `caixinhas`

```sql
CREATE TABLE caixinhas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  total_days  INTEGER NOT NULL CHECK (total_days >= 1),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  status      TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  drawn_value INTEGER          -- número sorteado atualmente (pendente de decisão), NULL se nenhum
);
```

### Tabela `deposits`

```sql
CREATE TABLE deposits (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  caixinha_id  INTEGER NOT NULL REFERENCES caixinhas(id) ON DELETE CASCADE,
  value        INTEGER NOT NULL,           -- número depositado (1..total_days)
  deposited_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

### Derivações (calculadas em runtime)

| Campo | Cálculo |
|---|---|
| `montante_atual` | `SELECT SUM(value) FROM deposits WHERE caixinha_id = ?` |
| `montante_previsto` | `total_days * (total_days + 1) / 2` |
| `data_prevista` | `created_at + total_days days` |
| `dias_depositados` | `COUNT(*) FROM deposits WHERE caixinha_id = ?` |
| `dias_esperados` | `MIN(dias desde created_at, total_days)` |
| `dias_pulados` | `MAX(0, dias_esperados - dias_depositados)` |
| `numeros_disponiveis` | todos de 1..total_days que não estão em `deposits.value` |

---

## Rotas da API (`/api/`)

### `GET /api/caixinhas`
Lista todas as caixinhas com stats calculados.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Viagem 2025",
    "total_days": 100,
    "created_at": "2025-01-01T00:00:00",
    "status": "active",
    "montante_atual": 350,
    "montante_previsto": 5050,
    "data_prevista": "2025-04-11T00:00:00",
    "dias_depositados": 5,
    "dias_esperados": 7,
    "dias_pulados": 2
  }
]
```

### `POST /api/caixinhas`
Cria nova caixinha.

**Body:**
```json
{ "name": "Viagem 2025", "total_days": 100 }
```

**Validação:**
- `name`: string não vazia, máx 60 caracteres
- `total_days`: inteiro entre 1 e 365

**Response:** objeto da caixinha criada (201)

---

### `GET /api/caixinhas/[id]`
Retorna detalhes completos da caixinha incluindo:
- Todos os campos calculados acima
- `deposits`: array de depósitos com `{ id, value, deposited_at }`
- `drawn_value`: número atualmente sorteado (ou `null`)
- `available_count`: quantidade de números disponíveis

### `DELETE /api/caixinhas/[id]`
Deleta a caixinha e todos os seus depósitos.

---

### `POST /api/caixinhas/[id]/draw`
Sorteia um novo número disponível e salva em `caixinhas.drawn_value`.

**Regras:**
- Se não houver números disponíveis, retorna 409.
- O número anterior é devolvido ao pool (simplesmente não está em `deposits`, então sempre está disponível).
- Retorna o novo número sorteado.

**Response:**
```json
{ "drawn_value": 47 }
```

### `POST /api/caixinhas/[id]/deposit`
Confirma o depósito do número atualmente sorteado (`drawn_value`).

**Regras:**
- Requer que `drawn_value` não seja `null`.
- Insere em `deposits` com o `drawn_value` atual.
- Reseta `drawn_value` para `null` na caixinha.
- Se após o depósito não houver mais números disponíveis, atualiza `status = 'completed'`.

**Response:** objeto da caixinha atualizado com stats.

### `DELETE /api/caixinhas/[id]/deposit/last`
Desfaz o último depósito.

**Regras:**
- Deleta o registro com maior `id` em `deposits` para aquela caixinha.
- Se a caixinha estava `completed`, volta para `active`.
- Não repopula `drawn_value` automaticamente.

**Response:** objeto da caixinha atualizado com stats.

---

## Páginas (App Router)

### `/` — Dashboard

- Lista todas as caixinhas em cards.
- Cada card mostra: nome, barra de progresso (montante_atual / montante_previsto), dias pulados (se > 0, badge vermelho), status.
- Botão "Nova caixinha" → abre modal de criação.
- Caixinhas completadas aparecem em seção separada "Concluídas".
- Estado vazio: ilustração + CTA para criar a primeira caixinha.

### `/caixinha/[id]` — Detalhe da Caixinha

Layout dividido em duas seções:

#### Seção Superior — Sorteio do Dia
- Exibe o número sorteado atual em destaque (ou botão "Sortear" se `drawn_value` é null).
- Dois botões:
  - **"Depositei R$ X"** → chama `POST /deposit`, depois revalida
  - **"Tentar novamente"** → chama `POST /draw`, atualiza número exibido
- Se não houver números disponíveis: mensagem de parabéns + confetti.

#### Seção Inferior — Grid da Tabela (estilo bingo)
- Grid responsivo com todos os números de 1 a `total_days`.
- Cores por status:
  - **Disponível:** fundo neutro (cinza claro)
  - **Depositado:** fundo verde
  - **Sorteado atual:** fundo amarelo/destaque, borda pulsante
- Números menores cabem em mais colunas; sugerir 8-10 colunas em mobile.

#### Painel de Stats (abaixo do grid ou sidebar em desktop)
- Montante atual: `R$ X,XX`
- Montante previsto: `R$ X,XX`
- Progresso: `X / total_days números depositados`
- Data prevista: `DD/MM/YYYY`
- Dias pulados: badge laranja se > 0
- Botão "Desfazer último depósito" (discreto, não proeminente)

### Modal de Criação de Caixinha
- Campo: Nome (input text, obrigatório)
- Campo: Número de dias (input number, 1–365, obrigatório)
- Preview automático: "Você vai guardar até R$ X.XXX,XX em X dias" (montante previsto calculado em tempo real)
- Botão Criar / Cancelar

### Tela de Conclusão (overlay/page)
Exibida quando `status = 'completed'`:
- Animação de celebração (confetti via `canvas-confetti` ou similar)
- Total guardado
- Duração real (data início → último depósito)
- Botão "Ver detalhes" e "Criar nova caixinha"

---

## Regras de Negócio

1. **Números disponíveis:** são todos os inteiros de 1 a `total_days` que ainda não existem em `deposits` para aquela caixinha.
2. **Sorteio:** `Math.floor(Math.random() * available.length)` sobre o array de disponíveis. O número sorteado persiste em `drawn_value` para sobreviver a recargas de página.
3. **"Tentar novamente":** o número anterior **volta** ao pool automaticamente (ele nunca saiu; apenas `drawn_value` é atualizado). Sem limite de reroles.
4. **Um depósito por chamada:** a rota `POST /deposit` sempre usa `drawn_value`. Não é possível depositar um número arbitrário via UI.
5. **Dias pulados:** calculado como `MAX(0, dias_desde_criacao - total_deposits)`. Puramente informativo, não bloqueia nenhuma ação.
6. **Desfazer:** apenas o depósito mais recente pode ser desfeito. Após desfazer, `drawn_value` permanece null (o usuário sorteia novamente se quiser).
7. **Conclusão:** automática quando `COUNT(deposits) = total_days`.

---

## Estrutura de Arquivos Sugerida

```
app/
  page.tsx                        # Dashboard
  caixinha/
    [id]/
      page.tsx                    # Detalhe da caixinha
  components/
    CaixinhaCard.tsx
    CreateCaixinhaModal.tsx
    NumberGrid.tsx
    DrawSection.tsx
    StatsPanel.tsx
    CompletionOverlay.tsx
  globals.css
  layout.tsx

lib/
  db.ts                           # Singleton do better-sqlite3 + init schema
  queries.ts                      # Funções de acesso ao banco (sem ORM)

app/api/
  caixinhas/
    route.ts                      # GET (list), POST (create)
    [id]/
      route.ts                    # GET (detail), DELETE (delete)
      draw/
        route.ts                  # POST (draw)
      deposit/
        route.ts                  # POST (confirm deposit)
        last/
          route.ts                # DELETE (undo last)

data/
  cofrinho.db                     # Gerado automaticamente em runtime (gitignore)
```

---

## Setup Inicial

### Dependências a instalar

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
npm install swr
```

### Inicialização do banco (`lib/db.ts`)

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'cofrinho.db');

function getDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS caixinhas (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      total_days  INTEGER NOT NULL CHECK (total_days >= 1),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      status      TEXT    NOT NULL DEFAULT 'active',
      drawn_value INTEGER
    );
    CREATE TABLE IF NOT EXISTS deposits (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      caixinha_id  INTEGER NOT NULL REFERENCES caixinhas(id) ON DELETE CASCADE,
      value        INTEGER NOT NULL,
      deposited_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

// Singleton para evitar múltiplas conexões em dev (hot reload)
const globalForDb = global as typeof global & { _db?: Database.Database };
export const db = globalForDb._db ?? (globalForDb._db = getDb());
```

---

## UX / Design Guidelines

- **Paleta:** tons quentes (âmbar/dourado para elementos principais, verde para depositado, vermelho para alertas).
- **Mobile-first:** botões de ação com altura mínima de 48px, grid adaptável.
- **Feedback imediato:** após "Depositei", o número no grid muda para verde com micro-animação; após "Tentar novamente", o destaque amarelo migra para o novo número.
- **Sem modais desnecessários:** confirmação de depósito é via botão direto (o risco de erro é baixo e há desfazer disponível).
- **Números grandes no grid:** usar fonte monoespaçada para alinhamento visual.
- **`data/`** no `.gitignore`.

---

## Fluxo Principal (Happy Path)

```
1. Usuário abre o app → vê Dashboard (lista de caixinhas)
2. Clica "Nova caixinha" → preenche nome + dias → cria
3. Abre a caixinha → app mostra número sorteado (ex: 47)
4. Usuário decide depositar → clica "Depositei R$ 47"
   → número 47 fica verde no grid
   → montante atual sobe R$ 47
   → drawn_value = null (pronto para próximo dia)
5. Usuário volta amanhã → clica "Sortear" → app sorteia novo número
6. Repete até total_days depósitos → tela de celebração
```

---

## Casos de Borda

| Situação | Comportamento |
|---|---|
| Recarregar página com número sorteado | `drawn_value` persiste no banco; mesmo número é exibido |
| Abrir caixinha sem sortear ainda | Exibe botão "Sortear o número de hoje" |
| Todos números depositados | Grid todo verde, overlay de conclusão, botões de sorteio desabilitados |
| Desfazer em caixinha completada | Volta para `active`, remove último depósito |
| `total_days = 1` | Funciona; único número disponível é 1 |

---

## Itens Fora do Escopo (v1)

- Autenticação / múltiplos usuários
- Notificações push para lembrar de depositar
- Histórico de reroles
- Exportar dados
- Modo offline (PWA)
- Editar nome ou duração de uma caixinha existente
