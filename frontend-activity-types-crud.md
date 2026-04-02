# Implementar CRUD de Tipos de Atividade no Frontend (Nuxt/Vue)

## Contexto

A API backend (NestJS) possui um CRUD completo para o recurso **Activity Types** (tipos de atividade complementar). Preciso implementar no frontend Nuxt/Vue uma interface para listar, criar, editar e deletar tipos de atividade. Os professores vão usar essa tela para gerenciar dinamicamente os tipos de atividade disponíveis.

---

## Base URL da API

```
/activity-types
```

---

## Endpoints disponíveis

| Método | Rota | Status | Descrição |
|--------|------|--------|-----------|
| `GET` | `/activity-types` | 200 | Lista todos os tipos de atividade (ordenados por `cod` ASC) |
| `GET` | `/activity-types/:id` | 200 | Busca um tipo de atividade por ID |
| `POST` | `/activity-types` | 201 | Cria um novo tipo de atividade |
| `PATCH` | `/activity-types/:id` | 200 | Atualiza parcialmente um tipo de atividade |
| `DELETE` | `/activity-types/:id` | 204 | Deleta um tipo de atividade (sem body na resposta) |

---

## Formato das respostas da API

**Sucesso** — toda resposta de sucesso é envolvida em `{ data: ... }`:

```json
// GET /activity-types
{
  "data": [ { ...activityType }, { ...activityType } ]
}

// GET /activity-types/:id
{
  "data": { ...activityType }
}

// POST /activity-types
{
  "data": {
    "message": "Tipo de atividade criado com sucesso",
    "activityType": { ...activityType }
  }
}

// PATCH /activity-types/:id
{
  "data": {
    "message": "Tipo de atividade atualizado com sucesso",
    "activityType": { ...activityType }
  }
}

// DELETE /activity-types/:id — status 204, sem body
```

**Erro** — formato padronizado:

```json
{
  "statusCode": 400 | 404 | 409,
  "message": "string ou array de strings"
}
```

Erros possíveis:
- `409 Conflict`: "Já existe um tipo de atividade com o código 'X'" (create/update com cod duplicado)
- `404 Not Found`: "Tipo de atividade com id X não encontrado" (update/delete com id inexistente)
- `400 Bad Request`: "Não é possível deletar um tipo de atividade que possui atividades vinculadas" (delete protegido)
- `400 Bad Request`: array de mensagens de validação (campos inválidos no create/update)

---

## Types/Interfaces TypeScript

```typescript
// Enums
type Category = 'ENSINO' | 'PESQUISA' | 'EXTENSAO';
type Unity = 'SEMESTRE' | 'HORAS' | 'UNIDADE';

// Response de um activity type
interface ActivityType {
  id: string;                                   // UUID
  cod: string;                                  // código único, ex: "A", "H1", "I3"
  label: string;                                // nome descritivo
  category: Category | null;
  unity: Unity | null;
  maxHoursInComplementarActivities: number | null;  // max horas complementares
  maxHoursPerCertificateOrSemester: number | null;  // max horas por semestre
}

// Body do POST /activity-types (todos obrigatórios)
interface CreateActivityTypePayload {
  cod: string;                                  // max 10 caracteres, único
  label: string;                                // max 255 caracteres
  category: Category;                           // obrigatório
  unity: Unity;                                 // obrigatório
  maxHoursInComplementarActivities: number;     // obrigatório
  maxHoursPerCertificateOrSemester: number;     // obrigatório
}

// Body do PATCH /activity-types/:id (todos opcionais, enviar só o que mudar)
interface UpdateActivityTypePayload {
  cod?: string;
  label?: string;
  category?: Category;
  unity?: Unity;
  maxHoursInComplementarActivities?: number;
  maxHoursPerCertificateOrSemester?: number;
}

// Wrapper de resposta da API
interface ApiResponse<T> {
  data: T;
}

interface ApiError {
  statusCode: number;
  message: string | string[];
}
```

---

## Regras de validação (para validar no frontend também)

| Campo | Regra |
|-------|-------|
| `cod` | Obrigatório, string, máximo 10 caracteres, deve ser único |
| `label` | Obrigatório, string, máximo 255 caracteres |
| `category` | Obrigatório, deve ser um de: `ENSINO`, `PESQUISA`, `EXTENSAO` |
| `unity` | Obrigatório, deve ser um de: `SEMESTRE`, `HORAS`, `UNIDADE` |
| `maxHoursInComplementarActivities` | Obrigatório, número |
| `maxHoursPerCertificateOrSemester` | Obrigatório, número |

---

## Dados atuais no banco (para referência visual)

Os tipos existentes seguem este padrão — códigos como A, B, C, D, E, F, G, H1, H2, H3, I1, I2, I3, J, K, L. Categorias são ENSINO/PESQUISA/EXTENSAO. Unidades são SEMESTRE/HORAS/UNIDADE. Horas complementares variam de 51 a 153. Horas por semestre variam de 17 a 68.

---

## O que implementar

1. **Página de listagem** com tabela mostrando: código, nome, categoria, unidade, max horas complementares, max horas por semestre
2. **Botão de criar** que abre formulário/modal para novo tipo de atividade
3. **Botão de editar** em cada linha para abrir formulário/modal de edição (PATCH parcial)
4. **Botão de deletar** em cada linha com confirmação antes de deletar
5. **Tratamento de erros**: exibir mensagens da API (código duplicado, tipo com atividades vinculadas, validação)
6. **Labels em português** para a interface do usuário
