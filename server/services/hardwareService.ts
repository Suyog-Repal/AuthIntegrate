// server/services/hardwareService.ts
import { EventEmitter } from "events";
import type { InsertAccessLog } from "@shared/schema";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

// Hardware service for ESP32 serial communication
export class HardwareService extends EventEmitter {
  private connected: boolean = false;
  private serialPort: SerialPort | null = null;
  // Set to false to enable real serial communication
  private simulationMode: boolean = false; 

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    // If simulationMode is manually forced or if SERIAL_PORT is not defined, use simulation.
    const portPath = process.env.SERIAL_PORT;
    if (!portPath) {
        this.simulationMode = true;
    }
    
    if (this.simulationMode) {
      this.connected = true;
      console.log("Hardware service initialized in SIMULATION MODE");
      return;
    }

    // --- REAL SERIAL PORT INITIALIZATION ---
    const baudRate = parseInt(process.env.SERIAL_BAUD || '115200', 10);
    
    try {
        this.serialPort = new SerialPort({ 
            path: portPath!, 
            baudRate: baudRate,
            autoOpen: true
        });

        const parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        this.serialPort.on('open', () => {
            console.log(`✅ Serial port opened on ${portPath} at ${baudRate} baud.`);
            this.connected = true;
            this.emit('hardware_status_change', true); // Notify status change
        });

        this.serialPort.on('error', (err) => {
            console.error('❌ Serial port error:', err.message);
            this.connected = false;
            this.emit('hardware_status_change', false);
        });

        this.serialPort.on('close', () => {
            console.warn('⚠️ Serial port closed.');
            this.connected = false;
            this.emit('hardware_status_change', false);
        });

        parser.on('data', (data) => this.handleSerialData(data));

    } catch (error: any) {
        console.error('Failed to initialize real serial port:', error.message);
        this.connected = false;
    }
  }

  // Parses raw serial data (REG:userId:password:fingerId or LOGIN:password:fingerId:userId:result)
  private handleSerialData(data: string) {
    const cleanData = data.replace(/[^\x20-\x7E\r\n]/g, '').trim();
    if (!cleanData || cleanData.startsWith('Received:')) return;
    
    console.log('Cleaned data from ESP32:', cleanData);
    
    try {
        const parts = cleanData.split(':');
        const command = parts[0];
        
        if (command === 'REG' && parts.length >= 4) {
            // Format: REG:userId:password:fingerId
            const userId = parseInt(parts[1]);
            const password = parts[2];
            const fingerId = parseInt(parts[3]);

            this.emit("registration", { userId, fingerId, password });
            this.sendSerialResponse(`SUCCESS:REG ${userId}`);

        } else if (command === 'LOGIN' && parts.length >= 5) {
            // Format: LOGIN:password:fingerId:userId:result (Matches C++ output)
            const userId = parseInt(parts[3]); 
            const result = parts[4] as "GRANTED" | "DENIED"; 
            
            this.emit("access_event", { 
                userId: userId,
                result: result,
                note: `Hardware access attempt. Result from ESP32: ${result}` 
            });
            
            this.sendSerialResponse(`SUCCESS:LOGIN ${userId}:${result}`);

        } else {
            console.error('Unknown or invalid data format received:', cleanData);
            this.sendSerialResponse('ERROR:Invalid data');
        }
    } catch (error) {
        console.error('Error processing serial data:', error);
        this.sendSerialResponse('ERROR:Parse error');
    }
  }

  private sendSerialResponse(message: string) {
    if (this.serialPort && this.serialPort.isOpen) {
        this.serialPort.write(message + '\n', (err) => {
            if (err) console.error('Error writing to serial port:', err.message);
        });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Simulate hardware events for testing (kept for compatibility)
  simulateAccessEvent(userId: number, result: "GRANTED" | "DENIED" | "REGISTERED", note?: string) {
    if (!this.simulationMode) {
      // Allow simulation only if running in simulation mode
      this.emit("access_event", { userId, result, note: `Simulated ${result.toLowerCase()} access` });
      return;
    }
    const log: InsertAccessLog = {
      userId,
      result,
      note: note || `Simulated ${result.toLowerCase()} access`,
    };
    this.emit("access_event", log);
  }
}

export const hardwareService = new HardwareService();