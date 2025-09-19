import { render } from '@testing-library/react';
import Placeholder from '../../components/Status/Placeholder/Placeholder';

test('renders paragraph placeholder', () => {
  render(<Placeholder type="paragraph" rows={4} />);
  expect(document.querySelector('.rs-placeholder-paragraph')).toBeInTheDocument();
});

test('renders graph placeholder as circle', () => {
  render(<Placeholder type="graph" graphType="circle" />);
  expect(document.querySelector('.rs-placeholder-graph')).toBeInTheDocument();
});

test('renders grid placeholder', () => {
  render(<Placeholder type="grid" rows={2} columns={2} />);
  expect(document.querySelector('.rs-placeholder-grid')).toBeInTheDocument();
});
