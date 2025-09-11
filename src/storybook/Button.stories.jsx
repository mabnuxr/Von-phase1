
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
            options: ['primary', 'secondry', 'danger'],
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

export const secondry ={
    args: {
        color: "secondry",
        children: "Secondry Button"
    },
};

export const danger ={
    args: {
        color: "danger",
        children: "Delete",
    },
};

