# ⚡ mage

**Automação e geração de código orientada por patterns e inteligência artificial.**

Mage é uma CLI avançada para desenvolvedores que desejam escalar padrões de projeto. Ela permite que você mantenha um repositório centralizado de patterns (componentes, hooks, serviços, etc.) e use IA para aplicá-los de forma inteligente ou gerar novas soluções autônomas no terminal.

---

## 🚀 Guia de Descoberta (AI/Agent Protocol)

Para testar a CLI em sequência, siga estas 5 fases fundamentais:

### Fase 1: Configuração do Ambiente
Primeiro, conecte a CLI ao seu repositório de padrões e configure o provedor de IA.

```bash
# 1. Configurar o repositório de patterns (detecta automaticamente clone ou scaffold)
mage config set repo seu-usuario/sua-repo-patterns

# 2. Listar modelos disponíveis para garantir o nome exato (Discovery)
mage config list-ai-models

# 3. Configurar Provedor e Chave de IA
mage config set ai-provider gemini
mage config set ai-model gemini-3.1-flash
mage config set ai-key SUA_CHAVE_AQUI

# 4. Verificar a configuração salva
mage config show
```

### Fase 2: Gestão de Patterns e Branches
A Mage permite isolar patterns em diferentes branches. Use isso para organizar projetos.

```bash
# Listar as branches existentes no seu repositório remoto
mage patterns branch list

# Criar uma nova branch para um projeto específico (copiando da main)
mage patterns branch create projeto-alpha --copy-from main

# Alternar para a nova branch em seu ambiente local
mage patterns branch switch projeto-alpha
```

### Fase 3: Sincronização e Patterns
Garanta que seu cache local está em dia com os patterns definidos na branch ativa.

```bash
# Listar patterns disponíveis organizados por escopo (frontend/backend)
mage patterns list

# Forçar sincronização do manifest.json se você o editou recentemente no GitHub
mage patterns sync

# Puxar ou enviar alterações do repositório local de patterns
mage patterns pull
mage patterns push
```

### Fase 4: Inteligência Autônoma (The Agent Mode)
Este é o recurso mais poderoso. O comando `do` decide entre usar um pattern, gerar código ou rodar comandos de sistema.

```bash
# Teste de Geração Inteligente: IA escolhe entre pattern ou criação manual
mage do "crie um componente UserProfile com avatar e bio"

# Teste de Autonomia Terminal: IA propõe comandos shell para você
mage do "inicialize um projeto vite com typescript"
```

### Fase 5: Workflow Estruturado
Use para automação rápida baseada em patterns conhecidos.

```bash
# Geração direta usando um nome de pattern específico
mage generate component Navbar

# Geração com ajuda da IA para preencher variáveis
mage generate --description "Um formulário de contato com validação Yup"
```

---

## 🛠 Manual de Comandos

<!-- START_MAGE_MANUAL -->
### Configuração (`mage config`)
- `set <key> <value>`: Define configurações globais (`repo`, `repo-branch`, `repo-token`, `ai-provider`, `ai-model`, `ai-key`).
- `list-ai-models`: Lista os modelos suportados pelo provedor atual.
- `show`: Exibe a configuração ativa consolidada (Global + Local).
- `init`: Inicializa um arquivo `.magerc.json` local no diretório do projeto.

### Patterns & Git (`mage patterns`)
- `list`: Lista patterns filtrando por scope ou framework.
- `add <caminho>`: Adiciona um arquivo ou pasta local como um novo pattern (com templatização automática).
- `update <nome> [caminho]`: Atualiza o conteúdo de um pattern existente.
- `remove <nome>`: Remove um pattern do repositório e do manifest.
- `branch list/create/switch/delete`: Gerenciamento completo de branches de patterns.
- `sync/push/pull`: Mantém seu repositório de patterns sincronizado com o GitHub.

### IA & Automação
- `do [prompt]`: O Agente Inteligente analisa, decide e executa.
- `generate [pattern] [name]`: O gerador padrão com assistência de IA opcional.
<!-- END_MAGE_MANUAL -->

## 🔒 Segurança
O comando `do`, ao sugerir comandos de terminal (`run_commands`), **sempre** solicitará sua confirmação explicativa antes de executar qualquer ação no shell.

---
**Tech Stack:** Commander, Inquirer, Handlebars, OpenAI & Google Gemini SDKs, TSUP.
