import React from 'react';
import { vi } from "vitest";
import { render } from '@testing-library/react';
import App from './App';

vi.mock("./services/documentParser", () => ({
  parseDocument: vi.fn(), // on mocke juste la fonction publique
}));

test('renders without crashing', () => {
  const { baseElement } = render(<App />);
  expect(baseElement).toBeDefined();
});
