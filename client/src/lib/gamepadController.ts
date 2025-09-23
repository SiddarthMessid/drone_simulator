import { PIDSetpoints } from "./pidController";
import { drone } from "./droneController";

export interface GamepadState {
  connected: boolean;
  id: string;
  axes: number[];
  buttons: boolean[];
}

export interface GamepadMapping {
  leftStickX: number;      // Roll control
  leftStickY: number;      // Pitch control  
  rightStickX: number;     // Yaw control
  rightStickY: number;     // Throttle control
  buttonA: number;         // Takeoff
  buttonB: number;         // Land
  buttonX: number;         // Hover
  buttonY: number;         // Enable/Disable Manual Control
  leftBumper: number;      // Extra command
  rightBumper: number;     // Extra command
  leftTrigger: number;     // Fine control modifier
  rightTrigger: number;    // Boost modifier
}

// Xbox One controller mapping
const XBOX_MAPPING: GamepadMapping = {
  leftStickX: 0,      // Left stick horizontal
  leftStickY: 1,      // Left stick vertical
  rightStickX: 2,     // Right stick horizontal  
  rightStickY: 3,     // Right stick vertical
  buttonA: 0,         // A button
  buttonB: 1,         // B button
  buttonX: 2,         // X button
  buttonY: 3,         // Y button
  leftBumper: 4,      // LB
  rightBumper: 5,     // RB
  leftTrigger: 6,     // LT
  rightTrigger: 7     // RT
};

export class GamepadController {
  private gamepadState: GamepadState | null = null;
  private lastButtonPresses: boolean[] = [];
  private deadzone = 0.15;
  private sensitivity = 1.0;
  private lastUpdate = 0;
  private buttonCooldown = 500; // 500ms cooldown between button presses
  private lastButtonTime: number[] = [];
  
  constructor() {
    this.setupGamepadEvents();
    this.startPolling();
  }

  private setupGamepadEvents(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      console.log(`🎮 Gamepad connected: ${e.gamepad.id}`);
      this.gamepadState = {
        connected: true,
        id: e.gamepad.id,
        axes: [...e.gamepad.axes],
        buttons: e.gamepad.buttons.map(b => b.pressed)
      };
      this.lastButtonPresses = new Array(e.gamepad.buttons.length).fill(false);
      this.lastButtonTime = new Array(e.gamepad.buttons.length).fill(0);
    });

    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
      console.log(`🎮 Gamepad disconnected: ${e.gamepad.id}`);
      this.gamepadState = null;
    });
  }

  private startPolling(): void {
    const poll = () => {
      this.updateGamepadState();
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }

  private updateGamepadState(): void {
    if (typeof navigator === 'undefined') return;
    
    const gamepads = navigator.getGamepads();
    const connectedGamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
    
    if (connectedGamepad) {
      // Initialize gamepad state if we found a controller (even if no connect event fired)
      if (!this.gamepadState?.connected) {
        console.log(`🎮 Gamepad detected: ${connectedGamepad.id}`);
        this.gamepadState = {
          connected: true,
          id: connectedGamepad.id,
          axes: [...connectedGamepad.axes],
          buttons: connectedGamepad.buttons.map(b => b.pressed)
        };
        this.lastButtonPresses = new Array(connectedGamepad.buttons.length).fill(false);
        this.lastButtonTime = new Array(connectedGamepad.buttons.length).fill(0);
      } else {
        // Update existing gamepad state
        this.gamepadState.axes = [...connectedGamepad.axes];
        this.gamepadState.buttons = connectedGamepad.buttons.map(b => b.pressed);
      }
      this.handleButtonPresses();
    } else if (this.gamepadState?.connected) {
      // No gamepad found but we had one connected - mark as disconnected
      console.log("🎮 Gamepad disconnected");
      this.gamepadState.connected = false;
    }
  }

  private handleButtonPresses(): void {
    if (!this.gamepadState) return;
    
    const currentTime = Date.now();
    
    // Check each button for new presses
    this.gamepadState.buttons.forEach((pressed, index) => {
      const wasPressed = this.lastButtonPresses[index];
      const timeSinceLastPress = currentTime - (this.lastButtonTime[index] || 0);
      
      // Button was just pressed and cooldown has elapsed
      if (pressed && !wasPressed && timeSinceLastPress > this.buttonCooldown) {
        this.handleButtonPress(index);
        this.lastButtonTime[index] = currentTime;
      }
    });
    
    this.lastButtonPresses = [...this.gamepadState.buttons];
  }

  private async handleButtonPress(buttonIndex: number): Promise<void> {
    try {
      switch (buttonIndex) {
        case XBOX_MAPPING.buttonA:
          console.log("🎮 A button pressed - Taking off");
          await drone.takeoff(8);
          break;
          
        case XBOX_MAPPING.buttonB:
          console.log("🎮 B button pressed - Landing");
          await drone.land();
          break;
          
        case XBOX_MAPPING.buttonX:
          console.log("🎮 X button pressed - Hovering");
          await drone.hover();
          break;
          
        case XBOX_MAPPING.buttonY:
          console.log("🎮 Y button pressed - Toggle manual control");
          if (drone.isAutopilotActive()) {
            drone.enableManualControl();
            console.log("Manual control enabled");
          } else {
            await drone.hover();
            console.log("Autopilot hover enabled");
          }
          break;
          
        case XBOX_MAPPING.leftBumper:
          console.log("🎮 LB pressed - Reduce altitude");
          await drone.setThrottle(-30);
          break;
          
        case XBOX_MAPPING.rightBumper:
          console.log("🎮 RB pressed - Increase altitude");
          await drone.setThrottle(70);
          break;
      }
    } catch (error) {
      console.error("Gamepad button action failed:", error);
    }
  }

  private applyDeadzone(value: number): number {
    if (Math.abs(value) < this.deadzone) {
      return 0;
    }
    // Scale the remaining range to maintain smooth control
    const sign = Math.sign(value);
    const scaledValue = (Math.abs(value) - this.deadzone) / (1 - this.deadzone);
    return sign * scaledValue * this.sensitivity;
  }

  public getControlInputs(): PIDSetpoints {
    // Always check real-time gamepad state
    if (typeof navigator !== 'undefined') {
      const gamepads = navigator.getGamepads();
      const connectedGamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
      
      if (connectedGamepad) {
        // Use real-time gamepad data directly
        const leftStickX = this.applyDeadzone(connectedGamepad.axes[XBOX_MAPPING.leftStickX]);
        const leftStickY = this.applyDeadzone(connectedGamepad.axes[XBOX_MAPPING.leftStickY]);
        const rightStickX = this.applyDeadzone(connectedGamepad.axes[XBOX_MAPPING.rightStickX]);
        const rightStickY = this.applyDeadzone(connectedGamepad.axes[XBOX_MAPPING.rightStickY]);

        // Calculate control intensity based on trigger inputs for fine/boost control
        const leftTrigger = connectedGamepad.buttons[XBOX_MAPPING.leftTrigger]?.pressed ? 0.3 : 1.0;
        const rightTrigger = connectedGamepad.buttons[XBOX_MAPPING.rightTrigger]?.pressed ? 1.8 : 1.0;
        const controlMultiplier = leftTrigger * rightTrigger;

        const controlInputs = {
          pitch: -leftStickY * 0.4 * controlMultiplier,      // Forward/backward (inverted)
          roll: leftStickX * 0.4 * controlMultiplier,        // Left/right
          yaw: rightStickX * 1.0 * controlMultiplier,        // Rotation
          throttle: -rightStickY * 1.0 * controlMultiplier   // Up/down (inverted)
        };
        
        // Log gamepad inputs when they're active for debugging
        if (Math.abs(controlInputs.pitch) > 0 || Math.abs(controlInputs.roll) > 0 || 
            Math.abs(controlInputs.yaw) > 0 || Math.abs(controlInputs.throttle) > 0) {
          console.log("🎮 Gamepad inputs active:", controlInputs);
        }
        
        return controlInputs;
      }
    }
    
    return { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
  }

  public isConnected(): boolean {
    // Check real-time gamepad presence in addition to stored state
    if (typeof navigator !== 'undefined') {
      const gamepads = navigator.getGamepads();
      const connectedGamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
      return !!connectedGamepad;
    }
    return this.gamepadState?.connected || false;
  }

  public getGamepadInfo(): string {
    // Check real-time gamepad info
    if (typeof navigator !== 'undefined') {
      const gamepads = navigator.getGamepads();
      const connectedGamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
      if (connectedGamepad) {
        return `Connected: ${connectedGamepad.id}`;
      }
    }
    
    if (this.gamepadState?.connected) {
      return `Connected: ${this.gamepadState.id}`;
    }
    
    return "No controller connected - Connect Xbox controller and press any button";
  }

  public setSensitivity(sensitivity: number): void {
    this.sensitivity = Math.max(0.1, Math.min(2.0, sensitivity));
  }

  public setDeadzone(deadzone: number): void {
    this.deadzone = Math.max(0.0, Math.min(0.5, deadzone));
  }
}

// Export singleton instance
export const gamepadController = new GamepadController();