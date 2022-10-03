import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import * as http from './adapters/http/application';
import * as inMemory from './adapters/inMemory';
import { parseConfig } from './config';
import { makeLogger } from './logger';
import { GetChecklistResultUseCase } from './useCases/GetChecklistResultUseCase';
import { PreLoadUseCase } from './useCases/PreLoadUseCase';
import { UploadToS3UseCase } from './useCases/UploadToS3UseCase';
import { SendNotificationUseCase } from './useCases/SendNotificationUseCase';
import { CreateEventStreamUseCase } from './useCases/CreateEventStreamUseCase';
import { CheckNotificationStatusUseCase } from './useCases/CheckNotificationStatusUseCase';
import { PreLoadRecord } from './domain/PreLoadRepository';
import { UploadToS3Record } from './domain/UploadToS3RecordRepository';
import { NewNotificationRecord } from './domain/NewNotificationRepository';
import { CheckNotificationStatusRecord } from './domain/CheckNotificationStatusRepository';
import { CreateEventStreamRecord } from './domain/CreateEventStreamRecordRepository';
import { ConsumeEventStreamRecord } from './domain/ConsumeEventStreamRecordRepository';
import { ConsumeEventStreamUseCase } from './useCases/ConsumeEventStreamUseCase';

pipe(
  parseConfig(process.env),
  E.map((config) => {
    const logger = makeLogger();
    /* put here the driven adapters (e.g.: Repositories ) */
    const preLoadRecordRepository = inMemory.makeRepository(logger)<PreLoadRecord>([]);
    const uploadToS3RecordRepository = inMemory.makeRepository(logger)<UploadToS3Record>([]);
    const newNotificationRepository = inMemory.makeRepository(logger)<NewNotificationRecord>([]);
    const createEventStreamRecordRepository = inMemory.makeRepository(logger)<CreateEventStreamRecord>([]);
    const checkNotificationStatusRepository = inMemory.makeRepository(logger)<CheckNotificationStatusRecord>([]);
    const consumeEventStreamRepository = inMemory.makeRepository(logger)<ConsumeEventStreamRecord>([]);
    /* init the use cases */
    const preLoadUseCase = PreLoadUseCase(config.server.uploadToS3URL, preLoadRecordRepository);
    const uploadToS3UseCase = UploadToS3UseCase(uploadToS3RecordRepository);
    const sendNotificationUseCase = SendNotificationUseCase(newNotificationRepository);
    const createEventStreamUseCase = CreateEventStreamUseCase(createEventStreamRecordRepository);
    const checkNotificationStatusUseCase = CheckNotificationStatusUseCase(
      2, // TODO: numberOfWaitingBeforeComplete move this value into configuration
      newNotificationRepository,
      checkNotificationStatusRepository,
      consumeEventStreamRepository
    );
    const consumeEventStreamUseCase = ConsumeEventStreamUseCase(
      2, // TODO: numberOfWaitingBeforeComplete move this value into configuration
      newNotificationRepository,
      checkNotificationStatusRepository,
      consumeEventStreamRepository
    );
    const getChecklistResultUseCase = GetChecklistResultUseCase(preLoadRecordRepository, uploadToS3RecordRepository);

    /* initialize all the driving adapters (e.g.: HTTP API ) */
    const application = http.makeApplication(
      preLoadUseCase,
      uploadToS3UseCase,
      sendNotificationUseCase,
      createEventStreamUseCase,
      checkNotificationStatusUseCase,
      consumeEventStreamUseCase,
      getChecklistResultUseCase
    );
    http.startApplication(logger, config, application);
  }),
  E.fold(
    (error) => void makeLogger().error(error),
    (_) => _
  )
);
