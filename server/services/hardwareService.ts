import { EventEmitter } from "events";
import type { InsertAccessLog } from "@shared/schema";

// Hardware service for ESP32 serial communication
// In production, this would use SerialPort to communicate with ESP32
// For now, we'll implement simulation mode for testing

export class HardwareService extends EventEmitter {
  private connected: boolean = false;
  private simulationMode: boolean = true;

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    // In simulation mode, we're always "connected"
    if (this.simulationMode) {
      this.connected = true;
      console.log("Hardware service initialized in simulation mode");
    } else {
      // TODO: Initialize SerialPort connection to ESP32
      // const port = new SerialPort({ path: process.env.SERIAL_PORT || 'COM3', baudRate: 115200 });
      console.log("Hardware service: Real ESP32 mode not implemented yet");
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Simulate hardware events for testing
  simulateAccessEvent(userId: number, result: "GRANTED" | "DENIED" | "REGISTERED", note?: string) {
    if (!this.simulationMode) {
      throw new Error("Simulation only available in simulation mode");
    }

    const log: InsertAccessLog = {
      userId,
      result,
      note: note || `Simulated ${result.toLowerCase()} access`,
    };

    this.emit("access_event", log);
  }

  // Handle real ESP32 data
  // Format expected: "REG:userId:fingerId:password" or "LOGIN:userId:result"
  private handleSerialData(data: string) {
    try {
      const parts = data.trim().split(":");
      
      if (parts[0] === "REG") {
        // Registration event
        const userId = parseInt(parts[1]);
        this.emit("registration", {
          userId,
          fingerId: parseInt(parts[2]),
          password: parts[3],
        });
      } else if (parts[0] === "LOGIN") {
        // Login event
        const userId = parseInt(parts[1]);
        const result = parts[2] as "GRANTED" | "DENIED";
        
        const log: InsertAccessLog = {
          userId,
          result,
          note: "Hardware authentication",
        };
        
        this.emit("access_event", log);
      }
    } catch (error) {
      console.error("Error parsing serial data:", error);
    }
  }
}

export const hardwareService = new HardwareService();
