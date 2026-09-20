import React from 'react';
import { AuthGate } from './AuthGate';
import { AppRouter } from './router';

export const App: React.FC = () => {
  return (
    <AuthGate>
      {(onLogout) => <AppRouter onLogout={onLogout} />}
    </AuthGate>
  );
};

export default App;
