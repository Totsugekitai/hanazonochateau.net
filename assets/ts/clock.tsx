import * as React from 'react';
import { createRoot } from 'react-dom/client';

const getNow = (): number => {
  return new Date().getTime();
};

const doomsDay = new Date('2038-01-19 12:14:07+09:00').getTime();

const Clock = (): React.ReactNode => {
  const [clock, setClock] = React.useState(getNow());

  React.useEffect(() => {
    const id = setInterval(() => {
      const now = getNow();
      setClock(now);
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <h1 style={{ fontFamily: 'monospace' }}>
      {Math.floor((doomsDay - clock) / 1000)}
    </h1>
  );
};

const domNode = document.getElementById('clock');
if (domNode !== null) {
  const root = createRoot(domNode);
  root.render(<Clock />);
}
