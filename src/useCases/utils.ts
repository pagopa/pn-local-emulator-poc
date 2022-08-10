import { ApiKey } from "../generated/definitions/ApiKey";
import { Response } from "../domain/types";
import * as b from "fp-ts/boolean";

// TODO: Get "key-value" from repository or configuration?
export const onValidApiKey = (apiKey: ApiKey) => <T>(valid: T): T | Response<401> => {
    return b.foldW(
        () => ({ statusCode: 401 as const, returned: undefined }),
        () => (valid)
    )(apiKey === "key-value");
}
