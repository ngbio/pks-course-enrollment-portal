import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/authenticate.js';
import { validated, type Pagination } from '../../middleware/validate.js';
import { paginated, sendData } from '../../utils/response.js';
import {
  toEnrollment,
  toMyEnrollment,
  toAdminEnrollment,
} from './enrollment.mapper.js';
import type { EnrollmentService } from './enrollment.service.js';
import type {
  EnrollRequestDto,
  EnrollmentListRequestDto,
} from './enrollment.schema.js';
export function enrollmentController(service: EnrollmentService) {
  return {
    enroll: async (_req: Request, res: Response) =>
      sendData(
        res,
        toEnrollment(
          await service.enroll(
            currentUser(res).id,
            validated<EnrollRequestDto>(res).params.id,
          ),
        ),
        201,
      ),
    mine: async (_req: Request, res: Response) => {
      const { query } = validated<{ query: Pagination }>(res);
      const { items, total } = await service.mine(currentUser(res).id, query);
      res.json(
        paginated(items.map(toMyEnrollment), total, query.page, query.limit),
      );
    },
    forCourse: async (_req: Request, res: Response) => {
      const { params, query } = validated<EnrollmentListRequestDto>(res);
      const { items, total } = await service.forCourse(params.id, query);
      res.json(
        paginated(items.map(toAdminEnrollment), total, query.page, query.limit),
      );
    },
  };
}
