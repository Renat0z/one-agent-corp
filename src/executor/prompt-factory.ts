// One Agent Corp — Prompt Factory
// Builds prompts by reading Markdown templates and interpolating {{variable}} placeholders

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '..');

export interface PromptContext extends Record<string, unknown> {
  modules?: string[]; // List of shared modules to include (e.g., 'core-principles')
  recipe?: string;    // Name of the recipe to apply (e.g., 'standard-engineer')
}

export function interpolate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = vars[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

export class PromptFactory {
  /**
   * Builds a prompt for a given department, applying recipes and including shared modules.
   * Priority: Recipe modules + Context modules + Template.
   */
  async build(
    department: string,
    templateName: string,
    context: PromptContext
  ): Promise<string> {
    const templatePath = path.join(
      SRC_DIR,
      'departments',
      department,
      'prompts',
      `${templateName}.md`
    );

    let raw: string;
    try {
      raw = await fs.readFile(templatePath, 'utf-8');
    } catch (err) {
      throw new Error(`Template not found: "${templatePath}".`);
    }

    const modulesToInclude = new Set<string>(context.modules ?? []);
    let personaInfo = '';

    // 1. Process Recipe if provided
    if (context.recipe) {
      const recipePath = path.join(SRC_DIR, 'departments', 'shared', 'recipes', `${context.recipe}.json`);
      try {
        const recipeRaw = await fs.readFile(recipePath, 'utf-8');
        const recipe = JSON.parse(recipeRaw);
        
        // Merge recipe modules
        if (recipe.modules) recipe.modules.forEach((m: string) => modulesToInclude.add(m));
        
        // Add persona context if defined in recipe
        if (recipe.persona) {
          personaInfo = `\n## AGENT PERSONA: ${recipe.persona}\n---\n`;
        }
      } catch (err) {
        console.warn(`[PromptFactory] Warning: Recipe "${context.recipe}" not found at ${recipePath}`);
      }
    }

    // 2. Load and prepend all unique shared modules
    let modulesContent = '';
    for (const moduleName of modulesToInclude) {
      const modulePath = path.join(SRC_DIR, 'departments', 'shared', 'modules', `${moduleName}.md`);
      try {
        const modRaw = await fs.readFile(modulePath, 'utf-8');
        modulesContent += `\n---\n## SHARED MODULE: ${moduleName.toUpperCase()}\n${modRaw}\n`;
      } catch (err) {
        console.warn(`[PromptFactory] Warning: Module "${moduleName}" not found at ${modulePath}`);
      }
    }

    const finalTemplate = `${modulesContent}${personaInfo}\n---\n${raw}`;
    return interpolate(finalTemplate, context);
  }

  /**
   * Lists all available template names (without .md extension) for a department.
   */
  async list(department: string): Promise<string[]> {
    const promptsDir = path.join(SRC_DIR, 'departments', department, 'prompts');

    let entries: import('fs').Dirent[];
    try {
      entries = await fs.readdir(promptsDir, { withFileTypes: true });
    } catch {
      return [];
    }

    return entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name.replace(/\.md$/, ''));
  }
}
