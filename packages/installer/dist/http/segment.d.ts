export interface Segment {
    start: number;
    end: number;
}
export interface SegmentPolicy {
    computeSegments(contentLength: number): Segment[];
}
export declare function isSegmentPolicy(segmentOptions?: SegmentPolicy | DefaultSegmentPolicyOptions): segmentOptions is SegmentPolicy;
export declare function resolveSegmentPolicy(segmentOptions?: SegmentPolicy | DefaultSegmentPolicyOptions): SegmentPolicy;
export interface DefaultSegmentPolicyOptions {
    /**
     * The minimum bytes a segment should have.
     * @default 2MB
     */
    segmentThreshold?: number;
}
export declare class DefaultSegmentPolicy implements SegmentPolicy {
    readonly segmentThreshold: number;
    readonly concurrency: number;
    constructor(segmentThreshold: number, concurrency: number);
    computeSegments(total: number): Segment[];
}
//# sourceMappingURL=segment.d.ts.map