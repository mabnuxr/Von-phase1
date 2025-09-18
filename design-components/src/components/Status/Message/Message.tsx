const StatusMessages = () => {
  const messageStyle = {
    padding: '12px 16px',
    marginBottom: '16px',
    borderRadius: '6px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const infoStyle = {
    ...messageStyle,
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    color: '#0d47a1',
  };
  const successStyle = {
    ...messageStyle,
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    color: '#1b5e20',
  };
  const warningStyle = {
    ...messageStyle,
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    color: '#e65100',
  };
  const errorStyle = {
    ...messageStyle,
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    color: '#b71c1c',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={infoStyle}>
        <span>ℹ️</span>
        <span>This is an informational message.</span>
      </div>

      <div style={successStyle}>
        <span>✅</span>
        <span>Your action was successful!</span>
      </div>

      <div style={warningStyle}>
        <span>⚠️</span>
        <span>Warning: Please double-check your input.</span>
      </div>

      <div style={errorStyle}>
        <span>❌</span>
        <span>Error: Something went wrong!</span>
      </div>
    </div>
  );
};

export default StatusMessages;
