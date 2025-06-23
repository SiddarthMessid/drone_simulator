# 3D Drone Flight Simulation

## Overview

This is a real-time 3D drone flight simulation application that allows users to control a virtual drone using keyboard inputs and customize its flight behavior through a Python-like PID controller code editor. The application features realistic physics simulation, wind effects, and visual telemetry data.

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

## Data Flow

1. **User Input**: Keyboard controls captured by React Three Drei's KeyboardControls
2. **Control Processing**: Inputs mapped to desired drone setpoints (pitch, roll, yaw, throttle)
3. **PID Calculation**: Custom PID controller calculates motor outputs based on current state vs setpoints
4. **Physics Update**: DronePhysics applies forces, torques, and environmental effects
5. **Visual Update**: 3D scene renders updated drone position and orientation
6. **Telemetry Update**: UI displays current flight parameters

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
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.