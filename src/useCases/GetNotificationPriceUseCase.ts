import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { ApiKey } from '../generated/definitions/ApiKey';
import {
  GetNotificationPriceRecord,
  makeGetNotificationPriceRecord,
} from '../domain/GetNotificationPriceRecordRepository';
import { computeSnapshot } from '../domain/Snapshot';
import { SystemEnv } from './SystemEnv';

// TODO: Apply the Reader monad to the environment.
export const GetNotificationPriceUseCase =
  (env: SystemEnv) =>
  (apiKey: ApiKey) =>
  (paTaxId: string) =>
  (noticeCode: string): TE.TaskEither<Error, GetNotificationPriceRecord['output']> =>
    pipe(
      TE.of(computeSnapshot(env)),
      TE.ap(env.createNotificationRequestRecordRepository.list()),
      TE.ap(env.findNotificationRequestRecordRepository.list()),
      TE.ap(env.consumeEventStreamRecordRepository.list()),
      TE.map((snapshot) =>
        makeGetNotificationPriceRecord({
          ...env,
          request: { apiKey, paTaxId, noticeCode },
          snapshot,
        })
      ),
      // TE.chain(env.consumeEventStreamRecordRepository.insert),
      TE.map(({ output }) => output)
    );

export type GetNotificationPriceUseCase = ReturnType<typeof GetNotificationPriceUseCase>;