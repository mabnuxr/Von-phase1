import React from 'react';
import Button from '../../../components/Button';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Dummy data
  const dummyUsers = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
  }));

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome, {user?.name || user?.email}</h1>
        <Button width={100} color="danger" onClick={logout}>
          Logout
        </Button>
      </header>

      <main style={{ marginTop: '30px' }}>
        <h2>User List</h2>
        <ul>
          {dummyUsers.map((u) => (
            <li key={u.id} style={{ marginBottom: '10px' }}>
              <strong>{u.name}</strong> — {u.email}
            </li>
          ))}
        </ul>
      </main>

      {/* Additional Logout button at the bottom */}
      <div style={{ marginTop: '20px' }}>
        <Button width={120} color="secondary" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
