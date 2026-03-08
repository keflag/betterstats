/**
 * @fileName databaseClient.ts
 * @description 前端数据库客户端，用于与后端数据库服务通信
 * @author keflag
 * @createDate 2026-03-08 09:38:44
 * @lastUpdateDate 2026-03-08 09:38:44
 * @version 1.0.0
 */

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
