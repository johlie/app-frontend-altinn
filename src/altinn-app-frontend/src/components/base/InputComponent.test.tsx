import React from 'react';

import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InputComponent } from 'src/components/base/InputComponent';
import { mockDelayBeforeSaving } from 'src/components/hooks/useDelayedSavedState';
import type { IInputProps } from 'src/components/base/InputComponent';

const user = userEvent.setup();

describe('InputComponent', () => {
  it('should correct value with no form data provided', () => {
    render();
    const inputComponent = screen.getByRole('textbox');

    expect(inputComponent).toHaveValue('');
  });

  it('should have correct value with specified form data', () => {
    const simpleBindingValue = 'it123';
    render({
      formData: {
        simpleBinding: simpleBindingValue,
      },
    });
    const inputComponent = screen.getByRole('textbox') as HTMLInputElement;

    expect(inputComponent.value).toEqual(simpleBindingValue);
  });

  it('should have correct form data after user types in field', async () => {
    const typedValue = 'banana';
    render();
    const inputComponent = screen.getByRole('textbox');

    await user.type(inputComponent, typedValue);

    expect(inputComponent).toHaveValue(typedValue);
  });

  it('should call supplied dataChanged function after data change', async () => {
    const handleDataChange = jest.fn();
    const typedValue = 'test input';
    render({ handleDataChange });
    const inputComponent = screen.getByRole('textbox');

    mockDelayBeforeSaving(25);
    await user.type(inputComponent, typedValue);

    expect(inputComponent).toHaveValue(typedValue);
    expect(handleDataChange).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 25));
    expect(handleDataChange).toHaveBeenCalled();
    mockDelayBeforeSaving(undefined);
  });

  it('should call supplied dataChanged function immediately after onBlur', async () => {
    const handleDataChange = jest.fn();
    const typedValue = 'test input';
    render({ handleDataChange });
    const inputComponent = screen.getByRole('textbox');

    await user.type(inputComponent, typedValue);
    await user.tab();
    expect(inputComponent).toHaveValue(typedValue);
    expect(handleDataChange).toHaveBeenCalledWith(typedValue);
  });

  it('should render input with formatted number when this is specified', async () => {
    const handleDataChange = jest.fn();
    const inputValuePlainText = '123456';
    const inputValueFormatted = '$123,456';
    const typedValue = '789';
    const finalValuePlainText = `${inputValuePlainText}${typedValue}`;
    const finalValueFormatted = '$123,456,789';
    render({
      handleDataChange,
      formatting: {
        number: {
          thousandSeparator: true,
          prefix: '$',
        },
      },
      formData: {
        simpleBinding: inputValuePlainText,
      },
    });
    const inputComponent = screen.getByRole('textbox');
    expect(inputComponent).toHaveValue(inputValueFormatted);

    await user.type(inputComponent, typedValue);
    await user.tab();

    expect(inputComponent).toHaveValue(finalValueFormatted);
    expect(handleDataChange).toHaveBeenCalledTimes(1);
    expect(handleDataChange).toHaveBeenCalledWith(finalValuePlainText);
  });

  it('should show aria-describedby if textResourceBindings.description is present', () => {
    render({
      textResourceBindings: {
        description: 'description',
      },
    });

    const inputComponent = screen.getByRole('textbox');
    expect(inputComponent).toHaveAttribute(
      'aria-describedby',
      'description-mock-id',
    );
  });

  it('should not show aria-describedby if textResourceBindings.description is not present', () => {
    render();
    const inputComponent = screen.getByRole('textbox');

    expect(inputComponent).not.toHaveAttribute('aria-describedby');
  });

  function render(props: Partial<IInputProps> = {}) {
    const allProps = {
      id: 'mock-id',
      formData: null,
      handleDataChange: jest.fn(),
      isValid: true,
      readOnly: false,
      required: false,
      ...props,
    } as IInputProps;

    rtlRender(<InputComponent {...allProps} />);
  }
});
