/**
 * Control Gain Sensitivity Analysis
 * Analyzes PID controller response to varying gain parameters
 */

// Simulate PID controller response
function simulatePIDResponse(kp, ki, kd, setpoint, duration, dt) {
    const steps = Math.floor(duration / dt);
    const time = [];
    const output = [];
    const error_history = [];

    let position = 0;
    let velocity = 0;
    let integral = 0;
    let prevError = 0;

    const mass = 1.5; // kg
    const drag = 0.1;

    for (let i = 0; i < steps; i++) {
        const t = i * dt;
        time.push(t);

        // Calculate error
        const error = setpoint - position;
        error_history.push(error);

        // PID calculation
        integral += error * dt;
        integral = Math.max(-10, Math.min(10, integral)); // Anti-windup

        const derivative = (error - prevError) / dt;
        const control = kp * error + ki * integral + kd * derivative;

        // Physics simulation (simplified)
        const acceleration = control / mass - drag * velocity;
        velocity += acceleration * dt;
        position += velocity * dt;

        output.push(position);
        prevError = error;
    }

    return { time, output, error: error_history };
}

// Calculate performance metrics
function calculateMetrics(time, output, setpoint) {
    const tolerance = 0.02 * setpoint; // 2% tolerance

    // Rise time (10% to 90%)
    const target10 = 0.1 * setpoint;
    const target90 = 0.9 * setpoint;
    let riseTime = null;
    let t10 = null, t90 = null;

    for (let i = 0; i < output.length; i++) {
        if (t10 === null && output[i] >= target10) t10 = time[i];
        if (t90 === null && output[i] >= target90) {
            t90 = time[i];
            riseTime = t90 - t10;
            break;
        }
    }

    // Overshoot
    const maxValue = Math.max(...output);
    const overshoot = ((maxValue - setpoint) / setpoint) * 100;

    // Settling time (within 2% of setpoint)
    let settlingTime = null;
    for (let i = output.length - 1; i >= 0; i--) {
        if (Math.abs(output[i] - setpoint) > tolerance) {
            settlingTime = time[i];
            break;
        }
    }

    // Steady-state error
    const finalValues = output.slice(-50);
    const steadyState = finalValues.reduce((a, b) => a + b) / finalValues.length;
    const steadyStateError = Math.abs(setpoint - steadyState);

    return {
        riseTime: riseTime || 0,
        overshoot: Math.max(0, overshoot),
        settlingTime: settlingTime || time[time.length - 1],
        steadyStateError
    };
}

// Generate data for different Kp values
function analyzeKpSensitivity() {
    const kpValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0];
    const ki = 0.0;
    const kd = 0.3;
    const setpoint = 10.0;
    const duration = 10.0;
    const dt = 0.01;

    const results = [];

    for (const kp of kpValues) {
        const sim = simulatePIDResponse(kp, ki, kd, setpoint, duration, dt);
        const metrics = calculateMetrics(sim.time, sim.output, setpoint);
        results.push({
            kp,
            ...metrics,
            response: sim
        });
    }

    return results;
}

// Generate data for different Kd values
function analyzeKdSensitivity() {
    const kdValues = [0.0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5];
    const kp = 0.3;
    const ki = 0.0;
    const setpoint = 10.0;
    const duration = 10.0;
    const dt = 0.01;

    const results = [];

    for (const kd of kdValues) {
        const sim = simulatePIDResponse(kp, ki, kd, setpoint, duration, dt);
        const metrics = calculateMetrics(sim.time, sim.output, setpoint);
        results.push({
            kd,
            ...metrics,
            response: sim
        });
    }

    return results;
}

// Generate data for different Ki values
function analyzeKiSensitivity() {
    const kiValues = [0.0, 0.01, 0.02, 0.05, 0.1, 0.15, 0.2];
    const kp = 0.3;
    const kd = 0.3;
    const setpoint = 10.0;
    const duration = 15.0;
    const dt = 0.01;

    const results = [];

    for (const ki of kiValues) {
        const sim = simulatePIDResponse(kp, ki, kd, setpoint, duration, dt);
        const metrics = calculateMetrics(sim.time, sim.output, setpoint);
        results.push({
            ki,
            ...metrics,
            response: sim
        });
    }

    return results;
}

// Run analysis
console.log('Running Control Gain Sensitivity Analysis...\n');

console.log('=== Kp Sensitivity Analysis ===');
const kpResults = analyzeKpSensitivity();
console.log('Kp\tRise Time\tOvershoot\tSettling Time\tSS Error');
kpResults.forEach(r => {
    console.log(`${r.kp.toFixed(2)}\t${r.riseTime.toFixed(3)}s\t\t${r.overshoot.toFixed(2)}%\t\t${r.settlingTime.toFixed(3)}s\t\t${r.steadyStateError.toFixed(4)}`);
});

console.log('\n=== Kd Sensitivity Analysis ===');
const kdResults = analyzeKdSensitivity();
console.log('Kd\tRise Time\tOvershoot\tSettling Time\tSS Error');
kdResults.forEach(r => {
    console.log(`${r.kd.toFixed(2)}\t${r.riseTime.toFixed(3)}s\t\t${r.overshoot.toFixed(2)}%\t\t${r.settlingTime.toFixed(3)}s\t\t${r.steadyStateError.toFixed(4)}`);
});

console.log('\n=== Ki Sensitivity Analysis ===');
const kiResults = analyzeKiSensitivity();
console.log('Ki\tRise Time\tOvershoot\tSettling Time\tSS Error');
kiResults.forEach(r => {
    console.log(`${r.ki.toFixed(2)}\t${r.riseTime.toFixed(3)}s\t\t${r.overshoot.toFixed(2)}%\t\t${r.settlingTime.toFixed(3)}s\t\t${r.steadyStateError.toFixed(4)}`);
});

// Export data for visualization
import { writeFileSync } from 'fs';
writeFileSync('gain-analysis-data.json', JSON.stringify({
    kp: kpResults,
    kd: kdResults,
    ki: kiResults
}, null, 2));

console.log('\n✓ Analysis complete! Data saved to gain-analysis-data.json');
