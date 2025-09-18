import React from 'react';
import { Grid, Row, Col } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface LayoutGridProps {
  columns?: number;
  gutter?: number;
  responsive?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  fluid?: boolean;
}

const LayoutGrid: React.FC<LayoutGridProps> = ({
  columns = 3,
  gutter = 16,
  responsive = { xs: 24, sm: 12, md: 8 },
  fluid = true,
}) => {
  const cols = Array.from({ length: columns }).map((_, i) => (
    <Col
      key={i}
      xs={responsive.xs}
      sm={responsive.sm}
      md={responsive.md}
      lg={responsive.lg}
      style={{
        background: '#f5f5f5',
        border: '1px solid #ccc',
        padding: 10,
        textAlign: 'center',
      }}
    >
      Col {i + 1}
    </Col>
  ));

  return (
    <Grid fluid={fluid}>
      <Row gutter={gutter}>{cols}</Row>
    </Grid>
  );
};

export default LayoutGrid;
