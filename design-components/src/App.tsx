import './App.css';
import Button from './components/Button/Button';
import Text from './components/Text/Text';

function App() {
  return (
    <>
      <div>
        <h1>Button Component</h1>
        <Button color="primary" width={200} onClick={() => alert('Clicked!')}>
          Click Me
        </Button>

        <Button color="danger" width={200} onClick={() => alert('Delete action triggered')}>
          Delete
        </Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1>Text Component</h1>
        <Text variant="h1" color="black">
          Heading one Text
        </Text>
        <Text variant="h2" color="blue">
          Heading two Text
        </Text>
        <Text variant="body" color="aqua">
          Body Text
        </Text>
        <Text variant="caption" color="orange">
          Caption text
        </Text>
      </div>
    </>
  );
}

export default App;
