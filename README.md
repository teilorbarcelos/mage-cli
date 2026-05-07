# ⚡ mage

**O Gerenciador Centralizado de Boilerplates Full-Stack.**

## 🎯 O Problema

Todo desenvolvedor conhece a dor de iniciar um novo projeto:
- *"Qual framework usar dessa vez?"*
- *"Como eu configuro o TypeScript e o Linter mesmo?"*
- *"Onde está aquele meu projeto antigo pra eu copiar a estrutura do banco de dados e as configurações do Docker?"*

A fadiga de configuração (Configuration Fatigue) nos faz perder horas preciosas apenas preparando o terreno, lidando com documentações desatualizadas e copiando e colando arquivos de projetos anteriores. Isso gera inconsistência na arquitetura, atrasa o início do desenvolvimento real e desmotiva a equipe.

## 🚀 A Solução: Mage CLI

O **Mage CLI** nasceu para eliminar esse atrito. Ele funciona como um **hub unificado para todos os seus boilerplates**, sejam eles de frontend (React, Vue, Angular) ou backend (Node.js, Python, Java, PHP).

Em vez de decorar URLs de repositórios ou manter pastas de "projetos base" desatualizados na sua máquina, o Mage permite que você inicie qualquer arquitetura baseada em padrões sólidos em segundos, sempre baixando a versão mais recente direto da fonte. E o melhor: ele já renomeia o projeto e prepara o repositório git para você!

---

## 💻 Como Funciona

### 1. Configuração Global (Apenas uma vez)
Conecte o Mage ao seu arquivo de menu (onde ficam mapeados os seus boilerplates):

```bash
mage config set menu-url file:///home/seu-usuario/projetos/mage-cli-menu/menu.json
# Ou usando um arquivo remoto do GitHub:
# mage config set menu-url https://raw.githubusercontent.com/usuario/repo/main/menu.json
```

### 2. Iniciando um Novo Projeto
Basta rodar o comando principal no seu terminal:

```bash
mage do
```

O Mage fará perguntas interativas e amigáveis:
1. **O que você deseja que eu faça?** (Você navega por um menu com setas do teclado: *Frontend -> React*, etc.)
2. **Qual o nome do novo projeto?**

Feito isso, o Mage clona o boilerplate em tempo real, remove o histórico `.git` original, aplica o novo nome configurado nos arquivos e inicializa o projeto limpo para você começar a programar imediatamente.

### 3. Comandos de Projeto (Project Scripts)
Se você estiver dentro de um projeto que contém o arquivo `magerc.json`, o comando `mage do` entra no modo local. Ele lê os scripts padronizados do projeto e exibe um menu de execução rápida, ideal para rodar fluxos de trabalho sem precisar lembrar dos comandos exatos do Makefile ou npm:

```bash
⚡ mage Project Scripts
──────────────────────────────────────────────────
? O que você deseja que eu faça? (Use arrow keys)
❯ Start Development Server (make dev) 
  Run Tests (make test) 
  Generate CRUD (make generate) 
```

---

## ⚙️ Como configurar seus próprios Boilerplates

O Mage é totalmente independente. Para que um boilerplate tire proveito máximo da ferramenta, basta adicionar um arquivo `magerc.json` na raiz do seu repositório:

Exemplo de `magerc.json`:
```json
{
  "scripts": [
    {
      "name": "Start Development Server",
      "command": "make dev"
    },
    {
      "name": "Run Tests",
      "command": "make test"
    }
  ],
  "replacements": [
    {
      "path": "package.json",
      "pattern": "backend-node"
    }
  ]
}
```
- **`scripts`**: Mapeia os comandos daquele boilerplate (Make, npm, composer) para opções bonitas e navegáveis no menu.
- **`replacements`**: Ensina o Mage a encontrar uma string literal específica (como o nome original do boilerplate, `"backend-node"`) em um arquivo e substituir pelo nome escolhido pelo usuário na hora da geração.

### Estrutura do menu.json

Para organizar seus boilerplates, você deve criar um arquivo `menu.json`. Ele suporta categorias aninhadas para facilitar a navegação.

Exemplo de `menu.json`:
```json
{
  "name": "Meus Boilerplates",
  "items": [
    {
      "name": "Frontend",
      "type": "category",
      "items": [
        {
          "name": "React + Vite",
          "type": "boilerplate",
          "url": "https://github.com/usuario/react-boilerplate"
        }
      ]
    },
    {
      "name": "Backend",
      "type": "category",
      "items": [
        {
          "name": "Node.js + Clean Architecture",
          "type": "boilerplate",
          "url": "https://github.com/usuario/node-boilerplate"
        }
      ]
    }
  ]
}
```

---

**Tech Stack:** TypeScript, Commander, Inquirer.
