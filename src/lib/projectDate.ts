export const formatProjectDate = (d: string | null | undefined) => {
  if (!d) return null;
  const [y, m, day] = d.split('-');
  return `${y}.${parseInt(m)}.${parseInt(day)}`;
};

export const getProjectDateLabel = (
  isCompleted: boolean,
  startedAt: string | null | undefined,
  completedAt: string | null | undefined,
) => {
  if (isCompleted) {
    return startedAt || completedAt
      ? `${formatProjectDate(startedAt) ?? ''} ~ ${formatProjectDate(completedAt) ?? ''}`
      : null;
  }
  // startedAt이 없으면 예정 상태 — 날짜 영역 자체를 안 보여줌(호출부에서 falsy 체크로 숨김)
  return startedAt ? `${formatProjectDate(startedAt)} ~` : null;
};
