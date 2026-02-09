/**
 * Accessibility Tests for Form Components
 *
 * Tests WCAG 2.1 AA compliance for form patterns including:
 * - Label associations
 * - Error messaging
 * - Required field indicators
 * - Fieldset and legend
 * - Form validation feedback
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../../../components/ui/button';

expect.extend(toHaveNoViolations);

describe('Form - Basic Accessibility', () => {
  it('should have no violations with proper labels', async () => {
    const { container } = render(
      <form>
        <label htmlFor="username">Username</label>
        <input id="username" type="text" />

        <label htmlFor="email">Email</label>
        <input id="email" type="email" />

        <Button type="submit">Submit</Button>
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should associate labels with inputs correctly', () => {
    render(
      <form>
        <label htmlFor="first-name">First Name</label>
        <input id="first-name" type="text" />
      </form>
    );

    const input = screen.getByLabelText('First Name');
    expect(input).toBeInTheDocument();
  });

  it('should support required fields with proper ARIA', async () => {
    const { container } = render(
      <form>
        <label htmlFor="required-field">
          Required Field <span aria-label="required">*</span>
        </label>
        <input id="required-field" type="text" required aria-required="true" />
      </form>
    );

    const input = screen.getByLabelText(/required field/i);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle error states accessibly', async () => {
    const { container } = render(
      <form>
        <label htmlFor="email-error">Email</label>
        <input
          id="email-error"
          type="email"
          aria-invalid="true"
          aria-describedby="email-error-msg"
        />
        <span id="email-error-msg" role="alert">
          Please enter a valid email address
        </span>
      </form>
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error-msg');

    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toHaveTextContent('Please enter a valid email address');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should use fieldset and legend for grouped inputs', async () => {
    const { container } = render(
      <form>
        <fieldset>
          <legend>Personal Information</legend>
          <label htmlFor="fname">First Name</label>
          <input id="fname" type="text" />

          <label htmlFor="lname">Last Name</label>
          <input id="lname" type="text" />
        </fieldset>
      </form>
    );

    const fieldset = container.querySelector('fieldset');
    const legend = screen.getByText('Personal Information');

    expect(fieldset).toBeInTheDocument();
    expect(legend.tagName.toLowerCase()).toBe('legend');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle radio button groups accessibly', async () => {
    const { container } = render(
      <form>
        <fieldset>
          <legend>Choose your option</legend>
          <div>
            <input type="radio" id="option1" name="options" />
            <label htmlFor="option1">Option 1</label>
          </div>
          <div>
            <input type="radio" id="option2" name="options" />
            <label htmlFor="option2">Option 2</label>
          </div>
          <div>
            <input type="radio" id="option3" name="options" />
            <label htmlFor="option3">Option 3</label>
          </div>
        </fieldset>
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle checkbox groups accessibly', async () => {
    const { container } = render(
      <form>
        <fieldset>
          <legend>Select your interests</legend>
          <div>
            <input type="checkbox" id="interest1" name="interests" />
            <label htmlFor="interest1">Sports</label>
          </div>
          <div>
            <input type="checkbox" id="interest2" name="interests" />
            <label htmlFor="interest2">Music</label>
          </div>
          <div>
            <input type="checkbox" id="interest3" name="interests" />
            <label htmlFor="interest3">Reading</label>
          </div>
        </fieldset>
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should provide help text accessibly', async () => {
    const { container } = render(
      <form>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          aria-describedby="password-help"
        />
        <span id="password-help">
          Must be at least 8 characters with one number
        </span>
      </form>
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-describedby', 'password-help');

    const helpText = screen.getByText(/must be at least 8 characters/i);
    expect(helpText).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle select dropdowns accessibly', async () => {
    const { container } = render(
      <form>
        <label htmlFor="country">Country</label>
        <select id="country" aria-required="true" required>
          <option value="">Select a country</option>
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
          <option value="ca">Canada</option>
        </select>
      </form>
    );

    const select = screen.getByLabelText('Country');
    expect(select).toBeRequired();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle multi-step forms accessibly', async () => {
    const { container } = render(
      <form>
        <div role="progressbar" aria-valuenow={1} aria-valuemin={1} aria-valuemax={3} aria-label="Form progress">
          Step 1 of 3
        </div>

        <fieldset>
          <legend>Step 1: Personal Info</legend>
          <label htmlFor="step1-name">Name</label>
          <input id="step1-name" type="text" />
        </fieldset>

        <Button type="button">Next</Button>
      </form>
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '1');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Form - Keyboard Navigation', () => {
  it('should allow Tab navigation through form fields', async () => {
    const user = userEvent.setup();

    render(
      <form>
        <label htmlFor="field1">Field 1</label>
        <input id="field1" type="text" />

        <label htmlFor="field2">Field 2</label>
        <input id="field2" type="text" />

        <Button type="submit">Submit</Button>
      </form>
    );

    const field1 = screen.getByLabelText('Field 1');
    const field2 = screen.getByLabelText('Field 2');
    const submitBtn = screen.getByRole('button', { name: 'Submit' });

    await user.tab();
    expect(field1).toHaveFocus();

    await user.tab();
    expect(field2).toHaveFocus();

    await user.tab();
    expect(submitBtn).toHaveFocus();
  });

  it('should support Shift+Tab for reverse navigation', async () => {
    const user = userEvent.setup();

    render(
      <form>
        <label htmlFor="field1">Field 1</label>
        <input id="field1" type="text" />

        <label htmlFor="field2">Field 2</label>
        <input id="field2" type="text" />
      </form>
    );

    const field1 = screen.getByLabelText('Field 1');
    const field2 = screen.getByLabelText('Field 2');

    await user.tab();
    await user.tab();
    expect(field2).toHaveFocus();

    await user.tab({ shift: true });
    expect(field1).toHaveFocus();
  });

  it('should submit form on Enter in text input', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <label htmlFor="search">Search</label>
        <input id="search" type="text" />
        <Button type="submit">Search</Button>
      </form>
    );

    const searchInput = screen.getByLabelText('Search');
    await user.type(searchInput, 'test query{Enter}');

    expect(handleSubmit).toHaveBeenCalled();
  });
});

describe('Form - Error Handling', () => {
  it('should announce errors to screen readers', async () => {
    const { container } = render(
      <form>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-invalid="true"
          aria-describedby="email-error"
        />
        <div id="email-error" role="alert" aria-live="polite">
          Invalid email format
        </div>
      </form>
    );

    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Invalid email format');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle multiple errors accessibly', async () => {
    const { container } = render(
      <form>
        <div role="alert" aria-live="polite">
          <ul>
            <li>Username is required</li>
            <li>Email is invalid</li>
            <li>Password is too short</li>
          </ul>
        </div>

        <label htmlFor="username">Username</label>
        <input id="username" type="text" aria-invalid="true" />

        <label htmlFor="email">Email</label>
        <input id="email" type="email" aria-invalid="true" />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" aria-invalid="true" />
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should clear error state when corrected', async () => {
    const { container, rerender } = render(
      <form>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-invalid="true"
          aria-describedby="email-error"
        />
        <span id="email-error" role="alert">
          Invalid email
        </span>
      </form>
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    // Simulate correction
    rerender(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" aria-invalid="false" />
      </form>
    );

    expect(input).toHaveAttribute('aria-invalid', 'false');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Form - Autocomplete', () => {
  it('should support autocomplete attributes', async () => {
    const { container } = render(
      <form>
        <label htmlFor="name">Full Name</label>
        <input id="name" type="text" autoComplete="name" />

        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" />

        <label htmlFor="tel">Phone</label>
        <input id="tel" type="tel" autoComplete="tel" />
      </form>
    );

    const nameInput = screen.getByLabelText('Full Name');
    expect(nameInput).toHaveAttribute('autocomplete', 'name');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
