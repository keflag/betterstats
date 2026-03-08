/**
 * @fileName login.tsx
 * @description 登录页面，使用Ant Design组件
 * @author keflag
 * @createDate 2026-03-08 10:16:02
 * @lastUpdateDate 2026-03-08 10:16:02
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, DatabaseOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { databaseClient } from '@/utils/databaseClient';

const { Title, Text } = Typography;

/**
 * @interface LoginFormValues
 * @description 登录表单值接口
 */
interface LoginFormValues {
    username: string;
    password: string;
}

/**
 * @componentName LoginPage
 * @description 登录页面组件
 * @return JSX.Element 登录页面
 */
const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [form] = Form.useForm();

    /**
     * @functionName handleLogin
     * @description 处理登录提交
     * @params:values LoginFormValues 表单值
     */
    const handleLogin = async (values: LoginFormValues): Promise<void> => {
        setLoading(true);
        try {
            // 初始化会话（使用HTTP-Only Cookie）
            await databaseClient.initSession();
            
            message.success('登录成功！');
            
            // 跳转到首页
            history.push('/');
        } catch (error) {
            message.error(error instanceof Error ? error.message : '登录失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
            }}
        >
            <Spin spinning={loading} size="large">
                <Card
                    style={{
                        width: 420,
                        borderRadius: 8,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    }}
                    bodyStyle={{ padding: '40px' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <DatabaseOutlined
                            style={{
                                fontSize: 64,
                                color: '#1890ff',
                                marginBottom: 16,
                            }}
                        />
                        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                            BetterStats
                        </Title>
                        <Text type="secondary">
                            数据库统计管理系统
                        </Text>
                    </div>

                    <Form
                        form={form}
                        name="login"
                        onFinish={handleLogin}
                        autoComplete="off"
                        size="large"
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                {
                                    required: true,
                                    message: '请输入用户名',
                                },
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="用户名"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: '请输入密码',
                                },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="密码"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                size="large"
                            >
                                登录
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            安全认证基于 HTTP-Only + Secure Cookie
                        </Text>
                    </div>
                </Card>
            </Spin>
        </div>
    );
};

export default LoginPage;

