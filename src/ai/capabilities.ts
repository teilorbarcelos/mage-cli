/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is synchronized from README.md via scripts/sync-capabilities.ts
 */

export const MAGE_CLI_CAPABILITIES = `
### Configuração (\`mage config\`)
- \`set <key> <value>\`: Define configurações globais (\`repo\`, \`repo-branch\`, \`repo-token\`, \`ai-provider\`, \`ai-model\`, \`ai-key\`).
- \`list-ai-models\`: Lista os modelos suportados pelo provedor atual.
- \`show\`: Exibe a configuração ativa consolidada (Global + Local).
- \`init\`: Inicializa um arquivo \`.magerc.json\` local no diretório do projeto.

### Patterns & Git (\`mage patterns\`)
- \`list\`: Lista patterns filtrando por scope ou framework.
- \`add <caminho>\`: Adiciona um arquivo ou pasta local como um novo pattern (com templatização automática).
- \`update <nome> [caminho]\`: Atualiza o conteúdo de um pattern existente.
- \`remove <nome>\`: Remove um pattern do repositório e do manifest.
- \`branch list/create/switch/delete\`: Gerenciamento completo de branches de patterns.
- \`sync/push/pull\`: Mantém seu repositório de patterns sincronizado com o GitHub.

### IA & Automação
- \`do [prompt]\`: O Agente Inteligente analisa, decide e executa.
- \`generate [pattern] [name]\`: O gerador padrão com assistência de IA opcional.
`;
