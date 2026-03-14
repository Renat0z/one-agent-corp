import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const WORKSPACE_DIR = './workspace';

function getFilePath(projectId: string) {
    return path.join(WORKSPACE_DIR, projectId, 'dashboard-data.md');
}

export function createOrUpdateProject(data: any) {
    const filePath = getFilePath(data.id);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const yamlContent = yaml.dump(data);
    const fileContent = `---\n${yamlContent}---\n\n# ${data.name}\nUpdated at: ${new Date().toISOString()}`;
    fs.writeFileSync(filePath, fileContent);
    console.log(`Project ${data.id} updated.`);
}

export function readProject(projectId: string) {
    const filePath = getFilePath(projectId);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---([\s\S]+?)---/);
    return match ? yaml.load(match[1]) : null;
}

export function deleteProject(projectId: string) {
    const filePath = getFilePath(projectId);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Project ${projectId} dashboard data removed.`);
    }
}
