export const deletedMsgs: Set<{
  id: string;
  execId: string;
  date: number;
  content: string;
  prevDate: number;
}> = new Set();
