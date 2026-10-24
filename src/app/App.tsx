import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers';
import { AppRouter } from './router';

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  );
};

export default App;
