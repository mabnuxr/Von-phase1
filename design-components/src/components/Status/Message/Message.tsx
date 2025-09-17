
import { Message, Stack } from 'rsuite';
import 'rsuite/dist/rsuite.min.css'; // Import RSuite styles

const StatusMessages = () => {
  return (
    <Stack direction="column" spacing={20}>
      <Message type="info" showIcon>
        This is an informational message.
      </Message>

      <Message type="success" showIcon>
        Your action was successful!
      </Message>

      <Message type="warning" showIcon closable>
        Warning: Please double-check your input.
      </Message>

      <Message type="error" showIcon closable>
        Error: Something went wrong!
      </Message>
    </Stack>
  );
};

export default StatusMessages;
