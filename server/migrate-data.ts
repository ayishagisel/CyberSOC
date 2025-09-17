import { db } from "./db";
import { alerts, endpoints, logs, playbooks } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

async function migrateData() {
  console.log("Starting data migration...");
  
  try {
    // Read JSON data
    const dataDir = path.join(import.meta.dirname, "data");
    
    const alertsData = JSON.parse(await fs.readFile(path.join(dataDir, "alerts.json"), "utf-8"));
    const endpointsData = JSON.parse(await fs.readFile(path.join(dataDir, "endpoints.json"), "utf-8"));
    const logsData = JSON.parse(await fs.readFile(path.join(dataDir, "logs.json"), "utf-8"));
    const playbookData = JSON.parse(await fs.readFile(path.join(dataDir, "playbook.json"), "utf-8"));
    
    // Clear existing data
    await db.delete(logs);
    await db.delete(alerts);
    await db.delete(endpoints);
    await db.delete(playbooks);
    
    console.log("Cleared existing data");
    
    // Insert alerts
    if (alertsData.length > 0) {
      await db.insert(alerts).values(alertsData.map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp)
      })));
      console.log(`Migrated ${alertsData.length} alerts`);
    }
    
    // Insert endpoints
    if (endpointsData.length > 0) {
      await db.insert(endpoints).values(endpointsData);
      console.log(`Migrated ${endpointsData.length} endpoints`);
    }
    
    // Insert logs
    if (logsData.length > 0) {
      await db.insert(logs).values(logsData.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      })));
      console.log(`Migrated ${logsData.length} logs`);
    }
    
    // Insert playbooks (if it's an array)
    if (Array.isArray(playbookData) && playbookData.length > 0) {
      await db.insert(playbooks).values(playbookData);
      console.log(`Migrated ${playbookData.length} playbooks`);
    } else if (playbookData && typeof playbookData === 'object') {
      // If it's a single playbook object, wrap it in array
      await db.insert(playbooks).values([playbookData]);
      console.log("Migrated 1 playbook");
    }
    
    console.log("Data migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateData().then(() => {
  process.exit(0);
});