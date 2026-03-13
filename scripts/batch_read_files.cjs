/**
 * TOOL: Batch Read Files
 * 
 * DESCRIÇÃO:
 * Este script automatiza a leitura de múltiplos arquivos de um projeto e os consolida em um único
 * bloco de texto formatado. Ele é ideal para fornecer contexto completo ao modelo de IA em uma
 * única iteração (input), numerando as linhas de cada arquivo para facilitar referências.
 * 
 * COMO FUNCIONA:
 * 1. O script recebe uma lista de caminhos de arquivos como argumentos de linha de comando.
 * 2. Para cada caminho, ele verifica a existência do arquivo.
 * 3. Lê o conteúdo, adiciona numeração de linhas e encapsula em blocos identificados por IDs (r1, r2, etc).
 * 4. Imprime o resultado final simulando o formato de múltiplas chamadas de ferramenta.
 * 
 * USO:
 * node batch_read_files.js /docs/arquivo1.txt /src/arquivo2.js /docs/arquivo3.md ...
 */

const fs = require('fs');
const path = require('path');

async function batchRead() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log("Uso: node batch_read_files.js <file1> <file2> <file3>...");
        process.exit(1);
    }

    console.log(`=== MENSAGEM DO USUÁRIO ===`);
    console.log(`"leia os ${args.length} arquivos do projeto"\n`);

    console.log(`=== MINHAS TOOL CALLS (disparadas juntas) ===`);
    args.forEach((file, index) => {
        console.log(`[tool_use id="r${index + 1}"] Read { file_path: "${file}" }`);
    });

    console.log(`\n=== TOOL RESULTS (chegam todos juntos) ===\n`);

    for (let i = 0; i < args.length; i++) {
        const filePath = args[i];
        const id = `r${i + 1}`;
        
        try {
            // Remove a barra inicial se existir para tratar como caminho relativo ao CWD
            const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
            const absolutePath = path.resolve(process.cwd(), cleanPath);
            
            if (!fs.existsSync(absolutePath)) {
                console.log(`[tool_result id="${id}"]\n Erro: Arquivo não encontrado: ${filePath}\n`);
                continue;
            }

            const content = fs.readFileSync(absolutePath, 'utf8');
            const lines = content.split('\n');
            
            console.log(`[tool_result id="${id}"]`);
            lines.forEach((line, lineIdx) => {
                const lineNumber = (lineIdx + 1).toString().padStart(8, ' ');
                console.log(`${lineNumber}        ${line.replace(/\r/g, '')}`);
            });
            console.log(''); 

        } catch (error) {
            console.log(`[tool_result id="${id}"]\n Erro ao ler arquivo ${filePath}: ${error.message}\n`);
        }
    }
}

batchRead();
