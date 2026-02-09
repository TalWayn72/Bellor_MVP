/**
 * Accessibility Tests for Image Components
 *
 * Tests WCAG 2.1 AA compliance for images including:
 * - Alt text requirements
 * - Decorative images
 * - Complex images
 * - Image maps
 * - Responsive images
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Image - Accessibility', () => {
  it('should have no violations with proper alt text', async () => {
    const { container } = render(
      <img src="/test-image.jpg" alt="A scenic mountain view at sunset" />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have meaningful alt text', () => {
    render(<img src="/logo.png" alt="Bellor - Dating App Logo" />);

    const img = screen.getByRole('img', { name: 'Bellor - Dating App Logo' });
    expect(img).toBeInTheDocument();
  });

  it('should support decorative images with empty alt', async () => {
    const { container } = render(
      <img src="/decorative-line.svg" alt="" role="presentation" />
    );

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('role', 'presentation');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle decorative images with aria-hidden', async () => {
    const { container } = render(
      <img src="/decoration.png" alt="" aria-hidden="true" />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support images in links with proper context', async () => {
    const { container } = render(
      <a href="/profile">
        <img src="/user-avatar.jpg" alt="View John Doe's profile" />
      </a>
    );

    const link = screen.getByRole('link', { name: "View John Doe's profile" });
    expect(link).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle images with figure and figcaption', async () => {
    const { container } = render(
      <figure>
        <img src="/chart.png" alt="Sales chart showing 25% growth in Q4" />
        <figcaption>Q4 2024 Sales Performance</figcaption>
      </figure>
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Sales chart showing 25% growth in Q4');

    const caption = screen.getByText('Q4 2024 Sales Performance');
    expect(caption).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support responsive images with srcset', async () => {
    const { container } = render(
      <img
        src="/image.jpg"
        srcSet="/image-320.jpg 320w, /image-640.jpg 640w, /image-1280.jpg 1280w"
        sizes="(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px"
        alt="Responsive image description"
      />
    );

    const img = screen.getByRole('img', { name: 'Responsive image description' });
    expect(img).toHaveAttribute('srcset');
    expect(img).toHaveAttribute('sizes');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle loading states with aria-busy', async () => {
    const { container } = render(
      <div role="img" aria-label="Loading profile image" aria-busy="true">
        <div className="skeleton-loader" />
      </div>
    );

    const placeholder = screen.getByRole('img', { name: 'Loading profile image' });
    expect(placeholder).toHaveAttribute('aria-busy', 'true');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support SVG images with title and desc', async () => {
    const { container } = render(
      <svg role="img" aria-labelledby="svg-title svg-desc">
        <title id="svg-title">Upload Icon</title>
        <desc id="svg-desc">Click to upload a file</desc>
        <path d="M10 20v-6h4l-7-7-7 7h4v6h6z" />
      </svg>
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-labelledby', 'svg-title svg-desc');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle avatar images with fallback', async () => {
    const { container } = render(
      <div>
        <img
          src="/avatar.jpg"
          alt="Sarah Johnson"
          onError={(e) => {
            e.currentTarget.src = '/default-avatar.png';
          }}
        />
      </div>
    );

    const img = screen.getByRole('img', { name: 'Sarah Johnson' });
    expect(img).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support background images with text alternative', async () => {
    const { container } = render(
      <div
        role="img"
        aria-label="Sunset over the ocean"
        style={{ backgroundImage: 'url(/sunset.jpg)' }}
      >
        <span className="sr-only">Sunset over the ocean</span>
      </div>
    );

    const bgImage = screen.getByRole('img', { name: 'Sunset over the ocean' });
    expect(bgImage).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle image galleries accessibly', async () => {
    const { container } = render(
      <div role="region" aria-label="Photo gallery">
        <img src="/photo1.jpg" alt="Family gathering at the park" />
        <img src="/photo2.jpg" alt="Birthday celebration with cake" />
        <img src="/photo3.jpg" alt="Vacation at the beach" />
      </div>
    );

    const gallery = screen.getByRole('region', { name: 'Photo gallery' });
    expect(gallery).toBeInTheDocument();

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle lazy-loaded images', async () => {
    const { container } = render(
      <img src="/placeholder.jpg" alt="Product image" loading="lazy" />
    );

    const img = screen.getByRole('img', { name: 'Product image' });
    expect(img).toHaveAttribute('loading', 'lazy');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should require alt attribute for all images', async () => {
    const { container } = render(
      <img src="/test.jpg" alt="Test image" />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle icon images with aria-label', async () => {
    const { container } = render(
      <button aria-label="Delete">
        <img src="/trash-icon.svg" alt="" role="presentation" />
      </button>
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support image buttons with descriptive alt', async () => {
    const { container } = render(
      <button>
        <img src="/search-icon.svg" alt="Search" />
      </button>
    );

    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle complex images with longdesc', async () => {
    const { container } = render(
      <>
        <img
          src="/complex-chart.png"
          alt="Annual revenue chart"
          aria-describedby="chart-description"
        />
        <div id="chart-description">
          Detailed description: The chart shows revenue growth from $1M in 2020
          to $5M in 2024, with steady quarterly increases.
        </div>
      </>
    );

    const img = screen.getByRole('img', { name: 'Annual revenue chart' });
    expect(img).toHaveAttribute('aria-describedby', 'chart-description');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Image - Error States', () => {
  it('should handle broken images gracefully', async () => {
    const { container } = render(
      <img
        src="/broken-image.jpg"
        alt="Profile photo"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );

    const img = screen.getByRole('img', { name: 'Profile photo' });
    expect(img).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should provide fallback for missing images', async () => {
    const { container } = render(
      <div>
        <img src="/missing.jpg" alt="User avatar" />
        <noscript>
          <img src="/static-fallback.jpg" alt="User avatar (fallback)" />
        </noscript>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Image - Context and Grouping', () => {
  it('should group related images with proper labels', async () => {
    const { container } = render(
      <section aria-label="Product images">
        <h2>Product Photos</h2>
        <div role="group" aria-label="Main product images">
          <img src="/product-front.jpg" alt="Product front view" />
          <img src="/product-side.jpg" alt="Product side view" />
          <img src="/product-back.jpg" alt="Product back view" />
        </div>
      </section>
    );

    const imageGroup = screen.getByRole('group', { name: 'Main product images' });
    expect(imageGroup).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle thumbnail galleries', async () => {
    const { container } = render(
      <div role="region" aria-label="Thumbnail navigation">
        <button aria-label="View image 1 of 3">
          <img src="/thumb1.jpg" alt="" role="presentation" />
        </button>
        <button aria-label="View image 2 of 3">
          <img src="/thumb2.jpg" alt="" role="presentation" />
        </button>
        <button aria-label="View image 3 of 3">
          <img src="/thumb3.jpg" alt="" role="presentation" />
        </button>
      </div>
    );

    const thumbnails = screen.getAllByRole('button');
    expect(thumbnails).toHaveLength(3);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
