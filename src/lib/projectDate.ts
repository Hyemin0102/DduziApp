export const formatProjectDate = (d: string | null | undefined) => {
  if (!d) return null;
  const [y, m, day] = d.split('-');
  return `${y}.${parseInt(m)}.${parseInt(day)}`;
};

export const getProjectDateLabel = (
  isCompleted: boolean,
  startedAt: string | null | undefined,
  completedAt: string | null | undefined,
) =>
  isCompleted
    ? startedAt || completedAt
      ? `${formatProjectDate(startedAt) ?? ''} ~ ${formatProjectDate(completedAt) ?? ''}`
      : null
    : formatProjectDate(startedAt);
