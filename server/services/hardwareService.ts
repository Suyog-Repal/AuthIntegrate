// server/services/hardwareService.ts
import { EventEmitter } from "events";
import type { InsertAccessLog } from "@shared/schema";

// Hardware service (Simulated for internal event processing)
export class HardwareService extends EventEmitter {
  // Assume connected via Wi-Fi once server is up
  private connected: boolean = true; 
  private simulationMode: boolean = true; 

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    console.log("Hardware service initialized in STANDALONE HTTP MODE");
  }

  // Used by the new /api/hardware/event endpoint to log and broadcast events internally
  processAccessEvent(userId: number, result: "GRANTED" | "DENIED" | "REGISTERED", note: string) {
    const log: InsertAccessLog = {
      userId,
      result,
      note: note,
    };
    this.emit("access_event", log);

    // Emit general status change (maintains websocket protocol)
    this.emit('hardware_status_change', true); 
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Keeping simulateAccessEvent for manual admin testing
  simulateAccessEvent(userId: number, result: "GRANTED" | "DENIED" | "REGISTERED", note?: string) {
    this.processAccessEvent(userId, result, note || 'Simulated internal event');
  }
}

export const hardwareService = new HardwareService();