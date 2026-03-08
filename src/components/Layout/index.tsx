/**
 * @fileName index.tsx
 * @description 布局组件，包含Sidebar、Header和Content
 * @author keflag
 * @createDate 2026-03-08 11:13:32
 * @lastUpdateDate 2026-03-08 11:13:32
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useLocation, history } from 'umi';
import { useAuth, UserRole } from '@/contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

/**
 * @componentName MainLayout
 * @description 主布局组件
 */
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

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

  /**
   * @functionName handleLogout
   * @description 处理登出
   */
  const handleLogout = async () => {
    await logout();
    history.push('/login');
  };

  /**
   * @functionName getRoleName
   * @description 获取角色名称
   */
  const getRoleName = (role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      [UserRole.PLATFORM_ADMIN]: '平台管理员',
      [UserRole.SCHOOL_ADMIN]: '学校管理员',
      [UserRole.TEACHER]: '教师',
      [UserRole.STUDENT]: '学生',
    };
    return roleMap[role] || role;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
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
          <Text strong style={{ fontSize: collapsed ? 14 : 18, color: '#1890ff' }}>
            {collapsed ? 'BS' : 'BetterStats'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              cursor: 'pointer',
              fontSize: 18,
              color: '#666',
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Space size={24}>
            <Badge count={5} size="small">
              <BellOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                {!collapsed && (
                  <div style={{ lineHeight: 1.2 }}>
                    <Text strong style={{ display: 'block' }}>
                      {user?.account}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {user?.role && getRoleName(user.role)}
                    </Text>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
