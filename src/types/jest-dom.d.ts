import '@testing-library/jest-dom';

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeInTheDocument(): R;
            toHaveTextContent(text: string | RegExp): R;
            toHaveValue(value: string | number | string[]): R;
            toBeVisible(): R;
            toBeDisabled(): R;
            toBeEnabled(): R;
            toHaveClass(className: string): R;
            toHaveAttribute(attr: string, value?: string): R;
            toHaveStyle(style: Record<string, any>): R;
            toContainElement(element: HTMLElement | null): R;
            toBeEmpty(): R;
            toBeEmptyDOMElement(): R;
            toBeChecked(): R;
            toBePartiallyChecked(): R;
            toHaveFocus(): R;
            toHaveFormValues(values: Record<string, any>): R;
            toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
            toBeRequired(): R;
            toBeValid(): R;
            toBeInvalid(): R;
            toHaveDescription(text?: string | RegExp): R;
            toHaveErrorMessage(text?: string | RegExp): R;
            toHaveAccessibleDescription(description?: string | RegExp): R;
            toHaveAccessibleName(name?: string | RegExp): R;
        }
    }
}

export { };
