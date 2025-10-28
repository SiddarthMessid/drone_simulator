# 3D Drone Flight Simulation

## Overview

This is a real-time 3D drone flight simulation application with multi-drone fleet capabilities. Users can control a main drone using keyboard inputs, customize flight behavior through a Python-like PID controller code editor, and command a fleet of autonomous drones that automatically follow the main drone in formation. The application features realistic physics simulation, wind effects, swarm behaviors, and visual telemetry data.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **3D Rendering**: Three.js via React Three Fiber (@react-three/fiber)
- **3D Utilities**: React Three Drei for enhanced 3D components
- **State Management**: Zustand for global state management
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Development**: Vite for hot module replacement and bundling
- **Build System**: ESBuild for production builds
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Storage**: Memory-based storage with interface for database expansion

### Key Components

#### 3D Simulation Engine
- **DronePhysics**: Realistic flight dynamics with mass, inertia, drag, and gravity calculations
- **PIDController**: Proportional-Integral-Derivative control system for stable flight
- **DroneModel**: 3D visual representation with animated rotors
- **Environment**: Flight area with ground plane, boundaries, and landing pad

#### Code Editor System
- **CodeCompiler**: Parses Python-like syntax to extract PID parameters
- **Real-time Compilation**: Validates and applies user code changes instantly
- **Error Handling**: Provides feedback for syntax and parameter validation errors

#### Control Systems
- **6-Channel Control**: WASD for pitch/roll, arrow keys for yaw/throttle
- **Wind Simulation**: Constant and variable wind effects with directional control
- **Telemetry Display**: Real-time flight data including altitude, speed, and attitude

#### Multi-Drone Fleet System
- **Leader-Follower Architecture**: Fleet drones automatically follow the main (user-controlled) drone using multi-agent algorithms
- **Formation Control**: V-formation with dynamic position calculation based on drone count
- **Swarm Behaviors**: Follow, scatter, and gather modes with proper world-space coordinate handling
- **Automatic Assignment**: New drones receive formation offsets and begin following immediately
- **Position Synchronization**: Fleet drone positions continuously updated for UI and telemetry systems

## Data Flow

### Main Drone
1. **User Input**: Keyboard controls captured by React Three Drei's KeyboardControls
2. **Control Processing**: Inputs mapped to desired drone setpoints (pitch, roll, yaw, throttle)
3. **PID Calculation**: Custom PID controller calculates motor outputs based on current state vs setpoints
4. **Physics Update**: DronePhysics applies forces, torques, and environmental effects
5. **Visual Update**: 3D scene renders updated drone position and orientation
6. **Telemetry Update**: UI displays current flight parameters

### Fleet Drones (Multi-Agent System)
1. **Formation Assignment**: When added, each drone receives a V-formation offset via autoAssignFormation()
2. **Leader Tracking**: Every frame, updateMainDroneFormation() retrieves main drone's position and rotation
3. **Target Calculation**: Each drone's calculateFormationSetpoints() transforms its formation offset to world space using the main drone's current position
4. **PID Control**: Fleet drones use PID controllers to smoothly navigate to their formation targets
5. **Physics Simulation**: Each fleet drone runs independent physics with altitude control and velocity damping
6. **Position Sync**: Drone positions written back to dronePositions map for UI, telemetry, and swarm behaviors

## External Dependencies

### Core Libraries
- **@react-three/fiber**: 3D rendering engine integration
- **@react-three/drei**: 3D utility components and helpers
- **@react-three/postprocessing**: Visual effects and rendering enhancements
- **three**: 3D graphics library
- **zustand**: Lightweight state management

### UI Framework
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Fast development server and bundler
- **typescript**: Type safety and enhanced developer experience
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL database driver

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with ES modules
- **Development Server**: Vite dev server with HMR on port 5000
- **Database**: Configured for PostgreSQL via environment variables

### Production Build
- **Frontend Build**: Vite builds optimized static assets
- **Backend Build**: ESBuild compiles server code with external packages
- **Deployment Target**: Autoscale deployment on Replit infrastructure
- **Port Configuration**: External port 80 maps to internal port 5000

### Database Configuration
- **ORM**: Drizzle with PostgreSQL dialect
- **Migrations**: Schema changes tracked in ./migrations directory
- **Schema**: User authentication system ready for expansion
- **Connection**: Serverless-compatible database driver

## Changelog
- October 28, 2025. Implemented automatic multi-agent drone swarm system with leader-follower algorithm where fleet drones continuously follow the main drone in V-formation
- October 28, 2025. Fixed altitude control bug where fleet drones would climb to 40,000+ altitude; implemented PD controller with velocity damping for stable hovering
- October 25, 2025. Added procedural scene generation system with 6 scene templates (park, disaster, building interior, urban, forest, warehouse)
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.