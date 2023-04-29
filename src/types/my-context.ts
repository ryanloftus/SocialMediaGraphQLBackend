import { BaseContext } from '@apollo/server';
import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { DataSource } from 'typeorm';

export type MyContext = BaseContext & {
    req: Request;
    res: Response;
    redis: Redis;
    dataSource: DataSource;
};
