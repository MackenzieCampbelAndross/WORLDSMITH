export class TimeoutError extends Error {
  constructor(message = "The operation timed out.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function isTimeout(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
  message?: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(message)), milliseconds);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
