import React from 'react';
import { Button, Text } from '../../../components';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px' }}>
      <Text variant="h1">Main</Text>
      <Text variant="body">Simple navigation demo.</Text>
      <div style={{ marginTop: '12px' }}>
        <Button width={160} color="primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    </div>
  );
}

export default LandingPage;
