import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import * as O from 'fp-ts/Option';
import { flow, pipe } from 'fp-ts/function';
import {
  GetPaymentNotificationMetadataRecord,
  makePaymentNotificationAttachmentDownloadMetadataResponse,
} from '../domain/GetPaymentNotificationMetadataRecordRepository';
import { ApiKey } from '../generated/definitions/ApiKey';
import { Iun } from '../generated/definitions/Iun';
import { authorizeApiKey } from '../domain/authorize';
import { computeSnapshot } from '../domain/Snapshot';
import { NotificationPaymentAttachment } from '../generated/definitions/NotificationPaymentAttachment';
import { NotificationPaymentInfo } from '../generated/definitions/NotificationPaymentInfo';
import { SystemEnv } from './SystemEnv';

// FIXME: The attachmentName type should be an enum -> check type generated by openapi
const getNotificationPaymentAttachment =
  (attachmentName: string) =>
  (payment: NotificationPaymentInfo): O.Option<NotificationPaymentAttachment> => {
    switch (attachmentName) {
      case 'F24_FLAT':
        return O.fromNullable(payment.f24flatRate);
      case 'F24_STANDARD':
        return O.fromNullable(payment.f24standard);
      case 'PAGOPA':
        return O.fromNullable(payment.pagoPaForm);
      default:
        return O.none;
    }
  };

export const GetPaymentNotificationMetadataUseCase =
  (env: SystemEnv) =>
  (apiKey: ApiKey) =>
  (iun: Iun) =>
  (recipientId: number) =>
  (attachmentName: string): TE.TaskEither<Error, GetPaymentNotificationMetadataRecord['output']> =>
    pipe(
      authorizeApiKey(apiKey),
      E.map(() =>
        pipe(
          TE.of(computeSnapshot(env)),
          TE.ap(env.createNotificationRequestRecordRepository.list()),
          TE.ap(env.findNotificationRequestRecordRepository.list()),
          TE.ap(env.consumeEventStreamRecordRepository.list()),
          TE.map(
            flow(
              RA.filterMap(O.fromEither),
              RA.chain((notification) => (notification.iun === iun ? notification.recipients : RA.empty)),
              RA.filterMap((recipient) => O.fromNullable(recipient.payment)),
              RA.findLastMap(getNotificationPaymentAttachment(attachmentName)),
              O.map(makePaymentNotificationAttachmentDownloadMetadataResponse(env)),
              O.map((paymentAttachment) => ({ statusCode: 200 as const, returned: paymentAttachment })),
              O.getOrElseW(() => ({ statusCode: 404 as const, returned: undefined }))
            )
          )
        )
      ),
      flow(E.sequence(TE.ApplicativePar), TE.map(E.toUnion)),
      TE.map((output) => ({
        type: 'GetPaymentNotificationMetadataRecord' as const,
        input: { apiKey, iun, recipientId, attachmentName },
        output,
      })),
      TE.chain(env.getPaymentNotificationMetadataRecordRepository.insert),
      TE.map((record) => record.output)
    );

export type GetPaymentNotificationMetadataUseCase = ReturnType<typeof GetPaymentNotificationMetadataUseCase>;
