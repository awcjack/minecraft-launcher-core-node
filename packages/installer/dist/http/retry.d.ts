import { DownloadError } from "./error";
import { ValidationError } from "./validator";
/**
 * The handler that decide whether
 */
export interface RetryHandler {
    retry(url: string, attempt: number, error: ValidationError): boolean | Promise<boolean>;
    retry(url: string, attempt: number, error: DownloadError): boolean | Promise<boolean>;
    /**
     * You should decide whether we should retry the download again?
     *
     * @param url The current downloading url
     * @param attempt How many time it try to retry download? The first retry will be `1`.
     * @param error The error object thrown during this download. It can be {@link DownloadError} or ${@link ValidationError}.
     * @returns If we should retry and download it again.
     */
    retry(url: string, attempt: number, error: any): boolean | Promise<boolean>;
}
export interface DefaultRetryHandlerOptions {
    /**
     * The max retry count
     */
    maxRetryCount?: number;
    /**
     * Should we retry on the error
     */
    shouldRetry?: (e: any) => boolean;
}
export declare function isRetryHandler(options?: DefaultRetryHandlerOptions | RetryHandler): options is RetryHandler;
export declare function resolveRetryHandler(options?: DefaultRetryHandlerOptions | RetryHandler): RetryHandler;
/**
 * Create a simple count based retry handler
 * @param maxRetryCount The max count we should try
 * @param shouldRetry Should the error be retry
 */
export declare function createRetryHandler(maxRetryCount: number, shouldRetry: (e: any) => boolean): RetryHandler;
//# sourceMappingURL=retry.d.ts.map