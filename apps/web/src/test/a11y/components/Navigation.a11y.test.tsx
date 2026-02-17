/**
 * Accessibility Tests for Navigation Components
 *
 * Tests WCAG 2.1 AA compliance for navigation patterns including:
 * - Semantic nav element
 * - Skip links
 * - Current page indication
 * - Keyboard navigation
 * - ARIA landmarks
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Navigation - Accessibility', () => {
  it('should have no violations with semantic nav element', async () => {
    const { container } = render(
      <nav aria-label="Main navigation">
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/contact">Contact</a>
          </li>
        </ul>
      </nav>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have navigation landmark', () => {
    render(
      <nav aria-label="Primary">
        <a href="/">Home</a>
      </nav>
    );

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
  });

  it('should indicate current page with aria-current', async () => {
    const { container } = render(
      <nav aria-label="Main">
        <a href="/">Home</a>
        <a href="/about" aria-current="page">
          About
        </a>
        <a href="/contact">Contact</a>
      </nav>
    );

    const currentLink = screen.getByRole('link', { name: 'About' });
    expect(currentLink).toHaveAttribute('aria-current', 'page');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support skip links', async () => {
    const { container } = render(
      <>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <nav aria-label="Main">
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
        <main id="main-content">
          <h1>Main Content</h1>
        </main>
      </>
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toHaveAttribute('href', '#main-content');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup();

    render(
      <nav aria-label="Main">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const aboutLink = screen.getByRole('link', { name: 'About' });
    const contactLink = screen.getByRole('link', { name: 'Contact' });

    await user.tab();
    expect(homeLink).toHaveFocus();

    await user.tab();
    expect(aboutLink).toHaveFocus();

    await user.tab();
    expect(contactLink).toHaveFocus();
  });

  it('should support nested navigation with proper labels', async () => {
    const { container } = render(
      <>
        <nav aria-label="Primary navigation">
          <a href="/">Home</a>
          <a href="/products">Products</a>
        </nav>
        <nav aria-label="Footer navigation">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </>
    );

    const primaryNav = screen.getByRole('navigation', { name: 'Primary navigation' });
    const footerNav = screen.getByRole('navigation', { name: 'Footer navigation' });

    expect(primaryNav).toBeInTheDocument();
    expect(footerNav).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle active states accessibly', async () => {
    const { container } = render(
      <nav aria-label="Main">
        <a href="/" className="active" aria-current="page">
          Home
        </a>
        <a href="/about">About</a>
      </nav>
    );

    const activeLink = screen.getByRole('link', { name: 'Home' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support dropdown menus accessibly', async () => {
    const { container } = render(
      <nav aria-label="Main">
        <button aria-expanded="false" aria-haspopup="menu">
          Menu
        </button>
        <ul role="menu" hidden>
          <li role="none">
            <a href="/option1" role="menuitem">
              Option 1
            </a>
          </li>
          <li role="none">
            <a href="/option2" role="menuitem">
              Option 2
            </a>
          </li>
        </ul>
      </nav>
    );

    const menuButton = screen.getByRole('button', { name: 'Menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle breadcrumb navigation', async () => {
    const { container } = render(
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/products">Products</a>
          </li>
          <li>
            <a href="/products/shoes" aria-current="page">
              Shoes
            </a>
          </li>
        </ol>
      </nav>
    );

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toBeInTheDocument();

    const currentPage = screen.getByRole('link', { name: 'Shoes' });
    expect(currentPage).toHaveAttribute('aria-current', 'page');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle mobile menu toggle', async () => {
    const user = userEvent.setup();
    const toggleMenu = vi.fn();

    const { container } = render(
      <>
        <button
          aria-expanded="false"
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
          onClick={toggleMenu}
        >
          Menu
        </button>
        <nav id="mobile-menu" aria-label="Mobile navigation" hidden>
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
      </>
    );

    const menuButton = screen.getByRole('button', { name: 'Toggle menu' });
    await user.click(menuButton);

    expect(toggleMenu).toHaveBeenCalled();
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Navigation - Landmarks', () => {
  it('should have proper landmark structure', async () => {
    const { container } = render(
      <>
        <header>
          <nav aria-label="Primary">
            <a href="/">Home</a>
          </nav>
        </header>
        <main>
          <h1>Main Content</h1>
        </main>
        <footer>
          <nav aria-label="Footer">
            <a href="/privacy">Privacy</a>
          </nav>
        </footer>
      </>
    );

    const header = container.querySelector('header');
    const main = screen.getByRole('main');
    const footer = container.querySelector('footer');

    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have unique labels for multiple nav landmarks', async () => {
    const { container } = render(
      <>
        <nav aria-label="Main navigation">
          <a href="/">Home</a>
        </nav>
        <nav aria-label="Secondary navigation">
          <a href="/help">Help</a>
        </nav>
      </>
    );

    const mainNav = screen.getByRole('navigation', { name: 'Main navigation' });
    const secondaryNav = screen.getByRole('navigation', { name: 'Secondary navigation' });

    expect(mainNav).toBeInTheDocument();
    expect(secondaryNav).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Navigation - Tab Navigation', () => {
  it('should support horizontal tab lists', async () => {
    const { container } = render(
      <>
        <div role="tablist" aria-label="Product tabs">
          <button role="tab" aria-selected="true" aria-controls="panel1" id="tab1">
            Description
          </button>
          <button role="tab" aria-selected="false" aria-controls="panel2" id="tab2">
            Reviews
          </button>
          <button role="tab" aria-selected="false" aria-controls="panel3" id="tab3">
            Shipping
          </button>
        </div>
        <div role="tabpanel" id="panel1" aria-labelledby="tab1">Description content</div>
        <div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>Reviews content</div>
        <div role="tabpanel" id="panel3" aria-labelledby="tab3" hidden>Shipping content</div>
      </>
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);

    const selectedTab = tabs[0];
    expect(selectedTab).toHaveAttribute('aria-selected', 'true');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should link tabs to panels correctly', async () => {
    const { container } = render(
      <>
        <div role="tablist">
          <button role="tab" aria-selected="true" aria-controls="tab-panel-1">
            Tab 1
          </button>
          <button role="tab" aria-selected="false" aria-controls="tab-panel-2">
            Tab 2
          </button>
        </div>
        <div role="tabpanel" id="tab-panel-1" aria-labelledby="tab1">
          Panel 1 content
        </div>
        <div role="tabpanel" id="tab-panel-2" aria-labelledby="tab2" hidden>
          Panel 2 content
        </div>
      </>
    );

    const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
    expect(tab1).toHaveAttribute('aria-controls', 'tab-panel-1');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Navigation - Focus Management', () => {
  it('should maintain focus visibility', async () => {
    const user = userEvent.setup();

    render(
      <nav aria-label="Main">
        <a href="/">Link 1</a>
        <a href="/page2">Link 2</a>
      </nav>
    );

    const link1 = screen.getByRole('link', { name: 'Link 1' });

    await user.tab();
    expect(link1).toHaveFocus();
  });

  it('should not trap focus in navigation', async () => {
    const user = userEvent.setup();

    render(
      <>
        <a href="#before">Before Nav</a>
        <nav aria-label="Main">
          <a href="/">Nav Link</a>
        </nav>
        <a href="#after">After Nav</a>
      </>
    );

    const beforeLink = screen.getByRole('link', { name: 'Before Nav' });
    const navLink = screen.getByRole('link', { name: 'Nav Link' });
    const afterLink = screen.getByRole('link', { name: 'After Nav' });

    await user.tab();
    expect(beforeLink).toHaveFocus();

    await user.tab();
    expect(navLink).toHaveFocus();

    await user.tab();
    expect(afterLink).toHaveFocus();
  });
});
