import { useEffect, useRef, useState } from "react";
import { Terminal, X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";

interface ConsoleMessage {
  id: string;
  timestamp: Date;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
}

export default function Console() {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Capture console output
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addMessage = (type: 'log' | 'error' | 'warn' | 'info', args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      const newMessage: ConsoleMessage = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type,
        message
      };

      setMessages(prev => [...prev.slice(-99), newMessage]); // Keep last 100 messages
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      addMessage('log', args);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addMessage('error', args);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addMessage('warn', args);
    };

    console.info = (...args) => {
      originalInfo.apply(console, args);
      addMessage('info', args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearConsole = () => {
    setMessages([]);
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'error': return '#ff6b6b';
      case 'warn': return '#ffd93d';
      case 'info': return '#4ecdc4';
      default: return '#e5e5e5';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'rgba(10, 10, 10, 0.95)',
      color: '#e5e5e5'
    }}>
      {/* Console Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(30, 30, 30, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal className="h-4 w-4" style={{ color: '#4ecdc4' }} />
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Console</span>
          <span style={{ 
            fontSize: '12px', 
            color: '#888',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {messages.length} messages
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearConsole}
            style={{ 
              color: '#888', 
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '12px',
              padding: '4px 8px'
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Console Messages */}
      <div 
        ref={consoleRef}
        style={{
          flex: 1,
          padding: '8px',
          overflow: 'auto',
          fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          fontSize: '13px',
          lineHeight: '1.4'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ 
            color: '#666', 
            textAlign: 'center', 
            marginTop: '40px',
            fontStyle: 'italic'
          }}>
            Console output will appear here...
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              style={{ 
                marginBottom: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: msg.type === 'error' ? 'rgba(255, 107, 107, 0.1)' : 
                           msg.type === 'warn' ? 'rgba(255, 217, 61, 0.1)' : 
                           'transparent',
                borderLeft: `3px solid ${getMessageColor(msg.type)}`
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span style={{ 
                  color: '#666', 
                  fontSize: '11px',
                  minWidth: '60px',
                  marginTop: '1px'
                }}>
                  {formatTimestamp(msg.timestamp)}
                </span>
                <span style={{ 
                  color: getMessageColor(msg.type),
                  fontSize: '11px',
                  fontWeight: 'bold',
                  minWidth: '45px',
                  textTransform: 'uppercase'
                }}>
                  {msg.type}
                </span>
                <pre style={{ 
                  color: getMessageColor(msg.type),
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  flex: 1
                }}>
                  {msg.message}
                </pre>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}