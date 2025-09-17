import './App.css';
import Button from './components/Button/Button';
import Text from './components/Text/Text';
import { RsuitsTable } from './components/RsuitsTable';
import Layout from './components/Layout/Layout';
import Container from './components/Layout/Container/Container';
import Divider from './components/Layout/Divider/Divider';
import Grid from './components/Layout/Grid/Grid';
import Stack from './components/Layout/Stack/Stack';
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

      {/* Demo of new Layout/Container/Divider/Grid/Stack components */}
      <div style={{ marginTop: 24 }}>
        <h1>Layout Demo</h1>
        <Layout
          header={<div style={{ padding: '12px 16px', background: '#111827', color: '#fff' }}>Header</div>}
          sidebar={<div style={{ padding: 16, background: '#f3f4f6', height: '100%' }}>Sidebar</div>}
          footer={<div style={{ padding: '12px 16px', background: '#111827', color: '#fff' }}>Footer</div>}
        >
          <Container fluid style={{ padding: 16 }}>
            <Stack direction="column" spacing={12}>
              <div>
                <Text variant="h3">Content Area</Text>
              </div>
              <Divider>Grid</Divider>
              <Grid>
                <Grid.Row gutter={16}>
                  <Grid.Col span={8}>
                    <div style={{ background: '#bfdbfe', height: 40 }} />
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <div style={{ background: '#93c5fd', height: 40 }} />
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <div style={{ background: '#60a5fa', height: 40 }} />
                  </Grid.Col>
                </Grid.Row>
              </Grid>
              <Divider />
              <Stack direction="row" spacing={12} align="center">
                <div style={{ width: 60, height: 40, background: '#fecaca' }} />
                <div style={{ width: 60, height: 40, background: '#fca5a5' }} />
                <div style={{ width: 60, height: 40, background: '#f87171' }} />
              </Stack>
            </Stack>
          </Container>
        </Layout>
      </div>
      <div>
        <StatusMessages/>
      </div>
    </>
  );
}

export default App;
