import React, { useState } from 'react';
import { Login } from './components/Login';
import { POSTerminal } from './components/POSTerminal';
import { useAuthStore } from './stores/authStore';

function App() {
  const [terminalId] = useState(() => `TERM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="App">
      {isAuthenticated ? (
        <POSTerminal terminalId={terminalId} />
      ) : (
        <Login terminalId={terminalId} />
      )}
    </div>
  );
}

export default App;