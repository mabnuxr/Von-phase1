import Text from "../components/Text/Text";

export default {
  title: "components/Text",
  component: Text,
  args: {
    children: "Text Here",
    variant: "body",
    color: "#111827",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["h1", "h2", "h3", "body", "caption"],
    },
    color: { control: "color" },
  },
};

export const Heading1 = {
  args: {
    variant: "h1",
    children: "Heading one",
  },
};

export const Heading2 = {
  args: {
    variant: "h2",
    children: "Heading two",
  },
};

export const Body = {
  args: {
    variant: "body",
    children: "This is the body text",
  },
};

export const Caption = {
  args: {
    variant: "caption",
    children: "Small caption text",
  },
};
