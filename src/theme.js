/**
 * Ant Design Theme Configuration
 * Custom dark/indigo theme for Food App Admin
 */
const theme = {
  token: {
    colorPrimary: '#6366f1',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5',
    controlHeight: 36,
  },
  components: {
    Button: {
      controlHeight: 36,
      borderRadius: 8,
      fontWeight: 500,
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: '#64748b',
      borderColor: '#f0f0f0',
      rowHoverBg: '#f8fafc',
    },
    Card: {
      borderRadiusLG: 12,
    },
    Input: {
      controlHeight: 38,
      borderRadius: 8,
    },
    Select: {
      controlHeight: 38,
      borderRadius: 8,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Menu: {
      itemBorderRadius: 8,
    },
  },
};

export default theme;
