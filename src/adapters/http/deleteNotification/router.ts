import { flow, pipe } from 'fp-ts/function';
import * as Apply from 'fp-ts/Apply';
import * as E from 'fp-ts/Either';
import * as t from 'io-ts';
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import express from 'express';
import { deleteNotificationRecord, persistRecord } from '../../../useCases/PersistRecord';
import { Handler, toExpressHandler } from '../Handler';
import { SystemEnv } from '../../../useCases/SystemEnv';
import { DeleteNotificationRecord, makeDeleteNotificationRecord } from '../../../domain/DeleteNotificationRecord';
import * as Problem from '../Problem';
import { IUN } from '../../../generated/pnapi/IUN';

const handler =
  (env: SystemEnv): Handler =>
  (req, res) =>
    pipe(
      Apply.sequenceS(E.Apply)({
        apiKey: t.string.decode(req.headers['x-api-key']),
        iun: IUN.decode(req.params.iun)
      }),
      E.map(flow(makeDeleteNotificationRecord(env), deleteNotificationRecord(env))),
      E.map(
        TE.fold(
          (_) => T.of(res.status(500).send(Problem.fromNumber(500))),
          (_) => T.of(res.status(202).send())
        )
      )
    );

export const makeDeleteNotificationRouter = (env: SystemEnv): express.Router => {
  const router = express.Router();

  router.put('/delivery-push/v2.1/notifications/cancel/:iun', toExpressHandler(handler(env)));

  return router;
};
