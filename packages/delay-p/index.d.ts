export default function delayP(ms: number): Promise<true>;
export default function delayP<T>(ms: number, val: T): Promise<T>;
