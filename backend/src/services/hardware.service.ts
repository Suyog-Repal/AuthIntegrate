import { EventEmitter } from "events";
import type { InsertAccessLog } from "@shared/schema";

export class HardwareService extends EventEmitter {
  private connected: boolean = true; 

  constructor() {
    super();
  }

  processAccessEvent(userId: number, result: "GRANTED" | "DENIED" | "REGISTERED", note: string) {
    const log: InsertAccessLog = {
      userId,
      result,
      note: note,
    };
    this.emit("access_event", log);
    this.emit('hardware_status_change', true); 
  }

  isConnected(): boolean {
    return this.connected;
  }

  simulateAccessEvent(userId: number, result: "GRANTED" | "DENIED" | "REGISTERED", note?: string) {
    this.processAccessEvent(userId, result, note || 'Simulated internal event');
  }
}

export const hardwareService = new HardwareService();
