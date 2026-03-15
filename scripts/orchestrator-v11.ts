/**
 * orchestrator-v11.ts
 * One Agent Corp - High-Density Parallel Orchestrator (AIOX-Inspired)
 */

import { execa } from "execa";
import * as fs from "fs";
import * as path from "path";

interface Task {
  id: string;
  script: string;
  dependencies: string[];
  status: "pending" | "running" | "completed" | "failed";
  promise?: Promise<void>;
}

class OrchestratorV11 {
  private tasks: Map<string, Task> = new Map();

  constructor(private projectId: string) {}

  addTask(id: string, script: string, deps: string[] = []) {
    this.tasks.set(id, { id, script, dependencies: deps, status: "pending" });
  }

  async run() {
    console.log(`\n🚀 Starting Orchestrator V11 for Project: ${this.projectId}`);
    
    while (this.hasPendingTasks()) {
      const readyTasks = Array.from(this.tasks.values()).filter(
        t => t.status === "pending" && t.dependencies.every(d => this.tasks.get(d)?.status === "completed")
      );

      if (readyTasks.length === 0 && this.hasRunningTasks()) {
        await Promise.race(Array.from(this.tasks.values()).filter(t => t.status === "running").map(t => t.promise));
        continue;
      }

      if (readyTasks.length === 0 && this.hasPendingTasks()) {
        throw new Error("Deadlock detected in task dependencies!");
      }

      for (const task of readyTasks) {
        this.executeTask(task);
      }
    }
    console.log("✅ All tasks completed.");
  }

  private async executeTask(task: Task) {
    task.status = "running";
    console.log(`[RUNNING] ${task.id}...`);
    
    task.promise = (async () => {
      try {
        await execa("node", ["--import", "tsx", task.script, `--project=${this.projectId}`], { stdio: "inherit" });
        task.status = "completed";
        console.log(`[COMPLETED] ${task.id}`);
      } catch (err) {
        task.status = "failed";
        console.error(`[FAILED] ${task.id}:`, err);
        process.exit(1);
      }
    })();
  }

  private hasPendingTasks() {
    return Array.from(this.tasks.values()).some(t => t.status !== "completed");
  }

  private hasRunningTasks() {
    return Array.from(this.tasks.values()).some(t => t.status === "running");
  }
}

// Example usage:
// const orch = new OrchestratorV11("test-project");
// orch.addTask("scout", "scripts/market-scout.ts");
// orch.addTask("prd", "scripts/generate-prd.ts", ["scout"]);
// orch.addTask("strategy", "scripts/strategy-review.ts", ["scout"]);
// orch.run();
