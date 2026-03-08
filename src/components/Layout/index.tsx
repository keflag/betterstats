/**
 * @fileName index.tsx
 * @description 布局组件，包含 Sidebar 和 Content
 * @author keflag
 * @createDate 2026-03-08 11:13:32
 * @lastUpdateDate 2026-03-08 12:30:00
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useLocation, history } from 'umi';
import { useAuth, UserRole } from '@/contexts/AuthContext';

const { Sider, Content } = Layout;
const { Text } = Typography;

/**
 * @componentName MainLayout
 * @description 主布局组件
 */
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { hasRole } = useAuth();

  /**
   * @functionName getMenuItems
   * @description 根据角色获取菜单项
   */
  const getMenuItems = () => {
    const items = [
      {
        key: '/home',
        icon: <DashboardOutlined />,
        label: '统计面板',
      },
    ];

    // 平台管理员菜单
    if (hasRole(UserRole.PLATFORM_ADMIN)) {
      items.push(
        {
          key: '/schools',
          icon: <HomeOutlined />,
          label: '学校管理',
        },
        {
          key: '/users',
          icon: <TeamOutlined />,
          label: '用户管理',
        },
        {
          key: '/data',
          icon: <BarChartOutlined />,
          label: '数据管理',
        },
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: '系统设置',
        }
      );
    }

    // 学校管理员菜单
    if (hasRole(UserRole.SCHOOL_ADMIN) && !hasRole(UserRole.PLATFORM_ADMIN)) {
      items.push(
        {
          key: '/school-users',
          icon: <TeamOutlined />,
          label: '本校用户',
        },
        {
          key: '/school-data',
          icon: <BarChartOutlined />,
          label: '本校数据',
        },
        {
          key: '/school-settings',
          icon: <SettingOutlined />,
          label: '学校设置',
        }
      );
    }

    // 教师菜单
    if (hasRole(UserRole.TEACHER) && !hasRole(UserRole.SCHOOL_ADMIN, UserRole.PLATFORM_ADMIN)) {
      items.push(
        {
          key: '/class-data',
          icon: <TeamOutlined />,
          label: '班级数据',
        },
        {
          key: '/reports',
          icon: <BarChartOutlined />,
          label: '统计报告',
        }
      );
    }

    // 学生菜单
    if (hasRole(UserRole.STUDENT) && !hasRole(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.PLATFORM_ADMIN)) {
      items.push(
        {
          key: '/my-data',
          icon: <BarChartOutlined />,
          label: '我的数据',
        },
        {
          key: '/submit-data',
          icon: <SettingOutlined />,
          label: '提交数据',
        }
      );
    }

    return items;
  };

  /**
   * @functionName handleMenuClick
   * @description 处理菜单点击
   */
  const handleMenuClick = ({ key }: { key: string }) => {
    history.push(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        collapsedWidth={48}
        theme="light"
        style={{
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
          overflow: 'auto',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {collapsed ? (
            <MenuFoldOutlined onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 18, color: '#1890ff', cursor: 'pointer' }} />
          ) : (
            <Text strong style={{ fontSize: 18, color: '#1890ff', cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
              BetterStats
            </Text>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Content
        style={{
          margin: '16px',
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          minHeight: 'calc(100vh - 32px)',
          overflow: 'auto',
        }}
      >
        {children}
      </Content>
    </Layout>
  );
};

export default MainLayout;
