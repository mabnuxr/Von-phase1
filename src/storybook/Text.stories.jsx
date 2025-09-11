import Text from "../components/Text/Text";

export default {
  title: "component/title",
  component: Text,
  args: {
    Children: "Text Here",
    variant: "body",
    color: "#111827",
  },
  argsTypes: {
    variant: {
      control: "select",
      options: ["h1", "h2", "body", "caption"],
    },
    color: { cotrol: "color" },
  },
};

export const Heading1 = {
  variant: "h1",
  children: "Headig one",
};
export const Heading2 = {
  variant: "h2",
  children: "Headig two",
};
export const Body = {
  variant: "body",
  children: "this is the body text",
};
export const Caption = {
  variant: "caption",
  children: "Small caption text",
};
