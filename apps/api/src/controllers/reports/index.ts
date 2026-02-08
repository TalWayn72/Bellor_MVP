/**
 * Reports Controller - barrel export
 */
export { ReportsController } from '../reports.controller.js';
export {
  createReportBodySchema,
  listReportsQuerySchema,
  reviewReportBodySchema,
  reportIdParamsSchema,
  reportUserParamsSchema,
} from './reports-schemas.js';
export type {
  CreateReportBody,
  ListReportsQuery,
  ReviewReportBody,
  ReportIdParams,
  ReportUserParams,
} from './reports-schemas.js';
