import type { Request, Response } from 'express';
import type { CourseService } from './course.service.js';
import type {
  CourseQuery,
  CreateCourseRequestDto,
  UpdateCourseRequestDto,
} from './course.schema.js';
import { validated } from '../../middleware/validate.js';
import { paginated, sendData } from '../../utils/response.js';
import {
  toAdminCourse,
  toCourseDetail,
  toCourseList,
} from './course.mapper.js';
export function courseController(service: CourseService, admin = false) {
  return {
    list: async (_req: Request, res: Response) => {
      const { query } = validated<{ query: CourseQuery }>(res);
      const { items, total } = await service.list(query, admin);
      res.json(
        paginated(
          items.map(admin ? toAdminCourse : toCourseList),
          total,
          query.page,
          query.limit,
        ),
      );
    },
    detail: async (_req: Request, res: Response) => {
      const course = await service.detail(
        validated<{ params: { id: number } }>(res).params.id,
        admin,
      );
      sendData(res, admin ? toAdminCourse(course) : toCourseDetail(course));
    },
    categories: async (_req: Request, res: Response) =>
      sendData(res, await service.categories()),
    create: async (_req: Request, res: Response) =>
      sendData(
        res,
        toAdminCourse(
          await service.create(
            validated<{ body: CreateCourseRequestDto }>(res).body,
          ),
        ),
        201,
      ),
    update: async (_req: Request, res: Response) => {
      const input = validated<{
        params: { id: number };
        body: UpdateCourseRequestDto;
      }>(res);
      sendData(
        res,
        toAdminCourse(await service.update(input.params.id, input.body)),
      );
    },
    remove: async (_req: Request, res: Response) => {
      await service.remove(
        validated<{ params: { id: number } }>(res).params.id,
      );
      res.status(204).end();
    },
  };
}
