export interface Validator {
    /**
     * Validate the download result. It should throw `ValidationError` if validation failed.
     *
     * @param fd The file desciprtor
     * @param destination The result file
     * @param url The url where the file downloaded from
     */
    validate(fd: number, destination: string, url: string): Promise<void>;
}
export declare class ChecksumValidator implements Validator {
    protected checksum?: ChecksumValidatorOptions | undefined;
    constructor(checksum?: ChecksumValidatorOptions | undefined);
    validate(fd: number, destination: string, url: string): Promise<void>;
}
export declare function isValidator(options?: Validator | ChecksumValidatorOptions): options is Validator;
export declare function resolveValidator(options?: ChecksumValidatorOptions | Validator): Validator;
export interface ChecksumValidatorOptions {
    algorithm: string;
    hash: string;
}
export declare class ZipValidator implements Validator {
    validate(fd: number, destination: string, url: string): Promise<void>;
}
export declare class JsonValidator implements Validator {
    validate(fd: number, destination: string, url: string): Promise<void>;
}
export declare class ValidationError extends Error {
    readonly error: string;
    constructor(error: string, message?: string);
}
export declare class ChecksumNotMatchError extends ValidationError {
    readonly algorithm: string;
    readonly expect: string;
    readonly actual: string;
    readonly file: string;
    readonly source?: string | undefined;
    constructor(algorithm: string, expect: string, actual: string, file: string, source?: string | undefined);
}
//# sourceMappingURL=validator.d.ts.map