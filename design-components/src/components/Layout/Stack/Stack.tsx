import React from 'react';
import { Stack } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface LayoutStackProps {
  direction?: 'row' | 'column';
  spacing?: number;
  justifyContent?: 'start' | 'center' | 'end' | 'space-around' | 'space-between';
  alignItems?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  wrap?: boolean;
}

const LayoutStack: React.FC<LayoutStackProps> = ({
  direction = 'row',
  spacing = 10,
  justifyContent = 'start',
  alignItems = 'center',
  wrap = false,
}) => {
  return (
    <Stack
      direction={direction}
      spacing={spacing}
      justifyContent={justifyContent}
      alignItems={alignItems}
      wrap={wrap}
      style={{
        border: '1px solid #ddd',
        padding: 16,
        minHeight: 120,
        background: '#f9f9f9',
      }}
    >
      <Box label="Item 1" />
      <Box label="Item 2" />
      <Box label="Item 3" />
    </Stack>
  );
};

const Box = ({ label }: { label: string }) => (
  <div
    style={{
      width: 80,
      height: 60,
      background: '#3498ff',
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
    }}
  >
    {label}
  </div>
);

export default LayoutStack;
