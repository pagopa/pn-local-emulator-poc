import { Group } from '../reportengine/reportengine';
import * as PreLoadRecordChecks from './PreLoadRecordChecks';
import * as UploadToS3RecordChecks from './UploadToS3RecordChecks';
import * as NewNotificationRequestRecordChecks from './NewNotificationRequestRecord';

export const tcSend01 = Group({
  'Request at least two upload slots': Group({
    'Have you done at least one request': PreLoadRecordChecks.atLeastOnePreLoadRecordC,
    'Have you required at least one pdf': PreLoadRecordChecks.atLeastOnePreLoadRecordWithPdfC,
    'Have you received at least two valid slots': PreLoadRecordChecks.atLeastOnePreLoadRecordWithPdfC,
  }),
  'Upload at least two files': Group({
    'Have you upload two files using the information of previous step?':
      UploadToS3RecordChecks.atLeastTwoUploadMatchingPreLoadRecordC,
  }),
  'Create a notification request': Group({
    ...NewNotificationRequestRecordChecks.atLeastOneRequest,
    ...NewNotificationRequestRecordChecks.atLeastOneRequestWithValidRecipient,
    ...NewNotificationRequestRecordChecks.atLeastOneRegisteredLetter890,
    ...NewNotificationRequestRecordChecks.atLeastOneRequestWithValidDocuments,
    ...NewNotificationRequestRecordChecks.atLeastOneNotificationSent,
  }),
});
