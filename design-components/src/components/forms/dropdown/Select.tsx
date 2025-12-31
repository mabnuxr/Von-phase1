import { Dropdown } from './Dropdown';
import type { DropdownOption, DropdownProps } from './Dropdown';

export type SelectOption = DropdownOption;

export interface SelectProps extends Omit<DropdownProps, 'onChange'> {
  /**
   * Called when selection changes
   * Supports both the new (value: string) signature and legacy React.ChangeEvent
   */
  onChange?: (value: string) => void;
}

/**
 * Select component - A styled dropdown for selecting from options
 *
 * This is an alias for the Dropdown component for semantic clarity.
 * Use this when the user is selecting a single option from a list.
 */
export const Select: React.FC<SelectProps> = ({
  onChange,
  ...props
}) => {
  return (
    <Dropdown
      {...props}
      onChange={onChange}
    />
  );
};

export default Select;
