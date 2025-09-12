
import Button from '../components/Button/Button';

export default {
    title: 'components/Button',
    component: Button,
    args:{
        Children:"Click Me",
        color: 'primary',
        width: 150
    },
    argTypes:{
        color:{
            control: 'select',
            options: ['primary', 'secondary', 'danger'],
        },
        width: { control: "text" },
        onClick: { action: "clicked" }
    }
};

export const primary ={
    args: {
        color: "primary",
        children: "Primary Button",
  },
};

export const secondary ={
    args: {
        color: "secondary",
        children: "Secondary Button"
    },
};

export const danger ={
    args: {
        color: "danger",
        children: "Delete",
    },
};

