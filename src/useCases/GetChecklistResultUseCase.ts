import { pipe } from 'fp-ts/lib/function';
import * as Apply from 'fp-ts/Apply';
import * as RA from 'fp-ts/ReadonlyArray';
import * as TE from 'fp-ts/TaskEither';
import { ChecklistResult, evalChecklist } from '../domain/checklist/types';
import { sendPaymentNotificationChecklist } from '../domain/checklist/sendPaymentNotificationChecklist';
import { SystemEnv } from './SystemEnv';

export const GetChecklistResultUseCase =
  ({ preLoadRecordRepository, uploadToS3RecordRepository, createNotificationRequestRecordRepository }: SystemEnv) =>
  (): TE.TaskEither<Error, ChecklistResult> =>
    pipe(
      Apply.sequenceS(TE.ApplySeq)({
        preLoadList: preLoadRecordRepository.list(),
        uploadList: uploadToS3RecordRepository.list(),
        createNotificationRequestList: createNotificationRequestRecordRepository.list(),
      }),
      TE.map(({ preLoadList, uploadList, createNotificationRequestList }) => ({
        sendPaymentNotificationChecklistIn: pipe(
          preLoadList,
          RA.concatW(uploadList),
          RA.concatW(createNotificationRequestList)
        ),
      })),
      TE.map(({ sendPaymentNotificationChecklistIn }) =>
        evalChecklist(sendPaymentNotificationChecklist)(sendPaymentNotificationChecklistIn)
      )
    );

export type GetChecklistResultUseCase = ReturnType<typeof GetChecklistResultUseCase>;
