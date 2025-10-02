import './App.css';
import { Button } from './components/Button';
import { Text } from './components/Text';
import { Heading } from './components/Heading';
import { Stack } from './components/Stack';
import { Container } from './components/Container';
import { Box } from './components/Box';
import { colors } from './theme';

function App() {
  return (
    <Container maxWidth="lg">
      <Stack direction="vertical" gap="xl">
        <Box paddingY={4}>
          <Heading level="h1" color="primary">
            Design System Demo
          </Heading>
          <Text variant="body" color="secondary">
            A showcase of the new design components with theme tokens
          </Text>
        </Box>

        <Box padding={6} backgroundColor={colors.neutral[50]} borderRadius="lg">
          <Heading level="h2">Button Component</Heading>
          <Stack direction="horizontal" gap="md" wrap>
            <Button variant="primary" onClick={() => alert('Primary clicked!')}>
              Primary Button
            </Button>
            <Button variant="secondary" onClick={() => alert('Secondary clicked!')}>
              Secondary Button
            </Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger" onClick={() => alert('Delete action triggered')}>
              Delete
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </Stack>
        </Box>

        <Box padding={6} backgroundColor={colors.primary[50]} borderRadius="lg">
          <Heading level="h2">Typography Components</Heading>
          <Stack direction="vertical" gap="md">
            <Heading level="h1">Heading 1</Heading>
            <Heading level="h2">Heading 2</Heading>
            <Heading level="h3">Heading 3</Heading>
            <Text variant="body">
              This is body text using the Text component with design tokens.
            </Text>
            <Text variant="bodySmall" color="secondary">
              This is smaller body text with secondary color.
            </Text>
            <Text variant="caption">This is caption text.</Text>
            <Text variant="label">Form Label</Text>
          </Stack>
        </Box>

        <Box padding={6} backgroundColor={colors.success[50]} borderRadius="lg" border borderColor={colors.success[300]}>
          <Heading level="h2">Layout Components</Heading>
          <Text variant="body">
            All components use the Stack, Container, and Box layout primitives with consistent spacing from design tokens.
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}

export default App;
