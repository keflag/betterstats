/**
 * @fileName home.tsx
 * @description 首页/统计面板，所有角色通用
 * @author keflag
 * @createDate 2026-03-08 11:16:31
 * @lastUpdateDate 2026-03-08 11:16:31
 * @version 1.0.0
 */

import React from 'react';
import { Card, Row, Col, Statistic, Typography, Badge } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SchoolOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import MainLayout from '@/components/Layout';
import { AuthGuard } from '@/components/AuthGuard';

const { Title, Text } = Typography;

/**
 * @componentName HomePage
 * @description 首页组件
 */
const HomePage: React.FC = () => {
  const { user, hasRole } = useAuth();

  /**
   * @functionName getWelcomeMessage
   * @description 获取欢迎消息
   */
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = '你好';
    if (hour < 12) greeting = '早上好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';

    const roleName = {
      [UserRole.PLATFORM_ADMIN]: '平台管理员',
      [UserRole.SCHOOL_ADMIN]: '学校管理员',
      [UserRole.TEACHER]: '老师',
      [UserRole.STUDENT]: '同学',
    }[user?.role || UserRole.STUDENT];

    return `${greeting}，${user?.account}${roleName}`;
  };

  /**
   * @functionName getStatsCards
   * @description 根据角色获取统计卡片
   */
  const getStatsCards = () => {
    // 平台管理员统计
    if (hasRole(UserRole.PLATFORM_ADMIN)) {
      return [
        { title: '学校总数', value: 128, icon: <SchoolOutlined />, color: '#1890ff' },
        { title: '用户总数', value: 5680, icon: <UserOutlined />, color: '#52c41a' },
        { title: '教师人数', value: 420, icon: <TeamOutlined />, color: '#faad14' },
        { title: '学生人数', value: 5260, icon: <TeamOutlined />, color: '#eb2f96' },
      ];
    }

    // 学校管理员统计
    if (hasRole(UserRole.SCHOOL_ADMIN)) {
      return [
        { title: '班级总数', value: 24, icon: <TeamOutlined />, color: '#1890ff' },
        { title: '教师人数', value: 45, icon: <UserOutlined />, color: '#52c41a' },
        { title: '学生人数', value: 680, icon: <TeamOutlined />, color: '#faad14' },
        { title: '今日活跃', value: 520, icon: <BarChartOutlined />, color: '#eb2f96' },
      ];
    }

    // 教师统计
    if (hasRole(UserRole.TEACHER)) {
      return [
        { title: '班级数量', value: 3, icon: <TeamOutlined />, color: '#1890ff' },
        { title: '学生人数', value: 120, icon: <UserOutlined />, color: '#52c41a' },
        { title: '待批改作业', value: 25, icon: <BarChartOutlined />, color: '#faad14' },
        { title: '本周报告', value: 5, icon: <BarChartOutlined />, color: '#eb2f96' },
      ];
    }

    // 学生统计
    return [
      { title: '我的排名', value: 15, icon: <RiseOutlined />, color: '#1890ff', suffix: '/120' },
      { title: '作业完成率', value: 95, icon: <BarChartOutlined />, color: '#52c41a', suffix: '%' },
      { title: '量化分', value: 88, icon: <FallOutlined />, color: '#faad14' },
      { title: '待提交作业', value: 3, icon: <BarChartOutlined />, color: '#eb2f96' },
    ];
  };

  const statsCards = getStatsCards();

  return (
    <AuthGuard>
      <MainLayout>
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>{getWelcomeMessage()}</Title>
          <Text type="secondary">今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</Text>
        </div>

        <Row gutter={[16, 16]}>
          {statsCards.map((card, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card hoverable>
                <Statistic
                  title={card.title}
                  value={card.value}
                  prefix={
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: `${card.color}15`,
                        color: card.color,
                        marginRight: 12,
                      }}
                    >
                      {card.icon}
                    </div>
                  }
                  suffix={card.suffix}
                  valueStyle={{ color: card.color, fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={16}>
            <Card title="最近活动" extra={<a href="#">查看更多</a>}>
              <div style={{ padding: '20px 0' }}>
                <Badge status="success" text="系统运行正常" />
                <br />
                <br />
                <Text type="secondary">暂无更多活动记录</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="快捷入口">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hasRole(UserRole.PLATFORM_ADMIN) && (
                  <>
                    <a href="/schools">→ 管理学校</a>
                    <a href="/users">→ 管理用户</a>
                    <a href="/data">→ 查看数据</a>
                  </>
                )}
                {hasRole(UserRole.SCHOOL_ADMIN) && !hasRole(UserRole.PLATFORM_ADMIN) && (
                  <>
                    <a href="/school-users">→ 本校用户</a>
                    <a href="/school-data">→ 本校数据</a>
                    <a href="/school-settings">→ 学校设置</a>
                  </>
                )}
                {hasRole(UserRole.TEACHER) && !hasRole(UserRole.SCHOOL_ADMIN, UserRole.PLATFORM_ADMIN) && (
                  <>
                    <a href="/class-data">→ 班级数据</a>
                    <a href="/reports">→ 统计报告</a>
                  </>
                )}
                {hasRole(UserRole.STUDENT) && !hasRole(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.PLATFORM_ADMIN) && (
                  <>
                    <a href="/my-data">→ 我的数据</a>
                    <a href="/submit-data">→ 提交数据</a>
                  </>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </MainLayout>
    </AuthGuard>
  );
};

export default HomePage;
