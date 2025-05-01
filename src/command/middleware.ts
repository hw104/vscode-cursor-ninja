import { CommandMiddleware } from "./command";

export const commandTimer = <T>(): CommandMiddleware<T> => {
  return async (next, command) => {
    const label = `command execution: ${
      command.command
    }: ${crypto.randomUUID()}`;
    console.time(label);
    const res = await next();
    console.timeEnd(label);
    return res;
  };
};
