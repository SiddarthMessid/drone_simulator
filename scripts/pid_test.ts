import { PIDController, PIDParams, PIDState, PIDSetpoints } from '../client/src/lib/pidController';

// Create PID params similar to DroneController defaults
const params: PIDParams = {
  pitch: { kp: 2.2, ki: 0.2, kd: 0.4 },
  roll: { kp: 2.2, ki: 0.2, kd: 0.4 },
  yaw: { kp: 1.0, ki: 0.05, kd: 0.15 },
  altitude: { kp: 1.0, ki: 0.1, kd: 0.2 }
};

const pid = new PIDController(params);

let state: PIDState = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
const setpoints: PIDSetpoints = { pitch: 0, roll: 0, yaw: 0, throttle: 0.5 };

console.log('Simulating step response: pitch step to -0.2 radians (nose down)');
setpoints.pitch = -0.2; // desired pitch angle (radians)

const dt = 0.02; // 50Hz
for (let i = 0; i < 100; i++) {
  const outputs = pid.update(state, setpoints, dt);

  // simple plant: pitch angle integrates from pitch command (torque->angle simplified)
  // apply a small effect of PID output to state.pitch
  state.pitch += outputs.pitch * 0.01; // scaling to simulate response
  // decay towards zero if no command
  state.pitch *= 0.995;

  if (i % 10 === 0) {
    console.log(`t=${(i*dt).toFixed(2)}s pitch=${state.pitch.toFixed(3)} outputs.pitch=${outputs.pitch.toFixed(3)}`);
  }
}

console.log('Test complete.');
