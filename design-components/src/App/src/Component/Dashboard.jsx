import React from 'react';
import { Button, Text } from '../../../components';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' },
    { id: 4, name: 'Diana Prince', email: 'diana@example.com' },
    { id: 5, name: 'Ethan Hunt', email: 'ethan@example.com' },
    { id: 6, name: 'Fiona Gallagher', email: 'fiona@example.com' },
    { id: 7, name: 'George Martin', email: 'george@example.com' },
    { id: 8, name: 'Hannah Lee', email: 'hannah@example.com' },
    { id: 9, name: 'Ian Wright', email: 'ian@example.com' },
    { id: 10, name: 'Jane Doe', email: 'jane@example.com' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Text variant="h1">Dashboard</Text>
      <Text variant="body">Simple navigation demo.</Text>

      <div style={{ marginTop: '24px' }}>
        <Text variant="h2">User List</Text>
        <div style={{ marginTop: '12px' }}>
          {users.map(user => (
            <div key={user.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <Text variant="body">
                  {user.name} — {user.email}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: '12px' }}>
        <Button width={120} color="secondary" onClick={() => navigate('/')}>Go Back</Button>
      </div>
    </div>
  );
};

export default Dashboard;
