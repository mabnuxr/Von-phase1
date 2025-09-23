import React from 'react';
import { Button, Text } from '../../../components';
import { useNavigation } from 'react-router-dom';

function LandingPage() {
  const Navigation = useNavigation()
  return (
    <div>
      <h1>hi</h1>
      {/* <div style={{ padding: '20px' }}>
        <Text variant="h1">Dashboard</Text>
        <Text variant="body">Here’s your dashboard content.</Text>
        <Button onClick={()=>Navigation('/dashboard')}>Dashboard</Button>
      </div> */}
    </div>
  );
}

export default LandingPage;
