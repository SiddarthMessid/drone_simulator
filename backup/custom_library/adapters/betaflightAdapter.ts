import { DroneAdapter, DroneState, DroneCommand } from '../interfaces/drone';

// MSP (MultiWii Serial Protocol) message codes
enum MSP {
  SET_ARM = 214,
  SET_RAW_RC = 200,
  SET_PID = 202,
  RC_NORMAL = 121
}

export class BetaflightAdapter implements DroneAdapter {
  private connected: boolean = false;
  private stateCallback: ((state: DroneState) => void) | null = null;

  constructor(private options: {
    baudRate: number;
    portPath?: string;
  }) {}
  
  async connect(): Promise<void> {
    if (this.connected) return;
    
    try {
      // Web Serial API implementation would go here
      // For now, just mock the connection
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Betaflight FC:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    
    try {
      // Close serial connection
      this.connected = false;
    } catch (error) {
      console.error('Failed to disconnect from Betaflight FC:', error);
      throw error;
    }
  }
  
  async sendCommand(command: DroneCommand): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to FC');
    }

    switch (command.type) {
      case 'takeoff':
        await this.sendMSPCommand(MSP.SET_ARM, [1]);
        await this.sendMSPCommand(MSP.SET_RAW_RC, this.calculateTakeoffInputs(command.parameters.altitude));
        break;
        
      case 'land':
        await this.sendMSPCommand(MSP.SET_RAW_RC, this.calculateLandingInputs());
        break;
        
      case 'emergencyStop':
        await this.sendMSPCommand(MSP.SET_ARM, [0]);
        break;
        
      default:
        throw new Error(`Unsupported command type: ${command.type}`);
    }
  }
  
  sendTelemetry(state: DroneState): void {
    // Not used for real hardware - telemetry comes from FC
  }
  
  onStateUpdate(callback: (state: DroneState) => void): void {
    this.stateCallback = callback;
  }

  private async sendMSPCommand(code: number, data: number[]): Promise<void> {
    // MSP protocol implementation would go here
    // For testing, just log the command
    console.log(`Sending MSP command ${code} with data:`, data);
  }

  private calculateTakeoffInputs(targetAltitude: number): number[] {
    // Convert to RC values (typically 1000-2000)
    // [roll, pitch, throttle, yaw, aux1, ...]
    return [1500, 1500, 1800, 1500, 1800];
  }

  private calculateLandingInputs(): number[] {
    return [1500, 1500, 1200, 1500, 1500];
  }
}