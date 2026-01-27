import { forwardRef } from 'react';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Label for the input
   */
  label?: string;
  /**
   * Additional class name for the label
   */
  labelClassName?: string;
  /**
   * Helper text shown below the input
   */
  helperText?: string;
  /**
   * Error message (also sets error styling)
   */
  error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, labelClassName, helperText, error, className = '', id, ...props }, ref) => {
    const inputId = id || `text-input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={labelClassName || 'text-xs font-medium text-gray-700'}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="text"
          className={`
            w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white
            border rounded-lg placeholder:text-gray-400
            focus:outline-none focus:ring-1 transition-colors
            ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-200 focus:border-gray-300 focus:ring-gray-200'
            }
            ${className}
          `}
          {...props}
        />
        {(helperText || error) && (
          <span className={`text-[11px] ${error ? 'text-red-600' : 'text-gray-500'}`}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;
