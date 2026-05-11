import { EventEmitter } from "events";

export class HardwareService extends EventEmitter {
  private connected: boolean = true; 

  constructor() {
    super();
  }

  processAccessEvent(userId: number | null, result: "GRANTED" | "DENIED" | "REGISTERED", note: string) {
    const log = {
      userId,
      result,
      note,
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
