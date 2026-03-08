/**
 * @fileName databaseClient.ts
 * @description 前端数据库服务客户端，基于HTTP-Only Cookie认证
 * @author keflag
 * @createDate 2026-03-08 09:42:20
 * @lastUpdateDate 2026-03-08 10:06:11
 * @version 3.0.0
 */

// 从服务器配置文件导入配置
const SERVER_PORT = 17342;
const API_BASE_URL = `http://localhost:${SERVER_PORT}`;

/**
 * @constant VALID_IDENTIFIER_REGEX
 * @description 有效的标识符正则表达式（表名、列名）
 */
const VALID_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * @constant DEFAULT_OPTIONS
 * @description 默认fetch选项，包含credentials
 */
const DEFAULT_OPTIONS: RequestInit = {
    credentials: 'include', // 自动携带cookie
    headers: {
        'Content-Type': 'application/json',
    },
};

/**
 * @interface QueryResult
 * @description 查询结果接口
 */
interface QueryResult {
    rows: any[];
    rowCount: number;
}

/**
 * @interface TableDataResult
 * @description 表数据查询结果接口
 */
interface TableDataResult {
    data: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * @interface SingleRecordResult
 * @description 单条记录查询结果接口
 */
interface SingleRecordResult {
    data: any;
}

/**
 * @interface InitResult
 * @description 初始化结果接口
 */
interface InitResult {
    success: boolean;
    message: string;
}

/**
 * @functionName initSession
 * @description 初始化会话，获取访问权限
 * @return Promise<InitResult> 初始化结果
 * @example await initSession();
 */
async function initSession(): Promise<InitResult> {
    const response = await fetch(`${API_BASE_URL}/api/init`, {
        method: 'POST',
        ...DEFAULT_OPTIONS,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '初始化失败');
    }

    return response.json();
}

/**
 * @functionName logout
 * @description 退出登录，清除会话
 * @return Promise<void>
 * @example await logout();
 */
async function logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        ...DEFAULT_OPTIONS,
    });
}

/**
 * @functionName checkHealth
 * @description 检查数据库服务健康状态
 * @return Promise<boolean> 服务是否正常
 * @example const isHealthy = await checkHealth();
 */
async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

/**
 * @functionName executeQuery
 * @description 执行SQL查询（只允许SELECT语句）
 * @params:sql string SQL查询语句
 * @params:params any[] 查询参数
 * @return Promise<QueryResult> 查询结果
 * @example const result = await executeQuery('SELECT * FROM users WHERE id = $1', [1]);
 */
async function executeQuery(sql: string, params: any[] = []): Promise<QueryResult> {
    const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        ...DEFAULT_OPTIONS,
        body: JSON.stringify({ sql, params }),
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error('会话已过期，请重新初始化');
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '查询执行失败');
    }

    return response.json();
}

/**
 * @functionName getTableData
 * @description 获取表数据（带分页）
 * @params:tableName string 表名
 * @params:page number 页码，默认1
 * @params:limit number 每页数量，默认10
 * @params:orderBy string 排序字段
 * @params:order string 排序方向，ASC或DESC
 * @return Promise<TableDataResult> 表数据结果
 * @example const data = await getTableData('users', 1, 20, 'created_at', 'DESC');
 */
async function getTableData(
    tableName: string,
    page: number = 1,
    limit: number = 10,
    orderBy?: string,
    order: string = 'ASC'
): Promise<TableDataResult> {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (orderBy) {
        queryParams.append('orderBy', orderBy);
        queryParams.append('order', order);
    }

    const response = await fetch(
        `${API_BASE_URL}/api/table/${encodeURIComponent(tableName)}?${queryParams}`,
        DEFAULT_OPTIONS
    );

    if (response.status === 401 || response.status === 403) {
        throw new Error('会话已过期，请重新初始化');
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取表数据失败');
    }

    return response.json();
}

/**
 * @functionName getRecordById
 * @description 根据ID获取单条记录
 * @params:tableName string 表名
 * @params:id number 记录ID
 * @return Promise<SingleRecordResult> 单条记录
 * @example const user = await getRecordById('users', 1);
 */
async function getRecordById(tableName: string, id: number): Promise<SingleRecordResult> {
    const response = await fetch(
        `${API_BASE_URL}/api/table/${encodeURIComponent(tableName)}/${id}`,
        DEFAULT_OPTIONS
    );

    if (response.status === 401 || response.status === 403) {
        throw new Error('会话已过期，请重新初始化');
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取记录失败');
    }

    return response.json();
}

/**
 * @functionName validateTableName
 * @description 验证表名是否合法（前端校验）
 * @params:tableName string 表名
 * @return boolean 是否合法
 */
function validateTableName(tableName: string): boolean {
    return VALID_IDENTIFIER_REGEX.test(tableName);
}

/**
 * @functionName validateColumnName
 * @description 验证列名是否合法（前端校验）
 * @params:columnName string 列名
 * @return boolean 是否合法
 */
function validateColumnName(columnName: string): boolean {
    return VALID_IDENTIFIER_REGEX.test(columnName);
}

// 导出数据库客户端API
export const databaseClient = {
    initSession,
    logout,
    checkHealth,
    executeQuery,
    getTableData,
    getRecordById,
    validateTableName,
    validateColumnName,
};

export default databaseClient;

