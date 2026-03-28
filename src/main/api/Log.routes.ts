import { deleteLogFile, getLogFiles, readLogFile } from '../core/process/FileLogger';
import { err, ok } from '../core/RestAPI';
import { defineRoute, RouteMap } from '../shared/types/RestAPI.types';

export const LogRoutes: RouteMap = {
  logs_list: defineRoute('logs_list', ({ res, params }) => {
    ok(res, getLogFiles(params.id));
  }),

  logs_read: defineRoute('logs_read', ({ res, params }) => {
    const files = getLogFiles(params.id);
    const file = files.find((f) => f.filename === params.filename);
    if (!file) return err(res, 'Log file not found', 404);
    ok(res, { filename: file.filename, content: readLogFile(file.filePath) });
  }),

  logs_delete: defineRoute('logs_delete', ({ res, params }) => {
    const files = getLogFiles(params.id);
    const file = files.find((f) => f.filename === params.filename);
    if (!file) return err(res, 'Log file not found', 404);
    deleteLogFile(file.filePath);
    ok(res);
  }),
};
