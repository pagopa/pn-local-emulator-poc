import express from 'express';
import * as t from 'io-ts';
import * as T from 'fp-ts/Task';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { isObject } from '@pagopa/ts-commons/lib/types';
import * as Problem from './Problem';

export type Handler = (req: express.Request, res: express.Response) => t.Validation<T.Task<express.Response>>;

export const toExpressHandler =
  (handler: Handler): express.Handler =>
  (req, res) =>
    pipe(
      handler(req, res),
      E.mapLeft((errors) => T.of(res.status(400).send(Problem.fromErrors(errors)))),
      E.toUnion,
      (task) => task()
    );

/**
 * Return an object filtering out keys that point to null values.
 */
export const removeNullValues = <T, K extends keyof T>(input: T): T => {
  if (Array.isArray(input)) {
    return input.map(removeNullValues) as T;
  } else if (isObject(input)) {
    return Object.keys(input)
      .filter((key) => input[key as K] !== null)
      .reduce((acc, k) => ({ ...acc, [k]: removeNullValues(input[k]) }), {} as T);
  } else {
    return input;
  }
};
