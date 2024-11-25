import React, { FC, MouseEventHandler, useState } from 'react';
import { createRoot } from 'react-dom/client';

type ButtonProps = {
  open: boolean;
  onClick: MouseEventHandler;
};

const Button: FC<ButtonProps> = ({ open, onClick }) => {
  const spanStyle: React.CSSProperties = {
    width: '100%',
    height: '3px',
    left: 0,
    background: '#000',
  };
  const span1Style: React.CSSProperties = {
    ...spanStyle,
  };
  const span2Style: React.CSSProperties = {
    ...spanStyle,
  };
  const span3Style: React.CSSProperties = {
    ...spanStyle,
  };
  return (
    <button type="button" onClick={onClick}>
      <span style={span1Style}></span>
      <span style={span2Style}></span>
      <span style={span3Style}></span>
    </button>
  );
};

type NavProps = {
  open: boolean;
};

const Nav: FC<NavProps> = ({ open }) => {
  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  };
  const ulStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };
  return (
    <nav style={navStyle}>
      <ul style={ulStyle}>
        <li>aaa</li>
        <li>bbb</li>
        <li>ccc</li>
        <li>ddd</li>
      </ul>
    </nav>
  );
};

const NavBar: FC = () => {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div>
      <Button open={open} onClick={toggle} />
      {open ? <Nav open={open} /> : ''}
    </div>
  );
};

const domNode = document.querySelector('#navbar')!;
const root = createRoot(domNode);

root.render(<NavBar />);
