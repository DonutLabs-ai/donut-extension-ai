// Jest全局函数和类型的声明文件
import '@types/jest';

// 如果没有显式导入Jest，确保Jest全局变量可用
declare global {
  const describe: jest.Describe;
  const it: jest.It;
  const test: jest.It;
  const expect: jest.Expect;
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
}

// ES模块导出
export {}; 