import { useState } from 'react';

interface UseChatInputOptions {
  externalInputValue?: string;
  onInputValueChange?: (value: string) => void;
}

export function useChatInput({ externalInputValue, onInputValueChange }: UseChatInputOptions) {
  const [internalInputValue, setInternalInputValue] = useState('');
  const isInputControlled = externalInputValue !== undefined;
  const inputValue = isInputControlled ? externalInputValue : internalInputValue;
  const setInputValue = isInputControlled
    ? onInputValueChange || (() => {})
    : setInternalInputValue;

  return { inputValue, setInputValue };
}
