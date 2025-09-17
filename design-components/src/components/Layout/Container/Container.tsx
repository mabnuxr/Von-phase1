import React from 'react';
import { Container, Header, Content, Footer, Sidebar } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface LayoutContainerProps {
  showHeader?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  sidebarPosition?: 'left' | 'right';
  headerText?: string;
  footerText?: string;
  sidebarContent?: React.ReactNode;
  content?: React.ReactNode;
  height?: number | string;
}

const LayoutContainer: React.FC<LayoutContainerProps> = ({
  showHeader = true,
  showFooter = true,
  showSidebar = false,
  sidebarPosition = 'left',
  headerText = 'Header',
  footerText = 'Footer',
  sidebarContent = <div>Sidebar</div>,
  content = <div>Main content goes here</div>,
  height = '400px'
}) => {
  const layout = (
    <Container style={{ border: '1px solid #ddd', height }}>
      {showHeader && <Header style={{ padding: 10, background: '#f5f5f5' }}>{headerText}</Header>}

      <Container>
        {showSidebar && sidebarPosition === 'left' && (
          <Sidebar width={200} style={{ background: '#f7f7f7', padding: 10 }}>
            {sidebarContent}
          </Sidebar>
        )}

        <Content style={{ padding: 10 }}>{content}</Content>

        {showSidebar && sidebarPosition === 'right' && (
          <Sidebar width={200} style={{ background: '#f7f7f7', padding: 10 }}>
            {sidebarContent}
          </Sidebar>
        )}
      </Container>

      {showFooter && <Footer style={{ padding: 10, background: '#f5f5f5' }}>{footerText}</Footer>}
    </Container>
  );

  return layout;
};

export default LayoutContainer;
