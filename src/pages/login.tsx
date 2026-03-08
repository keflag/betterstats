/**
 * @fileName login.tsx
 * @description 登录页面，使用Ant Design组件，毛玻璃效果
 * @author keflag
 * @createDate 2026-03-08 10:16:02
 * @lastUpdateDate 2026-03-08 10:27:28
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Spin } from 'antd';
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
 * @description 登录页面组件，毛玻璃效果，无滚动条
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
            history.push('/home');
        } catch (error) {
            message.error(error instanceof Error ? error.message : '登录失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
            }}
        >
            <Spin spinning={loading} size="large">
                <div
                    style={{
                        width: 420,
                        padding: '40px',
                        borderRadius: 16,
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <DatabaseOutlined
                            style={{
                                fontSize: 64,
                                color: '#fff',
                                marginBottom: 16,
                            }}
                        />
                        <Title 
                            level={3} 
                            style={{ 
                                margin: 0, 
                                marginBottom: 8,
                                color: '#fff',
                            }}
                        >
                            BetterStats
                        </Title>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
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
                                prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.5)' }} />}
                                placeholder="用户名"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: 'none',
                                    borderRadius: 8,
                                }}
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
                                prefix={<LockOutlined style={{ color: 'rgba(0, 0, 0, 0.5)' }} />}
                                placeholder="密码"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: 'none',
                                    borderRadius: 8,
                                }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                size="large"
                                style={{
                                    borderRadius: 8,
                                    height: 48,
                                    fontSize: 16,
                                    fontWeight: 500,
                                }}
                            >
                                登录
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                            安全认证基于 HTTP-Only + Secure Cookie
                        </Text>
                    </div>
                </div>
            </Spin>
        </div>
    );
};

export default LoginPage;
