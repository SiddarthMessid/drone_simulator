import * as THREE from 'three';
import { DronePhysics, DroneState as PhysicsState } from '../client/src/lib/dronePhysics';
import { SimulationDroneAdapter } from '../client/src/lib/adapters/simulationAdapter';
import { DroneController } from '../client/src/lib/droneController.new';
import { PIDController } from '../client/src/lib/pidController';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to clone a simple DroneState
function makeState(x=0,y=5,z=0) {
  return {
    position: new THREE.Vector3(x,y,z),
    rotation: new THREE.Vector3(0,0,0),
    velocity: new THREE.Vector3(0,0,0),
    angularVelocity: new THREE.Vector3(0,0,0)
  };
}

async function runScenario(formation: 'triangle'|'line'|'circle', totalDrones=4) {
  console.log(`\n--- Running scenario: ${formation} with ${totalDrones} drones`);

  const drones: {
    id: string;
    physics: DronePhysics;
    adapter: SimulationDroneAdapter;
    controller: DroneController;
    pid: PIDController;
    state: PhysicsState;
  }[] = [];

  // Create leader
  const leaderPhysics = new DronePhysics();
  const leaderAdapter = new SimulationDroneAdapter(leaderPhysics);
  const leaderController = new DroneController(leaderAdapter);
  const leaderPID = new PIDController(leaderController.getPIDParams());
  const leaderState = makeState(0,6,0);
  leaderController.updateState(leaderState);
  leaderController.setAsLeader(true);

  drones.push({ id: 'drone_1', physics: leaderPhysics, adapter: leaderAdapter, controller: leaderController, pid: leaderPID, state: leaderState });

  // Create followers
  for (let i=2;i<=totalDrones;i++){
    const phys = new DronePhysics();
    const adapter = new SimulationDroneAdapter(phys);
    const controller = new DroneController(adapter);
    const pid = new PIDController(controller.getPIDParams());
  // Initialize followers near leader + intended formation offset to avoid huge initial transients
  const leaderInit = makeState(0,6,0);
  const offsets = [];
  // simple placeholder; actual offsets applied below once generated
    const pos = makeState(
      leaderInit.position.x + (i-1)*2,
      leaderInit.position.y,
      leaderInit.position.z + (i-1)*2
    );
    controller.updateState(pos);
    controller.setAsLeader(false);
    drones.push({ id: `drone_${i}`, physics: phys, adapter, controller, pid, state: pos });
  }

  // Assign formation offsets relative to leader
  const spacing = 4;
  function generateOffsets(formationType: string, count: number){
    const offs: THREE.Vector3[] = [];
    switch(formationType){
      case 'triangle':
        for(let i=0;i<count;i++){
          const side = i%2===0?-1:1;
          const row = Math.floor(i/2)+1;
          offs.push(new THREE.Vector3(side*spacing*row, 0, -spacing*row));
        }
        break;
      case 'line':
        const start = -spacing*(count+1)/2;
        for(let i=0;i<count;i++) offs.push(new THREE.Vector3(start + spacing*(i+1),0,0));
        break;
      case 'circle':
        const radius = Math.max(spacing*0.8, spacing*(count/(2*Math.PI)));
        for(let i=0;i<count;i++){
          const angle = (i/count)*Math.PI*2;
          offs.push(new THREE.Vector3(Math.cos(angle)*radius,0,Math.sin(angle)*radius));
        }
        break;
    }
    return offs;
  }

  const followerCount = totalDrones-1;
  const offsetsArr = generateOffsets(formation, followerCount);

  // Assign formation targets and initialize follower positions close to their target
  let idx = 0;
  for (const d of drones){
    if (d.id === 'drone_1') continue;
    const offset = offsetsArr[idx++];
    d.controller.setFormationTarget(offset);
    // place follower near leader + offset to avoid large transients
    const leaderPos = drones[0].controller.getState().position.clone();
    const initPos = leaderPos.clone().add(offset);
    initPos.y = leaderPos.y; // same altitude
    d.controller.updateState({ ...d.controller.getState(), position: initPos });
    d.controller.updateLeaderPosition(leaderPos, drones[0].controller.getState().rotation);
  }

  // Simulation loop
  const dt = 0.02;
  const steps = 300; // 6 seconds
  const logs: any[] = [];

  for (let step=0; step<steps; step++){
    const t = step*dt;

  // Move leader: modest sinusoidal altitude and very small lateral motion
  const leader = drones[0];
  const leaderPos = leader.controller.getState().position.clone();
  leaderPos.y = 6 + Math.sin(t*0.8)*0.8; // smaller up/down
  leaderPos.x = Math.sin(t*0.1)*0.5; // much smaller lateral
  leader.controller.updateState({ ...leader.controller.getState(), position: leaderPos });

    // update followers
    for (const d of drones){
      if (d.id === 'drone_1'){
        // leader physics: just set its state into physics so others can read
        d.adapter.updateState(d.controller.getState());
        d.state = d.controller.getState();
        continue;
      }

      // update leader info
      d.controller.updateLeaderPosition(leader.controller.getState().position, leader.controller.getState().rotation);

      // compute setpoints
      const setpoints = d.controller.getSetpoints();

      // create pidState from controller state
      const ds = d.controller.getState();
      const pidState = { pitch: ds.rotation.x, roll: ds.rotation.z, yaw: ds.rotation.y, altitude: ds.position.y };

      // pid outputs
      const pidOut = d.pid.update(pidState, setpoints, dt);

      // physics update
      const { newState } = d.physics.update(ds, pidOut, new THREE.Vector3(0,0,0), dt, []);

      // feed new state back
      d.controller.updateState(newState);
      d.adapter.updateState(newState);
      d.state = newState;
    }

    // log positions every 0.2s
    if (step % 10 === 0){
      const snap: any = { t: t.toFixed(2), drones: {} };
      for (const d of drones){
        const s = d.controller.getState().position;
        snap.drones[d.id] = { x: s.x.toFixed(2), y: s.y.toFixed(2), z: s.z.toFixed(2) };
      }
      logs.push(snap);
      console.log(snap);
    }

    // small pause to allow event loop (not needed but readable)
    await sleep(0);
  }

  return logs;
}

(async ()=>{
  const forms: ('triangle'|'line'|'circle')[] = ['triangle','line','circle'];
  for (const f of forms){
    await runScenario(f, 5);
  }
  console.log('\nSimulation runs complete.');
})();
