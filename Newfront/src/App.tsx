import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { DarkModeProvider } from './context/DarkModeContext.tsx';

function App() {
  return (
    <DarkModeProvider>
      {/* SVG Filter for Glass Distortion */}
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="glass-distortion">
            <feTurbulence type="turbulence" baseFrequency="0.008" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="77" />
          </filter>
        </defs>
      </svg>
      
      <RouterProvider router={router} />
    </DarkModeProvider>
  );
}

export default App;