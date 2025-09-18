import './App.css';
import Button from './components/Button/Button';
import Text from './components/Text/Text';
import { RsuitsTable } from './components/RsuitsTable';
// Removed layout demo components to avoid type mismatch in app demo
import StatusMessages from './components/Status/Message/Message';

function App() {
  const tableData: import('./components/RsuitsTable/RsuitsTable').RsuitsRowData[] = [
    {
      id: 1,
      name: 'John Mitchell',
      title: 'CRO',
      target: '$26.4M',
      forecast: '$20.4M',
      commit: '$18.1M',
      children: [
        {
          id: 2,
          name: 'Maria Thompson',
          title: 'VP Sales - Enterprise',
          target: '$18.5M',
          forecast: '$7.8M',
          commit: '$7.0M',
        },
        {
          id: 3,
          name: 'Robert Anderson',
          title: 'VP Sales - Mid-Market',
          target: '$6.5M',
          forecast: '$3.2M',
          commit: '$2.8M',
        },
      ],
    },
  ];
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
        <div>
          <RsuitsTable data={tableData} />
        </div>
      </div>

      {/* layout showcase removed in app-level demo */}
      <div>
        <StatusMessages />
      </div>
    </>
  );
}

export default App;
